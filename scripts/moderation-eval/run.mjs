// Sends synthetic cards to one Clef model through the local proxy and appends the raw answers to
// <data>/results/raw/<model>[-<tag>].jsonl. Cards already in that file are skipped, so an
// interrupted run resumes by running the same command again; but only while every answer there
// came from the current questions and card text. Otherwise it stops, and the batch needs a new
// --tag (#29 review).
//
// The cards, the questions (prompt) and the results live in the private repo
// TheHopeTechTeam/26fwd-moderation-eval, checked out OUTSIDE this public repo (#5, Ian 10/19).
//
//   npx wrangler dev --config scripts/moderation-eval/proxy/wrangler.jsonc --ip 127.0.0.1 --port 8787
//   node scripts/moderation-eval/run.mjs --data ../26fwd-moderation-eval --model clef --cards cards.json --tag v2
import { appendFileSync, readFileSync } from 'node:fs'
import { relative } from 'node:path'
import { parseArgs } from 'node:util'
import { checkTag, dataFile, fail, openResultsLog, privateDataDir, resultsDir, resultsFile } from './paths.mjs'
import { cardVersion, modelState, questionsVersion, staleAnswers } from './versions.mjs'

const { values: args } = parseArgs({
  options: {
    data: { type: 'string' },
    model: { type: 'string' },
    cards: { type: 'string', default: 'cards.json' },
    questions: { type: 'string', default: 'questions.json' },
    tag: { type: 'string' },
    ids: { type: 'string' },
    limit: { type: 'string' },
    concurrency: { type: 'string', default: '3' },
    endpoint: { type: 'string', default: 'http://127.0.0.1:8787' },
  },
})

const MODELS = { 'clef-flash': '@cf/cloudflare/clef-flash', clef: '@cf/cloudflare/clef' }

if (!MODELS[args.model]) fail('--model must be clef-flash or clef')
// Cards, questions and results stay inside the private checkout (see paths.mjs).
const data = privateDataDir(args.data)
const tag = checkTag(args.tag)
// Card text only ever goes to the local proxy, never to another host.
if (!['127.0.0.1', 'localhost'].includes(new URL(args.endpoint).hostname)) fail('--endpoint must be a local address')

const cards = JSON.parse(readFileSync(dataFile(data, args.cards, '--cards'), 'utf8'))
const questions = JSON.parse(readFileSync(dataFile(data, args.questions, '--questions'), 'utf8'))
// Recorded with every answer, with the card's own version, so each result can be traced to the
// exact prompt and card text.
const currentQuestions = questionsVersion(questions)

const outFile = resultsFile(resultsDir(data, 'results/raw'), `${args.model}${tag}.jsonl`)
const log = openResultsLog(outFile)
const answered = readFileSync(log, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line)).filter((r) => r.ok)
const stale = staleAnswers(answered, cards, currentQuestions)
if (stale.length) {
  fail(`${relative(data, outFile)} already holds ${stale.join(', ')}. Start a new batch with another --tag, or move that file away to run this batch again`)
}
const done = new Set(answered.map((r) => r.id))

let todo = cards.filter((c) => !done.has(c.id))
if (args.ids) {
  const wanted = new Set(args.ids.split(','))
  todo = todo.filter((c) => wanted.has(c.id))
}
if (args.limit) todo = todo.slice(0, Number(args.limit))
console.log(`${args.model} · ${args.cards} · questions ${currentQuestions}: ${done.size} already in ${relative(data, outFile)}, ${todo.length} to run`)

// The model sees exactly the fields a real submission stores, nothing from the label.
const inputFor = (card) => ({ model: args.model, state: modelState(card), questions })

async function call(card) {
  for (let attempt = 1; ; attempt++) {
    const started = Date.now()
    try {
      const response = await fetch(args.endpoint, {
        method: 'POST',
        // The proxy only answers requests carrying this header (see proxy/index.js).
        headers: { 'content-type': 'application/json', 'X-FWD-Eval-Tool': 'run.mjs' },
        body: JSON.stringify({ model: MODELS[args.model], input: inputFor(card) }),
      })
      const body = await response.json()
      if (body.ok || attempt >= 3) return { ...body, attempt, wall_ms: Date.now() - started }
    } catch (error) {
      if (attempt >= 3) return { ok: false, error: String(error), attempt, wall_ms: Date.now() - started }
    }
    await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
  }
}

let next = 0
let failed = 0
async function worker() {
  while (next < todo.length) {
    const card = todo[next++]
    const result = await call(card)
    appendFileSync(log, JSON.stringify({ id: card.id, model: args.model, questions_version: currentQuestions, card_version: cardVersion(card), at: new Date().toISOString(), ...result }) + '\n')
    if (!result.ok) failed++
    console.log(`${result.ok ? 'ok  ' : 'FAIL'} ${card.id} ${result.ms ?? '-'}ms${result.ok ? '' : ` ${result.error}`}`)
  }
}
await Promise.all(Array.from({ length: Number(args.concurrency) }, worker))
console.log(`finished: ${todo.length - failed} ok, ${failed} failed`)
process.exit(failed ? 1 : 0)
