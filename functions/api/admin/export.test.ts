import { describe, expect, it } from 'vitest'
import type { AdminExportResponse } from '../../../src/api/types'
import type { Env } from '../../_lib/cards'
import { createTestDb, sqliteAvailable } from '../../_test/d1'
import { onRequestDelete as deleteCard } from './cards/[id]'
import { onRequestGet as exportCards } from './cards/export'

const TOKEN = 't'.repeat(32)

// Cards of every status, inserted out of order, two of them sent at the same moment, one with a
// judgment, and one hidden card that a reviewer then deletes for good.
function setup() {
  const t = createTestDb()
  const insert = (id: string, nickname: string, status: string, createdAt: string, gratitude = 'g', anticipate = 'a') =>
    t.query('INSERT INTO forward_cards VALUES (?, ?, ?, ?, ?, 1, ?)', id, nickname, gratitude, anticipate, status, createdAt)
  insert('c_b', '已公開', 'approved', '2026-11-15T04:58:00.000Z', '第一行\n第二行', '=1+1')
  insert('c_a', '待審核', 'pending', '2026-11-11T13:46:50.555Z')
  insert('c_c', '已隱藏', 'hidden', '2026-11-15T04:58:00.000Z')
  insert('c_gone', '要刪除', 'hidden', '2026-11-12T00:00:00.000Z')
  t.query(`INSERT INTO card_moderations (card_id, model, questions_version, outcome, reason, reason_probability,
    needs_attention_probability, auto_published, input_tokens, latency_ms, judged_at)
    VALUES ('c_b', '@cf/cloudflare/clef', 'v1', 'clear', 'none', 0.95, 0.05, 1, 800, 450, '2026-11-15T04:58:01.000Z')`)
  const env: Env = { FORWARD_DB: t.db, ADMIN_API_TOKEN: TOKEN }
  return { t, env }
}

const get = (env: Env, token: string | null = TOKEN) =>
  exportCards({
    request: new Request('https://example.test/api/admin/cards/export', { headers: token === null ? {} : { Authorization: `Bearer ${token}` } }),
    env,
  })

describe.skipIf(!sqliteAvailable)('GET /api/admin/cards/export (#76)', () => {
  it('returns every stored card, whatever its status, oldest first, without cards deleted for good', async () => {
    const { env } = setup()
    const removed = await deleteCard({
      request: new Request('https://example.test/api/admin/cards/c_gone', { method: 'DELETE', headers: { Authorization: `Bearer ${TOKEN}` } }),
      env,
      params: { id: 'c_gone' },
    })
    expect(removed.status).toBe(200)

    const response = await get(env)
    expect(response.status).toBe(200)
    const body = (await response.json()) as AdminExportResponse
    // Sent at the same moment, c_b comes before c_c by id.
    expect(body).toEqual({
      items: [
        { nickname: '待審核', text_gratitude: 'g', text_anticipate: 'a', created_at: '2026-11-11T13:46:50.555Z' },
        { nickname: '已公開', text_gratitude: '第一行\n第二行', text_anticipate: '=1+1', created_at: '2026-11-15T04:58:00.000Z' },
        { nickname: '已隱藏', text_gratitude: 'g', text_anticipate: 'a', created_at: '2026-11-15T04:58:00.000Z' },
      ],
    })
  })

  it('sends only the four columns of the file: no id, status or judgment', async () => {
    const body = (await (await get(setup().env)).json()) as AdminExportResponse
    for (const item of body.items) expect(Object.keys(item).sort()).toEqual(['created_at', 'nickname', 'text_anticipate', 'text_gratitude'])
  })

  it('is never cached', async () => {
    const response = await get(setup().env)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(response.headers.get('Content-Type')).toBe('application/json; charset=utf-8')
  })

  it.each([
    ['no Authorization header', null],
    ['a wrong token of the right length', 'x'.repeat(32)],
    ['a short token', 'short'],
  ])('refuses %s with 401 and no card data', async (_, token) => {
    const response = await get(setup().env, token)
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing or invalid admin token' } })
  })

  it('answers 503 and no card data while the admin token is not configured', async () => {
    const { t } = setup()
    const response = await get({ FORWARD_DB: t.db })
    expect(response.status).toBe(503)
    expect(((await response.json()) as { error: { code: string } }).error.code).toBe('SERVICE_UNAVAILABLE')
  })

  it('returns an empty list when no card is stored', async () => {
    const t = createTestDb()
    expect(await (await get({ FORWARD_DB: t.db, ADMIN_API_TOKEN: TOKEN })).json()).toEqual({ items: [] })
  })
})
