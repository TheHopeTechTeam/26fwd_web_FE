import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Env } from '../_lib/cards'
import { CLIENT_TOKEN_COOKIE, issueClientToken } from '../_lib/client-token'
import { saltedHash } from '../_lib/rate-limit'
import { createTestDb, sqliteAvailable } from '../_test/d1'
import { onRequestPost } from './cards'

const HOST = '26fwd-staging.pages.dev'
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const WIDGET_ACTION = 'forward_card'
const TOKEN_SECRET = 'client-token-test-secret-0123456789abcdef'

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
          // Every limiter UPSERT counts the request; the limits themselves are tested on real SQLite below.
          return /RETURNING limiter_key/.test(sql) ? { limiter_key: params[0] } : null
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
    CLIENT_TOKEN_SECRET: TOKEN_SECRET,
    ...overrides,
  }
}

// `token`: omitted → a fresh valid Client Token; null → no cookie at all; a string → that token.
async function submit(body: Record<string, unknown>, { token, ip = '203.0.113.7' }: { token?: string | null; ip?: string } = {}) {
  const headers: Record<string, string> = { 'content-type': 'application/json', 'CF-Connecting-IP': ip }
  const cookie = token === undefined ? await issueClientToken(TOKEN_SECRET, Date.now()) : token
  if (cookie) headers.Cookie = `${CLIENT_TOKEN_COOKIE}=${cookie}`
  return new Request(`https://${HOST}/api/cards`, { method: 'POST', headers, body: JSON.stringify(body) })
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

    const response = await onRequestPost({ request: await submit(validCard), env: makeEnv(db) })

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

    const response = await onRequestPost({ request: await submit(validCard), env: makeEnv(db) })

    expect(response.status).toBe(400)
    expect(await errorCode(response)).toMatch(/^TURNSTILE_/)
    expect(calls).toHaveLength(0)
  })

  it('rejects a token solved on another hostname and writes nothing', async () => {
    mockSiteverify({ success: true, action: WIDGET_ACTION, hostname: 'abc123.26fwd-staging.pages.dev' })
    const { db, calls } = createFakeDb()

    const response = await onRequestPost({ request: await submit(validCard), env: makeEnv(db) })

    expect(response.status).toBe(400)
    expect(calls).toHaveLength(0)
  })

  it('rejects an expired or replayed token and writes nothing', async () => {
    mockSiteverify({ success: false, 'error-codes': ['timeout-or-duplicate'] })
    const { db, calls } = createFakeDb()

    const response = await onRequestPost({ request: await submit(validCard), env: makeEnv(db) })

    expect(response.status).toBe(400)
    expect(calls).toHaveLength(0)
  })

  it('does not bypass verification when siteverify returns HTTP 500', async () => {
    mockSiteverify({ success: true, action: WIDGET_ACTION, hostname: HOST }, 500)
    const { db, calls } = createFakeDb()

    const response = await onRequestPost({ request: await submit(validCard), env: makeEnv(db) })

    expect(response.status).toBe(500)
    expect(calls).toHaveLength(0)
  })

  it('does not bypass verification when siteverify is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('network down') }))
    const { db, calls } = createFakeDb()

    const response = await onRequestPost({ request: await submit(validCard), env: makeEnv(db) })

    expect(response.status).toBe(500)
    expect(calls).toHaveLength(0)
  })

  it('rejects a submission without a token before calling siteverify', async () => {
    const fetchMock = mockSiteverify({ success: true, action: WIDGET_ACTION, hostname: HOST })
    const { db, calls } = createFakeDb()

    const response = await onRequestPost({ request: await submit({ ...validCard, turnstile_token: '' }), env: makeEnv(db) })

    expect(response.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(calls).toHaveLength(0)
  })

  it('returns 503 and writes nothing when the Turnstile secret is not configured', async () => {
    const fetchMock = mockSiteverify({ success: true, action: WIDGET_ACTION, hostname: HOST })
    const { db, calls } = createFakeDb()

    const response = await onRequestPost({ request: await submit(validCard), env: makeEnv(db, { TURNSTILE_SECRET_KEY: undefined }) })

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

    const response = await onRequestPost({ request: await submit({ ...validCard, honeypot: 'https://spam.example' }), env: makeEnv(db) })

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
      const response = await onRequestPost({ request: await submit({ ...validCard, honeypot: 'x' }), env: makeEnv(db) })
      ids.add((await response.json() as { card_id: unknown }).card_id)
    }

    expect(ids.size).toBe(3)
  })

  it('still discards a honeypot hit that carries no Turnstile token', async () => {
    const { db, calls } = createFakeDb()

    const response = await onRequestPost({ request: await submit({ ...validCard, honeypot: 'x', turnstile_token: '' }), env: makeEnv(db) })

    expect(response.status).toBe(201)
    expect(calls).toHaveLength(0)
  })

  it('returns the id of the card actually stored for a normal submission', async () => {
    mockSiteverify({ success: true, action: WIDGET_ACTION, hostname: HOST })
    const { db, cardInserts } = createFakeDb()

    const response = await onRequestPost({ request: await submit(validCard), env: makeEnv(db) })

    const body = await response.json() as { card_id: string }
    expect(body.card_id).toMatch(CARD_ID)
    expect(cardInserts()[0]?.params[0]).toBe(body.card_id)
  })
})

describe('POST /api/cards — Client Token', () => {
  it('refuses a card without a token with 401 CLIENT_TOKEN_INVALID, before Turnstile and without writing', async () => {
    const fetchMock = mockSiteverify({ success: true, action: WIDGET_ACTION, hostname: HOST })
    const { db, calls } = createFakeDb()

    const response = await onRequestPost({ request: await submit(validCard, { token: null }), env: makeEnv(db) })

    expect(response.status).toBe(401)
    expect(await errorCode(response)).toBe('CLIENT_TOKEN_INVALID')
    // The Turnstile token is still unused, so the browser can fetch a new Client Token and resend it.
    expect(fetchMock).not.toHaveBeenCalled()
    expect(calls).toHaveLength(0)
  })

  it('refuses expired, tampered and old-secret tokens the same way', async () => {
    mockSiteverify({ success: true, action: WIDGET_ACTION, hostname: HOST })
    const { db, calls } = createFakeDb()
    const [version, id, expires, signature] = (await issueClientToken(TOKEN_SECRET, Date.now())).split('.') as [string, string, string, string]
    const tokens = [
      await issueClientToken(TOKEN_SECRET, Date.now() - 7200_000),
      [version, id, String(Number(expires) + 3600), signature].join('.'),
      await issueClientToken('a-previous-secret-that-was-rotated-out', Date.now()),
    ]

    for (const token of tokens) {
      const response = await onRequestPost({ request: await submit(validCard, { token }), env: makeEnv(db) })
      expect(response.status).toBe(401)
      expect(await errorCode(response)).toBe('CLIENT_TOKEN_INVALID')
    }
    expect(calls).toHaveLength(0)
  })

  it('checks the fields and the honeypot before the token', async () => {
    const { db, calls } = createFakeDb()

    const invalid = await onRequestPost({ request: await submit({ ...validCard, nickname: '' }, { token: null }), env: makeEnv(db) })
    const trapped = await onRequestPost({ request: await submit({ ...validCard, honeypot: 'x' }, { token: null }), env: makeEnv(db) })

    expect(invalid.status).toBe(400)
    expect(trapped.status).toBe(201)
    expect(calls).toHaveLength(0)
  })

  it('answers 503 when the token secret is not configured, without calling Turnstile', async () => {
    const fetchMock = mockSiteverify({ success: true, action: WIDGET_ACTION, hostname: HOST })
    const { db, calls } = createFakeDb()

    const response = await onRequestPost({ request: await submit(validCard), env: makeEnv(db, { CLIENT_TOKEN_SECRET: undefined }) })

    expect(response.status).toBe(503)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(calls).toHaveLength(0)
  })
})

describe.skipIf(!sqliteAvailable)('POST /api/cards — rate limits (real SQLite)', () => {
  const NOW = Date.parse('2026-11-13T12:00:10Z')

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    mockSiteverify({ success: true, action: WIDGET_ACTION, hostname: HOST })
  })
  afterEach(() => { vi.useRealTimers() })

  async function send(env: Env, options: { token?: string; ip?: string } = {}) {
    const response = await onRequestPost({ request: await submit(validCard, options), env })
    const body = await response.json() as { error?: { code?: string; retry_after_seconds?: number } }
    return { status: response.status, code: body.error?.code, retry: body.error?.retry_after_seconds }
  }

  it('the same browser waits 60 seconds between cards; another browser on the same IP is not held up', async () => {
    const { db } = createTestDb()
    const env = makeEnv(db)
    const mine = await issueClientToken(TOKEN_SECRET, NOW)

    expect(await send(env, { token: mine })).toMatchObject({ status: 201 })
    vi.setSystemTime(NOW + 20_000)
    expect(await send(env, { token: mine })).toEqual({ status: 429, code: 'RATE_LIMITED', retry: 40 })
    expect(await send(env, { token: await issueClientToken(TOKEN_SECRET, NOW) })).toMatchObject({ status: 201 })
    vi.setSystemTime(NOW + 60_000)
    expect(await send(env, { token: mine })).toMatchObject({ status: 201 })
  })

  it('regression (load test 10/21): a first card is not refused when it reaches the database after a later one', async () => {
    const { db } = createTestDb()
    const env = makeEnv(db)

    vi.setSystemTime(NOW + 500)
    expect(await send(env)).toMatchObject({ status: 201 })
    vi.setSystemTime(NOW)
    expect(await send(env)).toMatchObject({ status: 201 })
  })

  it('regression (#13 review): when 300 people at one venue all resend within 60 seconds, the next 100 people can still send', async () => {
    const { db, query } = createTestDb()
    const env = makeEnv(db)
    const crowd = await Promise.all(Array.from({ length: 300 }, () => issueClientToken(TOKEN_SECRET, NOW)))
    const ipCount = () => query(`SELECT minute_count FROM submission_rate_limits WHERE limiter_key LIKE 'ip:%'`)[0]?.minute_count

    for (const token of crowd) expect((await send(env, { token })).status).toBe(201)
    vi.setSystemTime(NOW + 20_000)
    for (const token of crowd) expect(await send(env, { token })).toEqual({ status: 429, code: 'RATE_LIMITED', retry: 40 })
    expect(ipCount()).toBe(300)

    for (let i = 0; i < 100; i++) expect((await send(env)).status).toBe(201)
    expect(ipCount()).toBe(400)
  })

  it('400 browsers behind one IP can each send a card in the same minute; the 401st is refused, other IPs are not', async () => {
    const { db, query } = createTestDb()
    const env = makeEnv(db)

    for (let i = 0; i < 400; i++) expect((await send(env)).status).toBe(201)

    expect(await send(env)).toEqual({ status: 429, code: 'RATE_LIMITED', retry: 50 })
    expect(await send(env, { ip: '198.51.100.20' })).toMatchObject({ status: 201 })
    expect(query('SELECT COUNT(*) AS cards FROM forward_cards')).toEqual([{ cards: 401 }])
  })

  it('caps one IP at 2,000 cards per clock hour', async () => {
    const { db, query } = createTestDb()
    const hour = Math.floor(NOW / 3_600_000)
    query(`INSERT INTO submission_rate_limits VALUES (?, 0, 0, ?, 2000, NULL)`, `ip:${await saltedHash('test-salt', '203.0.113.7')}`, hour)

    expect(await send(makeEnv(db))).toEqual({ status: 429, code: 'RATE_LIMITED', retry: 3590 })
  })

  it('stores nothing for a refused card, and the limiter keeps only salted hashes', async () => {
    const { db, query } = createTestDb()
    const env = makeEnv(db)
    const token = await issueClientToken(TOKEN_SECRET, NOW)

    await send(env, { token })
    await send(env, { token })

    expect(query('SELECT COUNT(*) AS cards FROM forward_cards')).toEqual([{ cards: 1 }])
    const keys = query('SELECT limiter_key FROM submission_rate_limits').map(row => String(row.limiter_key)).sort()
    expect(keys).toHaveLength(2)
    expect(keys[0]).toMatch(/^ip:[0-9a-f]{64}$/)
    expect(keys[1]).toMatch(/^tok:[0-9a-f]{64}$/)
    expect(JSON.stringify(query('SELECT * FROM submission_rate_limits'))).not.toMatch(new RegExp(`203\\.0\\.113\\.7|${token.split('.')[1]}`))
  })
})

describe('POST /api/cards — model judgment after the response (M1.6)', () => {
  it('hands a stored card to waitUntil; a honeypot hit or a refused card hands over nothing', async () => {
    mockSiteverify({ success: true, action: WIDGET_ACTION, hostname: HOST })
    const { db } = createFakeDb()
    const waitUntil = vi.fn()
    expect((await onRequestPost({ request: await submit(validCard), env: makeEnv(db), waitUntil })).status).toBe(201)
    expect(waitUntil).toHaveBeenCalledTimes(1)
    // With this fake database the switch reads as off, so the judgment ends at once.
    await expect(waitUntil.mock.calls[0]?.[0]).resolves.toBeUndefined()

    const untouched = vi.fn()
    await onRequestPost({ request: await submit({ ...validCard, honeypot: 'x' }), env: makeEnv(db), waitUntil: untouched })
    await onRequestPost({ request: await submit(validCard, { token: null }), env: makeEnv(db), waitUntil: untouched })
    expect(untouched).not.toHaveBeenCalled()
  })
})

describe.skipIf(!sqliteAvailable)('POST /api/cards — auto-publish end to end (real SQLite)', () => {
  const questions = JSON.stringify({ needs_attention: { criteria: { true: 't', false: 'f' } }, reason: { criteria: { none: 'n', flag_a: 'a' } } })
  const clef = (choice: string) => ({ run: vi.fn(async () => ({ answers: { needs_attention: { noul: 0.1 }, reason: { choice, probabilities: { [choice]: 0.9 } } }, usage: { input_tokens: 700 } })) })

  async function sendAndJudge(choice: string, switchValue: string) {
    mockSiteverify({ success: true, action: WIDGET_ACTION, hostname: HOST })
    const { db, query } = createTestDb()
    query("UPDATE app_settings SET value = ? WHERE key = 'auto_publish'", switchValue)
    const AI = clef(choice)
    const pending: Promise<unknown>[] = []
    const response = await onRequestPost({ request: await submit(validCard), env: { ...makeEnv(db), AI, MODERATION_QUESTIONS: questions }, waitUntil: promise => pending.push(promise) })
    const { card_id } = await response.json() as { card_id: string }
    // The response came first; the card was stored pending before any judgment.
    expect(query('SELECT status FROM forward_cards WHERE id = ?', card_id)).toEqual([{ status: 'pending' }])
    await Promise.all(pending)
    return { status: query('SELECT status FROM forward_cards WHERE id = ?', card_id)[0]?.status, judgments: query('SELECT outcome, auto_published FROM card_moderations'), AI }
  }

  it('switch on and no reason to hold it: published after the response, with the judgment recorded', async () => {
    expect(await sendAndJudge('none', 'on')).toMatchObject({ status: 'approved', judgments: [{ outcome: 'clear', auto_published: 1 }] })
  })

  it('switch on and some reason: stays pending for a reviewer', async () => {
    expect(await sendAndJudge('flag_a', 'on')).toMatchObject({ status: 'pending', judgments: [{ outcome: 'flagged', auto_published: 0 }] })
  })

  it('switch off: stays pending, and the model is never called', async () => {
    const result = await sendAndJudge('none', 'off')
    expect(result).toMatchObject({ status: 'pending', judgments: [] })
    expect(result.AI.run).not.toHaveBeenCalled()
  })
})
