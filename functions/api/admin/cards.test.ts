import { describe, expect, it } from 'vitest'
import type { Env } from '../../_lib/cards'
import { onRequestGet } from './cards'
import { onRequestPatch } from './cards/[id]/status'

const TOKEN = 't'.repeat(32)

function fakeDb(rowCount: number, changes = 1) {
  const rows = Array.from({ length: rowCount }, (_, i) => ({ id: `c_${i}`, status: 'pending' }))
  const bound: unknown[][] = []
  const db = {
    prepare() {
      let params: unknown[] = []
      const statement = {
        bind(...values: unknown[]) { params = values; bound.push(values); return statement },
        // Honour the LIMIT bound by the handler, like D1 would.
        async all() { return { results: rows.slice(0, Number(params.at(-1))) } },
        async run() { return { meta: { changes } } },
      }
      return statement
    },
  }
  return { db: db as unknown as D1Database, bound }
}

const env = (db: D1Database): Env => ({ FORWARD_DB: db, ADMIN_API_TOKEN: TOKEN })

function list(db: D1Database) {
  const request = new Request('https://example.test/api/admin/cards?status=pending', { headers: { Authorization: `Bearer ${TOKEN}` } })
  return onRequestGet({ request, env: env(db) })
}

function setStatus(db: D1Database, body: string) {
  const request = new Request('https://example.test/api/admin/cards/c_1/status', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
    body,
  })
  return onRequestPatch({ request, env: env(db), params: { id: 'c_1' } })
}

describe('GET /api/admin/cards — has_more', () => {
  it('returns 100 cards and has_more=true when more than 100 match', async () => {
    const response = await list(fakeDb(150).db)
    const body = await response.json() as { items: unknown[]; has_more: boolean }
    expect(body.items).toHaveLength(100)
    expect(body.has_more).toBe(true)
  })

  it('returns has_more=false when exactly 100 match', async () => {
    const body = await (await list(fakeDb(100).db)).json() as { items: unknown[]; has_more: boolean }
    expect(body.items).toHaveLength(100)
    expect(body.has_more).toBe(false)
  })

  it('asks D1 for one row more than the page size', async () => {
    const { db, bound } = fakeDb(5)
    await list(db)
    expect(bound[0]).toEqual(['pending', 101])
  })

  it('rejects a wrong token with the contract error shape', async () => {
    const request = new Request('https://example.test/api/admin/cards?status=pending', { headers: { Authorization: 'Bearer wrong' } })
    const response = await onRequestGet({ request, env: env(fakeDb(0).db) })
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ success: false, error: { code: 'UNAUTHORIZED', message: expect.any(String) } })
  })
})

describe('PATCH /api/admin/cards/:id/status — errors', () => {
  it.each([
    ['an unknown status', '{"status":"published"}'],
    ['JSON null', 'null'],
    ['malformed JSON', '{"status":'],
  ])('answers %s with 400 and fields.status=invalid', async (_, body) => {
    const response = await setStatus(fakeDb(0).db, body)
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: expect.any(String), fields: { status: 'invalid' } },
    })
  })

  it('answers an oversized body with 413 PAYLOAD_TOO_LARGE', async () => {
    const response = await setStatus(fakeDb(0).db, JSON.stringify({ status: 'approved', pad: 'x'.repeat(2000) }))
    expect(response.status).toBe(413)
    expect((await response.json() as { error: { code: string } }).error.code).toBe('PAYLOAD_TOO_LARGE')
  })

  it('answers an unknown card with 404 NOT_FOUND', async () => {
    const response = await setStatus(fakeDb(0, 0).db, '{"status":"approved"}')
    expect(response.status).toBe(404)
    expect((await response.json() as { error: { code: string } }).error.code).toBe('NOT_FOUND')
  })
})
