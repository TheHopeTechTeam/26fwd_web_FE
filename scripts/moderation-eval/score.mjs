// Scores <data>/results/raw/<model>[-<tag>].jsonl against the labels in one or more card files from
// the private repo and writes <data>/results/summary-<model>[-<tag>].json. The console shows
// aggregate numbers only; card ids of misses and false flags stay in the summary file.
//
//   node scripts/moderation-eval/score.mjs --data ../26fwd-moderation-eval --model clef --tag v2 \
//     --cards cards.json,cards-others-health.json,cards-format.json
//
// Every answer scored must come from the questions in --questions and from each card's current
// text; otherwise nothing is scored (#29 review). Labels may change: scoring uses the current ones.
//
// A card is flagged for a reviewer when the model names any reason other than "none" (the rule
// adopted in #5). The needs_attention probability at 0.5 is shown for reference.
import { readFileSync } from 'node:fs'
import { relative } from 'node:path'
import { parseArgs } from 'node:util'
import { checkTag, dataFile, fail, privateDataDir, resultsDir, resultsFile, writeResultsFile } from './paths.mjs'
import { questionsVersion, staleAnswers } from './versions.mjs'

const { values: args } = parseArgs({
  options: {
    data: { type: 'string' },
    model: { type: 'string', default: 'clef' },
    tag: { type: 'string' },
    cards: { type: 'string', default: 'cards.json' },
    questions: { type: 'string', default: 'questions.json' },
  },
})
// Workers AI bills Clef by input tokens at these published neuron rates per million.
const NEURONS_PER_MILLION = { 'clef-flash': 3455, clef: 21818 }
const BENIGN_SHARES = [0.9, 0.95, 0.98]

if (!NEURONS_PER_MILLION[args.model]) fail('--model must be clef-flash or clef')
// Cards, results and the summary stay inside the private checkout (see paths.mjs).
const data = privateDataDir(args.data)
const suffix = `${args.model}${checkTag(args.tag)}`
const currentQuestions = questionsVersion(JSON.parse(readFileSync(dataFile(data, args.questions, '--questions'), 'utf8')))
const rawFile = dataFile(data, `results/raw/${suffix}.jsonl`, 'results file')
const answers = new Map()
for (const line of readFileSync(rawFile, 'utf8').split('\n').filter(Boolean)) {
  const result = JSON.parse(line)
  if (result.ok) answers.set(result.id, result)
}

const round = (value, digits = 3) => Number(value.toFixed(digits))
const ratio = (hits, total) => (total ? round(hits / total) : null)

// 95% Wilson interval: with a few dozen cards a raw rate alone overstates certainty.
function wilson(hits, total) {
  if (!total) return null
  const z = 1.96, p = hits / total
  const centre = (p + (z * z) / (2 * total)) / (1 + (z * z) / total)
  const half = (z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total))) / (1 + (z * z) / total)
  return [round(Math.max(0, centre - half)), round(Math.min(1, centre + half))]
}

function score(rows) {
  const problems = rows.filter((r) => r.expected.needs_attention)
  const ordinary = rows.filter((r) => !r.expected.needs_attention)
  const caught = problems.filter((r) => r.flagged)
  const falseFlags = ordinary.filter((r) => r.flagged)
  return {
    cards: rows.length,
    problem_cards: problems.length,
    caught: caught.length,
    recall: ratio(caught.length, problems.length),
    recall_ci95: wilson(caught.length, problems.length),
    ordinary_cards: ordinary.length,
    false_flags: falseFlags.length,
    false_flag_rate: ratio(falseFlags.length, ordinary.length),
    false_flag_rate_ci95: wilson(falseFlags.length, ordinary.length),
    reason_right: problems.filter((r) => r.reason === r.expected.reason).length,
    probability_rule: {
      caught: problems.filter((r) => r.p >= 0.5).length,
      false_flags: ordinary.filter((r) => r.p >= 0.5).length,
    },
    missed: problems.filter((r) => !r.flagged).map((r) => r.id),
    false_flag_ids: falseFlags.map((r) => r.id),
  }
}

const summary = { model: args.model, tag: args.tag ?? null, questions_version: currentQuestions, sets: {} }
const all = []
let tokens = 0
for (const file of args.cards.split(',')) {
  const cards = JSON.parse(readFileSync(dataFile(data, file, '--cards'), 'utf8'))
  const missing = cards.filter((card) => !answers.has(card.id)).length
  if (missing) fail(`${missing} cards in ${file} have no answer in ${relative(data, rawFile)}; run run.mjs first`)
  const stale = staleAnswers(cards.map((card) => answers.get(card.id)), cards, currentQuestions)
  if (stale.length) {
    fail(`${relative(data, rawFile)} cannot be scored against ${file} with ${args.questions}: ${stale.join(', ')}. Run a new batch with another --tag; answers to earlier questions can also be scored by passing the questions file they came from`)
  }
  const rows = cards.map((card) => {
    const result = answers.get(card.id)
    tokens += result.output.usage.input_tokens
    const reason = result.output.answers.reason.choice
    return { id: card.id, lang: card.lang, expected: card.expected, reason, flagged: reason !== 'none', p: result.output.answers.needs_attention.noul }
  })
  all.push(...rows)
  summary.sets[file] = { ...score(rows), by_language: { zh: score(rows.filter((r) => r.lang === 'zh')), en: score(rows.filter((r) => r.lang === 'en')) } }
}
summary.overall = score(all)

// What a reviewer would see per 1,000 real cards if the first file's rates held.
const main = summary.sets[args.cards.split(',')[0]]
summary.projection_per_1000_cards = BENIGN_SHARES.map((share) => {
  const problems = 1000 * (1 - share), caught = (main.recall ?? 0) * problems, falseFlags = (main.false_flag_rate ?? 0) * 1000 * share
  return { benign_share: share, problem_cards: round(problems, 0), caught: round(caught, 1), false_flags: round(falseFlags, 1), flagged_total: round(caught + falseFlags, 1) }
})
summary.usage = { input_tokens: tokens, estimated_neurons: Math.round((tokens * NEURONS_PER_MILLION[args.model]) / 1e6) }

const outFile = resultsFile(resultsDir(data, 'results'), `summary-${suffix}.json`)
writeResultsFile(outFile, JSON.stringify(summary, null, 2) + '\n')

const line = (name, s) => ({
  set: name,
  'problem cards caught': `${s.caught}/${s.problem_cards}`,
  'ordinary cards flagged': `${s.false_flags}/${s.ordinary_cards}`,
  'reason right': `${s.reason_right}/${s.problem_cards}`,
  'p ≥ 0.5 (reference)': `${s.probability_rule.caught}/${s.problem_cards} · ${s.probability_rule.false_flags}/${s.ordinary_cards}`,
})
console.log(`${args.model}${args.tag ? ` (${args.tag})` : ''} · questions ${currentQuestions} · ${all.length} cards · ~${summary.usage.estimated_neurons} neurons`)
console.table([...Object.entries(summary.sets).map(([name, s]) => line(name, s)), line('overall', summary.overall)])
console.log(`summary: ${relative(process.cwd(), outFile)}`)
