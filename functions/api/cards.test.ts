import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Env } from '../_lib/cards'
import { onRequestPost } from './cards'

const HOST = '26fwd-staging.pages.dev'
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const WIDGET_ACTION = 'forward_card'

type Call = { sql: string; params: unknown[] }

// Minimal in-memory stand-in for D1: records every statement so tests can assert what was written.
function createFakeDb() {
  const calls: Call[] = []
  const db = {
    prepare(sql: string) {
      let params: unknown[] = []
      const statement = {
        bind(...values: unknown[]) { params = values; return statement },
        async run() { calls.push({ sql, params }); return { meta: { changes: 1 } } },
        async all() { calls.push({ sql, params }); return { results: [] } },
        async first() {
          calls.push({ sql, params })
          return /SELECT minute_count/.test(sql) ? { minute_count: 1, hour_count: 1 } : null
        },
      }
      return statement
    },
  }
  return {
    db: db as unknown as D1Database,
    calls,
    cardInserts: () => calls.filter(call => /INSERT INTO forward_cards/.test(call.sql)),
  }
}

function makeEnv(db: D1Database, overrides: Partial<Env> = {}): Env {
  return {
    FORWARD_DB: db,
    TURNSTILE_SECRET_KEY: 'test-secret',
    TURNSTILE_ALLOWED_HOSTNAME: HOST,
    RATE_LIMIT_SALT: 'test-salt',
    ...overrides,
  }
}

function submit(body: Record<string, unknown>) {
  return new Request(`https://${HOST}/api/cards`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'CF-Connecting-IP': '203.0.113.7' },
    body: JSON.stringify(body),
  })
}

const validCard = {
  nickname: '測試',
  text_gratitude: '感謝神',
  text_anticipate: '期待更多',
  agreed_to_publish: true,
  honeypot: '',
  turnstile_token: 'token-from-widget',
}

function mockSiteverify(result: Record<string, unknown>, status = 200) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(result), { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

// Reads the error code from either the current `{ error: CODE }` shape or the
// OpenAPI `{ error: { code } }` shape that #7 will move to.
async function errorCode(response: Response) {
  const body = await response.json() as { error?: string | { code?: string } }
  return typeof body.error === 'string' ? body.error : body.error?.code
}

afterEach(() => { vi.unstubAllGlobals() })

describe('POST /api/cards — Turnstile verification', () => {
  it('stores a pending card when siteverify returns the widget action and hostname', async () => {
    const fetchMock = mockSiteverify({ success: true, action: WIDGET_ACTION, hostname: HOST })
    const { db, cardInserts } = createFakeDb()

    const response = await onRequestPost({ request: submit(validCard), env: makeEnv(db) })

    expect(response.status).toBe(201)
    const body = await response.json() as { card_id: string }
    expect(body.card_id).toMatch(/^c_[0-9a-f-]{36}$/)
    expect(cardInserts()).toHaveLength(1)
    expect(cardInserts()[0]?.sql).toContain("'pending'")

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(SITEVERIFY)
    const form = init.body as FormData
    expect(form.get('secret')).toBe('test-secret')
    expect(form.get('response')).toBe('token-from-widget')
    expect(form.get('remoteip')).toBe('203.0.113.7')
  })

  it('regression: rejects the hyphenated action forward-card and writes nothing', async () => {
    mockSiteverify({ success: true, action: 'forward-card', hostname: HOST })
    const { db, calls } = createFakeDb()

    const response = await onRequestPost({ request: submit(validCard), env: makeEnv(db) })

    expect(response.status).toBe(400)
    expect(await errorCode(response)).toMatch(/^TURNSTILE_/)
    expect(calls).toHaveLength(0)
  })

  it('rejects a token solved on another hostname and writes nothing', async () => {
    mockSiteverify({ success: true, action: WIDGET_ACTION, hostname: 'abc123.26fwd-staging.pages.dev' })
    const { db, calls } = createFakeDb()

    const response = await onRequestPost({ request: submit(validCard), env: makeEnv(db) })

    expect(response.status).toBe(400)
    expect(calls).toHaveLength(0)
  })

  it('rejects an expired or replayed token and writes nothing', async () => {
    mockSiteverify({ success: false, 'error-codes': ['timeout-or-duplicate'] })
    const { db, calls } = createFakeDb()

    const response = await onRequestPost({ request: submit(validCard), env: makeEnv(db) })

    expect(response.status).toBe(400)
    expect(calls).toHaveLength(0)
  })

  it('does not bypass verification when siteverify returns HTTP 500', async () => {
    mockSiteverify({ success: true, action: WIDGET_ACTION, hostname: HOST }, 500)
    const { db, calls } = createFakeDb()

    const response = await onRequestPost({ request: submit(validCard), env: makeEnv(db) })

    expect(response.status).toBe(500)
    expect(calls).toHaveLength(0)
  })

  it('does not bypass verification when siteverify is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('network down') }))
    const { db, calls } = createFakeDb()

    const response = await onRequestPost({ request: submit(validCard), env: makeEnv(db) })

    expect(response.status).toBe(500)
    expect(calls).toHaveLength(0)
  })

  it('rejects a submission without a token before calling siteverify', async () => {
    const fetchMock = mockSiteverify({ success: true, action: WIDGET_ACTION, hostname: HOST })
    const { db, calls } = createFakeDb()

    const response = await onRequestPost({ request: submit({ ...validCard, turnstile_token: '' }), env: makeEnv(db) })

    expect(response.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(calls).toHaveLength(0)
  })

  it('returns 503 and writes nothing when the Turnstile secret is not configured', async () => {
    const fetchMock = mockSiteverify({ success: true, action: WIDGET_ACTION, hostname: HOST })
    const { db, calls } = createFakeDb()

    const response = await onRequestPost({ request: submit(validCard), env: makeEnv(db, { TURNSTILE_SECRET_KEY: undefined }) })

    expect(response.status).toBe(503)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(calls).toHaveLength(0)
  })
})

describe('POST /api/cards — honeypot', () => {
  const CARD_ID = /^c_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

  it('answers a filled honeypot like a real success, without writing or verifying anything', async () => {
    const fetchMock = mockSiteverify({ success: true, action: WIDGET_ACTION, hostname: HOST })
    const { db, calls } = createFakeDb()

    const response = await onRequestPost({ request: submit({ ...validCard, honeypot: 'https://spam.example' }), env: makeEnv(db) })

    expect(response.status).toBe(201)
    const body = await response.json() as Record<string, unknown>
    expect(Object.keys(body).sort()).toEqual(['card_id', 'success'])
    expect(body.success).toBe(true)
    expect(body.card_id).toMatch(CARD_ID)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(calls).toHaveLength(0)
  })

  it('returns a different fake id each time, so the trap has no fixed fingerprint', async () => {
    const { db } = createFakeDb()
    const ids = new Set<unknown>()

    for (let i = 0; i < 3; i++) {
      const response = await onRequestPost({ request: submit({ ...validCard, honeypot: 'x' }), env: makeEnv(db) })
      ids.add((await response.json() as { card_id: unknown }).card_id)
    }

    expect(ids.size).toBe(3)
  })

  it('still discards a honeypot hit that carries no Turnstile token', async () => {
    const { db, calls } = createFakeDb()

    const response = await onRequestPost({ request: submit({ ...validCard, honeypot: 'x', turnstile_token: '' }), env: makeEnv(db) })

    expect(response.status).toBe(201)
    expect(calls).toHaveLength(0)
  })

  it('returns the id of the card actually stored for a normal submission', async () => {
    mockSiteverify({ success: true, action: WIDGET_ACTION, hostname: HOST })
    const { db, cardInserts } = createFakeDb()

    const response = await onRequestPost({ request: submit(validCard), env: makeEnv(db) })

    const body = await response.json() as { card_id: string }
    expect(body.card_id).toMatch(CARD_ID)
    expect(cardInserts()[0]?.params[0]).toBe(body.card_id)
  })
})
