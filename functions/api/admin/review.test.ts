import { describe, expect, it, vi } from 'vitest'
import type { Env } from '../../_lib/cards'
import { createTestDb, sqliteAvailable, type TestDb } from '../../_test/d1'
import { onRequestGet as listCards } from './cards'
import { onRequestPatch as hideCard } from './cards/[id]/hide'
import { onRequestPatch as setCardStatus } from './cards/[id]/status'

const TOKEN = 't'.repeat(32)

function setup() {
  const t = createTestDb()
  t.query("INSERT INTO forward_cards VALUES ('c_1', 'n', 'g', 'a', 'pending', 1, '2026-11-14T12:00:00.000Z')")
  const env: Env = { FORWARD_DB: t.db, ADMIN_API_TOKEN: TOKEN }
  return { t, env }
}
const statusOf = (t: TestDb, id = 'c_1') => t.query('SELECT status FROM forward_cards WHERE id = ?', id)[0]?.status
const history = (t: TestDb) => t.query('SELECT card_id, from_status, to_status, actor FROM card_status_changes ORDER BY id')

function patch(path: string, body?: unknown, contentType = 'application/json') {
  const headers: Record<string, string> = { Authorization: `Bearer ${TOKEN}` }
  if (body !== undefined) headers['content-type'] = contentType
  return new Request(`https://example.test/api/admin/cards/${path}`, { method: 'PATCH', headers, body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body) })
}
const setStatus = (env: Env, body: unknown, id = 'c_1') => setCardStatus({ request: patch(`${id}/status`, body), env, params: { id } })
const hide = (env: Env, body: unknown, id = 'c_1', contentType?: string) => hideCard({ request: patch(`${id}/hide`, body, contentType), env, params: { id } })
const errorOf = async (response: Response) => ((await response.json()) as { error: { code: string; current_status?: string; fields?: Record<string, string> } }).error

describe.skipIf(!sqliteAvailable)('two reviewers on one card (409, Ian 10/23)', () => {
  it('regression: B approving a card that A already hid gets 409, and the card stays hidden', async () => {
    const { t, env } = setup()
    // Both loaded the pending list.
    expect((await hide(env, { from: 'pending' })).status).toBe(200)
    const late = await setStatus(env, { status: 'approved', from: 'pending' })
    expect(late.status).toBe(409)
    expect(await errorOf(late)).toEqual({ code: 'CARD_STATUS_CHANGED', message: 'The card was changed by someone else', current_status: 'hidden' })
    expect(statusOf(t)).toBe('hidden')
  })

  it('regression: B hiding a card that A already approved gets 409, and the card stays approved', async () => {
    const { t, env } = setup()
    expect((await setStatus(env, { status: 'approved', from: 'pending' })).status).toBe(200)
    const late = await hide(env, { from: 'pending' })
    expect(late.status).toBe(409)
    expect((await errorOf(late)).current_status).toBe('approved')
    expect(statusOf(t)).toBe('approved')
  })

  it('a change from the status the reviewer saw goes through, on both endpoints', async () => {
    const { t, env } = setup()
    expect((await setStatus(env, { status: 'approved', from: 'pending' })).status).toBe(200)
    expect((await hide(env, { from: 'approved' })).status).toBe(200)
    expect(statusOf(t)).toBe('hidden')
    expect(await (await setStatus(env, { status: 'approved', from: 'hidden' })).json()).toEqual({ success: true, card_id: 'c_1', status: 'approved' })
    expect(statusOf(t)).toBe('approved')
  })

  it('regression (Ian 10/25): without from, both endpoints refuse the change, so no request skips the check', async () => {
    const { t, env } = setup()
    t.query("UPDATE forward_cards SET status = 'hidden' WHERE id = 'c_1'")
    for (const response of [await setStatus(env, { status: 'approved' }), await hide(env, {})]) {
      expect(response.status).toBe(400)
      expect((await errorOf(response)).fields).toEqual({ from: 'required' })
    }
    expect((await hide(env, undefined)).status).toBe(400)
    expect(statusOf(t)).toBe('hidden')
    expect(history(t)).toEqual([])
  })

  it('an unknown card is 404; a from that is not a status is 400', async () => {
    const { env } = setup()
    for (const response of [await setStatus(env, { status: 'approved', from: 'pending' }, 'c_x'), await hide(env, { from: 'pending' }, 'c_x')]) {
      expect(response.status).toBe(404)
    }
    for (const from of ['published', 1, null]) {
      const response = await setStatus(env, { status: 'approved', from })
      expect(response.status).toBe(400)
      expect((await errorOf(response)).fields).toEqual({ from: 'invalid' })
    }
  })

  it('a hide request with a body must be JSON', async () => {
    const { t, env } = setup()
    expect((await hide(env, 'from=pending', 'c_1', 'application/x-www-form-urlencoded')).status).toBe(400)
    expect(statusOf(t)).toBe('pending')
  })

  it('regression (review): a hide request whose body is not a JSON object is refused, so a broken request never skips the check', async () => {
    const { t, env } = setup()
    t.query("UPDATE forward_cards SET status = 'approved' WHERE id = 'c_1'")
    for (const body of ['{"from":"pending"', '"pending"', '[]', 'null', '42']) {
      const response = await hide(env, body)
      expect(response.status, body).toBe(400)
      expect(await errorOf(response)).toEqual({ code: 'VALIDATION_ERROR', message: 'from must be pending, approved or hidden', fields: { from: 'required' } })
    }
    expect(statusOf(t)).toBe('approved')
  })
})

describe.skipIf(!sqliteAvailable)('status history (card_status_changes, Ian 10/25)', () => {
  it('records each change a reviewer makes: from, to, reviewer and when', async () => {
    const { t, env } = setup()
    await setStatus(env, { status: 'approved', from: 'pending' })
    await hide(env, { from: 'approved' })
    await setStatus(env, { status: 'approved', from: 'hidden' })
    expect(history(t)).toEqual([
      { card_id: 'c_1', from_status: 'pending', to_status: 'approved', actor: 'reviewer' },
      { card_id: 'c_1', from_status: 'approved', to_status: 'hidden', actor: 'reviewer' },
      { card_id: 'c_1', from_status: 'hidden', to_status: 'approved', actor: 'reviewer' },
    ])
    expect(t.query('SELECT changed_at FROM card_status_changes').every(row => /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(String(row.changed_at)))).toBe(true)
  })

  it('records nothing when nothing changes: a 409, a 404, a bad request, or asking for the status the card already has', async () => {
    const { t, env } = setup()
    await hide(env, { from: 'pending' })
    const before = history(t)
    expect((await setStatus(env, { status: 'approved', from: 'pending' })).status).toBe(409)
    expect((await hide(env, { from: 'pending' }, 'c_x')).status).toBe(404)
    expect((await setStatus(env, { status: 'approved', from: 'published' })).status).toBe(400)
    expect((await hide(env, { from: 'hidden' })).status).toBe(200)
    expect(history(t)).toEqual(before)
    expect(before).toHaveLength(1)
  })

  it('changes nothing when the history cannot be written: one transaction', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { t, env } = setup()
    t.query('DROP TABLE card_status_changes')
    expect((await setStatus(env, { status: 'approved', from: 'pending' })).status).toBe(500)
    expect(statusOf(t)).toBe('pending')
    error.mockRestore()
  })

  it('holds no card text, and is deleted with its card', async () => {
    const { t, env } = setup()
    await setStatus(env, { status: 'approved', from: 'pending' })
    expect(Object.keys(t.query('SELECT * FROM card_status_changes')[0] ?? {})).toEqual(['id', 'card_id', 'from_status', 'to_status', 'actor', 'changed_at'])
    t.query('PRAGMA foreign_keys = ON') // as on D1
    t.query("DELETE FROM forward_cards WHERE id = 'c_1'")
    expect(history(t)).toEqual([])
  })
})

describe.skipIf(!sqliteAvailable)('GET /api/admin/cards: the model\'s judgment with each card', () => {
  it('includes the judgment when there is one, and null otherwise', async () => {
    const { t, env } = setup()
    t.query("INSERT INTO forward_cards VALUES ('c_2', 'n', 'g', 'a', 'pending', 1, '2026-11-14T12:00:01.000Z')")
    t.query(`INSERT INTO card_moderations VALUES ('c_2', '@cf/cloudflare/clef', 'abcdef123456', 'flagged', 'flag_a', 0.8, 0.9, 0, 700, 420, '2026-11-14T12:00:02.000Z')`)
    const request = new Request('https://example.test/api/admin/cards?status=pending', { headers: { Authorization: `Bearer ${TOKEN}` } })
    const body = (await (await listCards({ request, env })).json()) as { items: Array<{ id: string; moderation: unknown }> }
    expect(body.items.map(item => item.id)).toEqual(['c_2', 'c_1'])
    expect(body.items[0]?.moderation).toEqual({
      model: '@cf/cloudflare/clef', questions_version: 'abcdef123456', outcome: 'flagged', reason: 'flag_a',
      reason_probability: 0.8, needs_attention_probability: 0.9, auto_published: false, judged_at: '2026-11-14T12:00:02.000Z',
    })
    expect(body.items[1]?.moderation).toBeNull()
  })
})
