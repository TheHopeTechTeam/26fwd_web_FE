// Runs run.mjs and score.mjs on throwaway data made up here (never the private trial set), checking
// that results files cannot lead outside --data and that answers are only reused or scored for the
// current questions and card text (#29 review). No case reaches the model: every run either stops
// before calling the proxy or has nothing left to run.
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, linkSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cardVersion, questionsVersion, staleAnswers } from './versions.mjs'

const TOOLS = fileURLToPath(new URL('.', import.meta.url))
const QUESTIONS = { placeholder: 'q' }
const CARDS = [
  { id: 't1', lang: 'zh', card: { nickname: 'n1', text_gratitude: 'g1', text_anticipate: 'a1' }, expected: { needs_attention: false, reason: 'none' } },
  { id: 't2', lang: 'en', card: { nickname: 'n2', text_gratitude: 'g2', text_anticipate: 'a2' }, expected: { needs_attention: true, reason: 'r' } },
]

// What run.mjs appends for a card, answering exactly as labelled.
const answer = (card, fields = {}) => ({
  id: card.id, model: 'clef', questions_version: questionsVersion(QUESTIONS), card_version: cardVersion(card), ok: true,
  output: { answers: { reason: { choice: card.expected.reason }, needs_attention: { noul: card.expected.needs_attention ? 0.9 : 0.1 } }, usage: { input_tokens: 600 } },
  ...fields,
})
const jsonl = (rows) => rows.map((row) => JSON.stringify(row) + '\n').join('')

let root, data, outside
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'fwd-eval-tools-'))
  data = join(root, 'private'), outside = join(root, 'elsewhere')
  for (const dir of [join(data, 'results/raw'), outside]) mkdirSync(dir, { recursive: true })
  writeFileSync(join(data, 'cards.json'), JSON.stringify(CARDS))
  writeFileSync(join(data, 'questions.json'), JSON.stringify(QUESTIONS))
})
afterEach(() => rmSync(root, { recursive: true, force: true }))

const rawFile = () => join(data, 'results/raw/clef-x.jsonl')
const summaryFile = () => join(data, 'results/summary-clef-x.json')
function tool(script, ...extra) {
  const { status, stdout, stderr } = spawnSync(process.execPath, [join(TOOLS, script), '--data', data, '--model', 'clef', '--cards', 'cards.json', '--tag', 'x', ...extra], { encoding: 'utf8' })
  return { code: status, out: stdout, err: stderr }
}
// Nothing listens on port 9, so a case that wrongly reached the model would fail, not hang.
const run = () => tool('run.mjs', '--endpoint', 'http://127.0.0.1:9')
const score = () => tool('score.mjs')

describe('a results file cannot lead outside --data (#29 review)', () => {
  it('run.mjs refuses a raw results file that is a symlink and writes nothing through it', () => {
    const target = join(outside, 'public.jsonl')
    writeFileSync(target, 'original\n')
    symlinkSync(target, rawFile())
    const { code, err } = run()
    expect(code).toBe(1)
    expect(err).toContain('is a symlink')
    expect(readFileSync(target, 'utf8')).toBe('original\n')
  })

  it('run.mjs refuses a dangling symlink and does not create the file it points to', () => {
    const target = join(outside, 'not-yet.jsonl')
    symlinkSync(target, rawFile())
    expect(run()).toMatchObject({ code: 1, err: expect.stringContaining('is a symlink') })
    expect(existsSync(target)).toBe(false)
  })

  it('run.mjs refuses a raw results file that shares a hard link with a file elsewhere', () => {
    const target = join(outside, 'public.jsonl')
    writeFileSync(target, jsonl(CARDS.map((card) => answer(card))))
    linkSync(target, rawFile())
    expect(run()).toMatchObject({ code: 1, err: expect.stringContaining('another hard link') })
    expect(readFileSync(target, 'utf8')).toBe(jsonl(CARDS.map((card) => answer(card))))
  })

  it('score.mjs refuses a summary that is a symlink or a hard link, and leaves the other file alone', () => {
    writeFileSync(rawFile(), jsonl(CARDS.map((card) => answer(card))))
    const target = join(outside, 'summary.json')
    writeFileSync(target, 'original')
    symlinkSync(target, summaryFile())
    expect(score()).toMatchObject({ code: 1, err: expect.stringContaining('is a symlink') })
    rmSync(summaryFile())
    linkSync(target, summaryFile())
    expect(score()).toMatchObject({ code: 1, err: expect.stringContaining('another hard link') })
    expect(readFileSync(target, 'utf8')).toBe('original')
  })

  it('score.mjs writes a plain summary inside --data and leaves no temporary file', () => {
    writeFileSync(rawFile(), jsonl(CARDS.map((card) => answer(card))))
    writeFileSync(summaryFile(), 'old summary')
    const { code } = score()
    expect(code).toBe(0)
    const summary = JSON.parse(readFileSync(summaryFile(), 'utf8'))
    expect(summary).toMatchObject({ questions_version: questionsVersion(QUESTIONS), overall: { caught: 1, false_flags: 0 } })
    expect(readdirSync(join(data, 'results')).filter((name) => name.endsWith('.tmp'))).toEqual([])
  })
})

describe('answers are reused or scored only for the current questions and card text (#29 review)', () => {
  it('run.mjs resumes when every answer matches: nothing is sent again', () => {
    writeFileSync(rawFile(), jsonl(CARDS.map((card) => answer(card))))
    const { code, out } = run()
    expect(code).toBe(0)
    expect(out).toContain('2 already in results/raw/clef-x.jsonl, 0 to run')
  })

  it('run.mjs stops when the questions have changed, and appends nothing', () => {
    const before = jsonl(CARDS.map((card) => answer(card, { questions_version: 'aaaaaaaaaaaa' })))
    writeFileSync(rawFile(), before)
    const { code, err } = run()
    expect(code).toBe(1)
    expect(err).toContain('2 answers to other questions (aaaaaaaaaaaa')
    expect(err).toContain('another --tag')
    expect(readFileSync(rawFile(), 'utf8')).toBe(before)
  })

  it('run.mjs stops when a card keeps its id but its text has changed', () => {
    writeFileSync(rawFile(), jsonl(CARDS.map((card) => answer(card))))
    writeFileSync(join(data, 'cards.json'), JSON.stringify([{ ...CARDS[0], card: { ...CARDS[0].card, text_gratitude: 'g1 edited' } }, CARDS[1]]))
    expect(run()).toMatchObject({ code: 1, err: expect.stringContaining('1 answer for card text that has changed since') })
  })

  it('run.mjs stops on answers recorded before card text was tracked', () => {
    writeFileSync(rawFile(), jsonl(CARDS.map((card) => answer(card, { card_version: undefined }))))
    expect(run()).toMatchObject({ code: 1, err: expect.stringContaining('2 answers recorded before card text was tracked') })
  })

  it('score.mjs refuses answers to other questions or other card text, but a relabelled card is scored with its new label', () => {
    writeFileSync(rawFile(), jsonl([answer(CARDS[0], { questions_version: 'aaaaaaaaaaaa' }), answer(CARDS[1])]))
    expect(score()).toMatchObject({ code: 1, err: expect.stringContaining('1 answer to other questions') })

    writeFileSync(rawFile(), jsonl(CARDS.map((card) => answer(card))))
    writeFileSync(join(data, 'cards.json'), JSON.stringify([CARDS[0], { ...CARDS[1], card: { ...CARDS[1].card, nickname: 'n2 edited' } }]))
    expect(score()).toMatchObject({ code: 1, err: expect.stringContaining('1 answer for card text that has changed since') })

    // Relabelling t2 as ordinary: same text, so its answer still counts, now as a false flag.
    writeFileSync(join(data, 'cards.json'), JSON.stringify([CARDS[0], { ...CARDS[1], expected: { needs_attention: false, reason: 'none' } }]))
    expect(score().code).toBe(0)
    expect(JSON.parse(readFileSync(summaryFile(), 'utf8')).overall).toMatchObject({ problem_cards: 0, false_flags: 1 })
  })

  it('versions: card text decides the card version, labels do not; the questions version is the one already recorded', () => {
    expect(cardVersion({ ...CARDS[1], expected: { needs_attention: false, reason: 'none' } })).toBe(cardVersion(CARDS[1]))
    expect(cardVersion({ ...CARDS[1], card: { ...CARDS[1].card, text_anticipate: 'a2 edited' } })).not.toBe(cardVersion(CARDS[1]))
    // The same 12 characters run.mjs has recorded since the trial began, so earlier results compare.
    expect(questionsVersion(QUESTIONS)).toBe(createHash('sha256').update(JSON.stringify(QUESTIONS)).digest('hex').slice(0, 12))
    expect(staleAnswers(CARDS.map((card) => answer(card)), CARDS, questionsVersion(QUESTIONS))).toEqual([])
  })
})
