import type { CardSubmission, Env } from './cards'

// M1.6 (#5): the model judges each new card in the background, and a card is published without a
// reviewer only when the auto-publish switch is on and the model sees no reason to hold it. Any
// other result, including errors, timeouts and a background job that never finishes, leaves the
// card pending, where every card starts (Ian 10/15, 10/19, 10/23).
export const MODERATION_MODEL = '@cf/cloudflare/clef'
// The slowest answer in the 10/20 trial took 1.2 s. Judging runs after the response, so waiting
// longer costs the visitor nothing.
export const MODERATION_TIMEOUT_MS = 5_000

export type ModerationOutcome = 'clear' | 'flagged' | 'questions_missing' | 'timeout' | 'model_error' | 'invalid_output'
export type CardText = Pick<CardSubmission, 'nickname' | 'text_gratitude' | 'text_anticipate'>

// The switch lives in D1, so turning it off applies to the next card without a redeploy. Only the
// exact value 'on' counts; a missing row, any other value or a failed read is off.
export async function autoPublishOn(db: D1Database): Promise<boolean> {
  try {
    const row = await db.prepare("SELECT value FROM app_settings WHERE key = 'auto_publish'").first<{ value: string }>()
    return row?.value === 'on'
  } catch (error) {
    console.error('auto-publish switch unreadable; treating it as off', error)
    return false
  }
}

export type Questions = { json: unknown; version: string; reasons: Set<string> }

// The questions (the prompt) come from an encrypted secret and never appear in this public repo
// (Ian 10/19). Their version is the same 12-character SHA-256 prefix the trial tools record
// (scripts/moderation-eval), so every judgment can be traced to a questions file in the private
// repo. The reasons the model may give are the keys of reason.criteria, which must include none.
export async function loadQuestions(secret: string | undefined): Promise<Questions | null> {
  if (!secret) return null
  let json: unknown
  try {
    json = JSON.parse(secret)
  } catch {
    return null
  }
  const criteria = (json as { reason?: { criteria?: unknown } } | null)?.reason?.criteria
  if (!criteria || typeof criteria !== 'object' || Array.isArray(criteria)) return null
  const reasons = new Set(Object.keys(criteria))
  if (!reasons.has('none')) return null
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(json)))
  const version = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('').slice(0, 12)
  return { json, version, reasons }
}

type Answer = { reason: string; reasonProbability: number | null; needsAttention: number | null; inputTokens: number | null }

// What the model answered, or null when the answer is not in the shape the questions ask for.
function readAnswer(output: unknown, reasons: Set<string>): Answer | null {
  const o = output as {
    answers?: { reason?: { choice?: unknown; probabilities?: Record<string, unknown> }; needs_attention?: { noul?: unknown } }
    usage?: { input_tokens?: unknown }
  } | null
  const choice = o?.answers?.reason?.choice
  if (typeof choice !== 'string' || !reasons.has(choice)) return null
  const number = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : null)
  return {
    reason: choice,
    reasonProbability: number(o?.answers?.reason?.probabilities?.[choice]),
    needsAttention: number(o?.answers?.needs_attention?.noul),
    inputTokens: number(o?.usage?.input_tokens),
  }
}

class ModelTimeout extends Error {}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null
  const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new ModelTimeout()), ms) })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

type Judgment = {
  outcome: ModerationOutcome
  version?: string
  reason?: string
  reasonProbability?: number | null
  needsAttention?: number | null
  inputTokens?: number | null
  latencyMs?: number
}

// `autoPublished` is SQL: 0, or changes() right after the conditional publish in the same batch.
function recordJudgment(db: D1Database, cardId: string, j: Judgment, autoPublished: '0' | 'changes()' = '0') {
  return db.prepare(`INSERT INTO card_moderations (card_id, model, questions_version, outcome, reason, reason_probability,
      needs_attention_probability, auto_published, input_tokens, latency_ms, judged_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ${autoPublished}, ?, ?, ?)`)
    .bind(cardId, MODERATION_MODEL, j.version ?? null, j.outcome, j.reason ?? null, j.reasonProbability ?? null,
      j.needsAttention ?? null, j.inputTokens ?? null, j.latencyMs ?? null, new Date().toISOString())
}

// Judges one stored card and publishes it when allowed. It never throws: whatever goes wrong, the
// card stays pending. Card text goes to the model as data only and is never logged or recorded.
export async function moderateCard(env: Env, cardId: string, card: CardText): Promise<void> {
  const db = env.FORWARD_DB
  const record = async (judgment: Judgment) => { await recordJudgment(db, cardId, judgment).run() }
  try {
    // Off means fully manual: no model call, nothing recorded, no quota used.
    if (!(await autoPublishOn(db))) return
    const questions = await loadQuestions(env.MODERATION_QUESTIONS)
    if (!questions) {
      await record({ outcome: 'questions_missing' })
      return
    }
    const version = questions.version
    if (!env.AI) {
      await record({ version, outcome: 'model_error' })
      return
    }

    const started = Date.now()
    let output: unknown
    try {
      const state = { nickname: card.nickname, text_gratitude: card.text_gratitude, text_anticipate: card.text_anticipate }
      output = await withTimeout(env.AI.run(MODERATION_MODEL, { model: 'clef', state, questions: questions.json }), MODERATION_TIMEOUT_MS)
    } catch (error) {
      await record({ version, outcome: error instanceof ModelTimeout ? 'timeout' : 'model_error', latencyMs: Date.now() - started })
      return
    }
    const latencyMs = Date.now() - started
    const answer = readAnswer(output, questions.reasons)
    if (!answer) {
      await record({ version, outcome: 'invalid_output', latencyMs })
      return
    }
    if (answer.reason !== 'none') {
      await record({ ...answer, version, outcome: 'flagged', latencyMs })
      return
    }

    // One transaction: the card is published only if it is still pending (a reviewer may have acted
    // first) and the switch is still on, and the judgment records whether it was.
    await db.batch([
      db.prepare(`UPDATE forward_cards SET status = 'approved' WHERE id = ? AND status = 'pending'
        AND (SELECT value FROM app_settings WHERE key = 'auto_publish') = 'on'`).bind(cardId),
      recordJudgment(db, cardId, { ...answer, version, outcome: 'clear', latencyMs }, 'changes()'),
    ])
  } catch (error) {
    console.error('card moderation failed; the card stays pending', cardId, error)
  }
}
