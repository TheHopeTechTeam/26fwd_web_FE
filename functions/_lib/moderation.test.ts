import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestDb, migrationNames, sqliteAvailable, type TestDb } from '../_test/d1'
import type { Env } from './cards'
import { loadQuestions, MODERATION_MODEL, MODERATION_TIMEOUT_MS, moderateCard } from './moderation'

// Made-up questions in the shape of the real ones, which only exist in an encrypted secret. The
// reasons are placeholders on purpose; only `none` has a meaning here.
const QUESTIONS = {
  needs_attention: { type: 'noul', instructions: 'q1', criteria: { true: 't', false: 'f' } },
  reason: { type: 'choice', instructions: 'q2', criteria: { none: 'n', flag_a: 'a', flag_b: 'b' } },
}
const CARD = { nickname: '測試卡', text_gratitude: '單元測試的感謝欄', text_anticipate: '單元測試的期待欄' }

// An answer in the shape Clef returns.
const answer = (choice: unknown) => ({
  model: 'clef',
  answers: {
    needs_attention: { type: 'noul', noul: 0.12 },
    reason: { type: 'choice', choice, probabilities: { none: 0.91, flag_a: 0.06, flag_b: 0.03 }, confidence: 0.87 },
  },
  usage: { input_tokens: 712, output_tokens: 0 },
})

type Run = (model: string, inputs: Record<string, unknown>) => Promise<unknown>
const ai = (run: Run = async () => answer('none')) => ({ run: vi.fn(run) })
type Model = ReturnType<typeof ai>

// One pending card c_1. null means "none": no switch row, no questions secret, no AI binding.
function setup({ switchValue = 'on', questions = JSON.stringify(QUESTIONS), model = ai() }: { switchValue?: string | null; questions?: string | null; model?: Model | null } = {}) {
  const t = createTestDb()
  if (switchValue === null) t.query("DELETE FROM app_settings WHERE key = 'auto_publish'")
  else t.query("UPDATE app_settings SET value = ? WHERE key = 'auto_publish'", switchValue)
  t.query("INSERT INTO forward_cards VALUES ('c_1', ?, ?, ?, 'pending', 1, '2026-11-14T12:00:00.000Z')", CARD.nickname, CARD.text_gratitude, CARD.text_anticipate)
  const env: Env = { FORWARD_DB: t.db, MODERATION_QUESTIONS: questions ?? undefined, AI: model ?? undefined }
  return { t, env, model }
}
const statusOf = (t: TestDb) => t.query("SELECT status FROM forward_cards WHERE id = 'c_1'")[0]?.status
const judgments = (t: TestDb) => t.query('SELECT * FROM card_moderations')

async function versionOf(json: unknown) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(json)))
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('').slice(0, 12)
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe.skipIf(!sqliteAvailable)('auto-publish switch (D1 setting, Ian 10/23 option B)', () => {
  it('is off after migration 0004: no model call, nothing recorded, the card stays pending', async () => {
    const t = createTestDb()
    t.query("INSERT INTO forward_cards VALUES ('c_1', 'n', 'g', 'a', 'pending', 1, '2026-11-14T12:00:00.000Z')")
    const model = ai()
    await moderateCard({ FORWARD_DB: t.db, MODERATION_QUESTIONS: JSON.stringify(QUESTIONS), AI: model }, 'c_1', CARD)
    expect(t.query("SELECT value FROM app_settings WHERE key = 'auto_publish'")).toEqual([{ value: 'off' }])
    expect(model.run).not.toHaveBeenCalled()
    expect(judgments(t)).toEqual([])
    expect(statusOf(t)).toBe('pending')
  })

  it('counts as on only for the exact value on; a missing row or any other value is off', async () => {
    for (const switchValue of [null, 'ON', 'true', '1', 'on ', '']) {
      const { t, env, model } = setup({ switchValue })
      await moderateCard(env, 'c_1', CARD)
      expect(model?.run, `switch ${JSON.stringify(switchValue)}`).not.toHaveBeenCalled()
      expect(statusOf(t)).toBe('pending')
    }
  })

  it('an unreadable switch counts as off', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const t = createTestDb(migrationNames().filter(name => !name.startsWith('0004')))
    t.query("INSERT INTO forward_cards VALUES ('c_1', 'n', 'g', 'a', 'pending', 1, '2026-11-14T12:00:00.000Z')")
    const model = ai()
    await moderateCard({ FORWARD_DB: t.db, MODERATION_QUESTIONS: JSON.stringify(QUESTIONS), AI: model }, 'c_1', CARD)
    expect(model.run).not.toHaveBeenCalled()
    expect(statusOf(t)).toBe('pending')
    expect(error).toHaveBeenCalledWith('auto-publish switch unreadable; treating it as off', expect.anything())
  })
})

describe.skipIf(!sqliteAvailable)('judging a card while auto-publish is on', () => {
  it('no reason to hold it: published, and the judgment recorded with the questions version', async () => {
    const { t, env, model } = setup()
    await moderateCard(env, 'c_1', CARD)
    expect(statusOf(t)).toBe('approved')
    expect(model?.run).toHaveBeenCalledWith(MODERATION_MODEL, { model: 'clef', state: CARD, questions: QUESTIONS })
    expect(judgments(t)).toEqual([expect.objectContaining({
      card_id: 'c_1', model: MODERATION_MODEL, questions_version: await versionOf(QUESTIONS), outcome: 'clear', reason: 'none',
      reason_probability: 0.91, needs_attention_probability: 0.12, auto_published: 1, input_tokens: 712,
    })])
    expect(judgments(t)[0]?.judged_at).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/)
    expect(judgments(t)[0]?.latency_ms).toBeGreaterThanOrEqual(0)
  })

  it('any other reason: the card stays pending and the judgment says flagged', async () => {
    const { t, env } = setup({ model: ai(async () => answer('flag_a')) })
    await moderateCard(env, 'c_1', CARD)
    expect(statusOf(t)).toBe('pending')
    expect(judgments(t)).toEqual([expect.objectContaining({ outcome: 'flagged', reason: 'flag_a', reason_probability: 0.06, auto_published: 0 })])
  })

  it('questions missing or unusable: stays pending, recorded, and the model is not called', async () => {
    const unusable = [null, 'not json', '{}', JSON.stringify({ reason: { criteria: { flag_a: 'a' } } }), JSON.stringify({ reason: { criteria: ['none'] } })]
    for (const questions of unusable) {
      const { t, env, model } = setup({ questions })
      await moderateCard(env, 'c_1', CARD)
      expect(model?.run).not.toHaveBeenCalled()
      expect(statusOf(t)).toBe('pending')
      expect(judgments(t)).toEqual([expect.objectContaining({ outcome: 'questions_missing', questions_version: null, auto_published: 0 })])
    }
  })

  it('no Workers AI binding: stays pending, recorded as model_error', async () => {
    const { t, env } = setup({ model: null })
    await moderateCard(env, 'c_1', CARD)
    expect(statusOf(t)).toBe('pending')
    expect(judgments(t)).toEqual([expect.objectContaining({ outcome: 'model_error', questions_version: await versionOf(QUESTIONS) })])
  })

  it('the model call fails (e.g. the daily quota is used up): stays pending, recorded as model_error', async () => {
    const { t, env } = setup({ model: ai(async () => { throw new Error('AiError: quota exceeded') }) })
    await moderateCard(env, 'c_1', CARD)
    expect(statusOf(t)).toBe('pending')
    expect(judgments(t)).toEqual([expect.objectContaining({ outcome: 'model_error', auto_published: 0 })])
  })

  it(`the model takes longer than ${MODERATION_TIMEOUT_MS / 1000} s: stays pending, recorded as timeout`, async () => {
    // Only the timer is fake. The timeout starts right when the model is called, so wait for that.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    let called!: () => void
    const modelCalled = new Promise<void>(resolve => { called = resolve })
    const { t, env } = setup({ model: ai(() => { called(); return new Promise(() => {}) }) })
    const judging = moderateCard(env, 'c_1', CARD)
    await modelCalled
    await vi.advanceTimersByTimeAsync(MODERATION_TIMEOUT_MS - 1)
    expect(judgments(t)).toEqual([])
    await vi.advanceTimersByTimeAsync(1)
    await judging
    expect(statusOf(t)).toBe('pending')
    expect(judgments(t)).toEqual([expect.objectContaining({ outcome: 'timeout', auto_published: 0 })])
  })

  it('an answer not in the shape the questions ask for: stays pending, recorded as invalid_output', async () => {
    for (const output of [null, {}, answer('flag_z'), answer(1), { answers: { reason: {} } }]) {
      const { t, env } = setup({ model: ai(async () => output) })
      await moderateCard(env, 'c_1', CARD)
      expect(statusOf(t)).toBe('pending')
      expect(judgments(t)).toEqual([expect.objectContaining({ outcome: 'invalid_output', auto_published: 0 })])
    }
  })

  it('a reviewer who acted while the model was answering wins: the card is not published', async () => {
    for (const reviewed of ['hidden', 'approved']) {
      const { t, env } = setup({
        model: ai(async () => {
          t.query("UPDATE forward_cards SET status = ? WHERE id = 'c_1'", reviewed)
          return answer('none')
        }),
      })
      await moderateCard(env, 'c_1', CARD)
      expect(statusOf(t)).toBe(reviewed)
      expect(judgments(t)).toEqual([expect.objectContaining({ outcome: 'clear', auto_published: 0 })])
    }
  })

  it('turning the switch off while the model is answering stops the publish', async () => {
    const { t, env } = setup({
      model: ai(async () => {
        t.query("UPDATE app_settings SET value = 'off' WHERE key = 'auto_publish'")
        return answer('none')
      }),
    })
    await moderateCard(env, 'c_1', CARD)
    expect(statusOf(t)).toBe('pending')
    expect(judgments(t)).toEqual([expect.objectContaining({ outcome: 'clear', auto_published: 0 })])
  })

  it('never throws, and leaves the card pending, when the judgment cannot be written', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { t, env } = setup()
    t.query('DROP TABLE card_moderations')
    await expect(moderateCard(env, 'c_1', CARD)).resolves.toBeUndefined()
    expect(statusOf(t)).toBe('pending')
    expect(error).toHaveBeenCalledWith('card moderation failed; the card stays pending', 'c_1', expect.anything())
  })

  it('records no card text, and a judgment is deleted with its card', async () => {
    const { t, env } = setup()
    await moderateCard(env, 'c_1', CARD)
    const stored = JSON.stringify(judgments(t))
    for (const text of Object.values(CARD)) expect(stored).not.toContain(text)
    t.query('PRAGMA foreign_keys = ON') // as on D1
    t.query("DELETE FROM forward_cards WHERE id = 'c_1'")
    expect(judgments(t)).toEqual([])
  })
})

describe('loadQuestions', () => {
  it('versions the questions as the trial tools do, so indentation in the secret does not matter', async () => {
    const compact = await loadQuestions(JSON.stringify(QUESTIONS))
    const indented = await loadQuestions(JSON.stringify(QUESTIONS, null, 2))
    expect(compact?.version).toBe(await versionOf(QUESTIONS))
    expect(indented?.version).toBe(compact?.version)
    expect([...compact!.reasons]).toEqual(['none', 'flag_a', 'flag_b'])
  })
})
