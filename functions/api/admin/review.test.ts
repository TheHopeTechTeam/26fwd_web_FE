import { describe, expect, it, vi } from 'vitest'
import type { Env } from '../../_lib/cards'
import { createTestDb, sqliteAvailable, type TestDb } from '../../_test/d1'
import { onRequestGet as listCards } from './cards'
import { onRequestDelete as deleteCard } from './cards/[id]'
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
const remove = (env: Env, id = 'c_1', token = TOKEN) =>
  deleteCard({ request: new Request(`https://example.test/api/admin/cards/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }), env, params: { id } })
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

describe.skipIf(!sqliteAvailable)('DELETE /api/admin/cards/:id: hidden cards only (#35)', () => {
  const judge = (t: TestDb, id: string) =>
    t.query("INSERT INTO card_moderations VALUES (?, '@cf/cloudflare/clef', 'abcdef123456', 'clear', 'none', 0.9, 0.1, 0, 700, 420, '2026-11-14T12:00:02.000Z')", id)
  const rowsOf = (t: TestDb, id = 'c_1') => ({
    card: t.query('SELECT id FROM forward_cards WHERE id = ?', id).length,
    judgment: t.query('SELECT card_id FROM card_moderations WHERE card_id = ?', id).length,
    history: t.query('SELECT id FROM card_status_changes WHERE card_id = ?', id).length,
  })
  const deletions = (t: TestDb) => t.query('SELECT card_id, actor FROM card_deletions ORDER BY id')

  // ON as on D1, where ON DELETE CASCADE also removes them; OFF shows the handler does not rely on it.
  for (const foreignKeys of ['ON', 'OFF']) {
    it(`deletes a hidden card with its judgment and status history, and records the deletion (foreign keys ${foreignKeys})`, async () => {
      const { t, env } = setup()
      t.query(`PRAGMA foreign_keys = ${foreignKeys}`)
      t.query("INSERT INTO forward_cards VALUES ('c_2', 'n', 'g', 'a', 'pending', 1, '2026-11-14T12:00:01.000Z')")
      judge(t, 'c_1')
      judge(t, 'c_2')
      await hide(env, { from: 'pending' })
      await hide(env, { from: 'pending' }, 'c_2')
      const response = await remove(env)
      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ success: true, card_id: 'c_1' })
      expect(rowsOf(t)).toEqual({ card: 0, judgment: 0, history: 0 })
      expect(rowsOf(t, 'c_2')).toEqual({ card: 1, judgment: 1, history: 1 })
      expect(deletions(t)).toEqual([{ card_id: 'c_1', actor: 'reviewer' }])
    })
  }

  it('the deletion record holds no card text: which card, who and when', async () => {
    const { t, env } = setup()
    await hide(env, { from: 'pending' })
    await remove(env)
    const [row] = t.query('SELECT * FROM card_deletions')
    expect(Object.keys(row ?? {})).toEqual(['id', 'card_id', 'actor', 'deleted_at'])
    expect(String(row?.deleted_at)).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/)
  })

  it('a card that is not hidden gets 409 with its status now; nothing is deleted or recorded', async () => {
    const { t, env } = setup()
    judge(t, 'c_1')
    const pending = await remove(env)
    expect(pending.status).toBe(409)
    expect(await errorOf(pending)).toEqual({ code: 'CARD_STATUS_CHANGED', message: 'The card was changed by someone else', current_status: 'pending' })
    // A loaded the hidden list; B published the card again before A deleted it.
    await hide(env, { from: 'pending' })
    await setStatus(env, { status: 'approved', from: 'hidden' })
    const approved = await remove(env)
    expect(approved.status).toBe(409)
    expect((await errorOf(approved)).current_status).toBe('approved')
    expect(statusOf(t)).toBe('approved')
    expect(rowsOf(t)).toEqual({ card: 1, judgment: 1, history: 2 })
    expect(deletions(t)).toEqual([])
  })

  it('an unknown card is 404, and so is a second delete; the deletion is recorded once', async () => {
    const { t, env } = setup()
    expect((await remove(env, 'c_x')).status).toBe(404)
    await hide(env, { from: 'pending' })
    expect((await remove(env)).status).toBe(200)
    const again = await remove(env)
    expect(again.status).toBe(404)
    expect((await errorOf(again)).code).toBe('NOT_FOUND')
    expect(deletions(t)).toEqual([{ card_id: 'c_1', actor: 'reviewer' }])
  })

  it('needs the admin token and a valid card id', async () => {
    const { t, env } = setup()
    await hide(env, { from: 'pending' })
    expect((await remove(env, 'c_1', 'x'.repeat(32))).status).toBe(401)
    expect((await remove(env, 'bad id!')).status).toBe(400)
    expect(statusOf(t)).toBe('hidden')
    expect(deletions(t)).toEqual([])
  })

  it('leaves the published count alone: the card left it when it was hidden', async () => {
    const { t, env } = setup()
    const count = () => t.query("SELECT count FROM forward_card_counts WHERE status = 'approved'")[0]?.count
    await setStatus(env, { status: 'approved', from: 'pending' })
    expect(count()).toBe(1)
    await hide(env, { from: 'approved' })
    expect(count()).toBe(0)
    await remove(env)
    expect(count()).toBe(0)
  })

  it('a deleted card is no longer in the admin list', async () => {
    const { env } = setup()
    await hide(env, { from: 'pending' })
    await remove(env)
    const request = new Request('https://example.test/api/admin/cards?status=hidden', { headers: { Authorization: `Bearer ${TOKEN}` } })
    expect(((await (await listCards({ request, env })).json()) as { items: unknown[] }).items).toEqual([])
  })

  it('deletes nothing when the deletion cannot be recorded: one transaction', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { t, env } = setup()
    judge(t, 'c_1')
    await hide(env, { from: 'pending' })
    t.query('DROP TABLE card_deletions')
    expect((await remove(env)).status).toBe(500)
    expect(rowsOf(t)).toEqual({ card: 1, judgment: 1, history: 1 })
    error.mockRestore()
  })
})
