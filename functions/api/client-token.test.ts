import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Env } from '../_lib/cards'
import { CLIENT_TOKEN_COOKIE, issueClientToken } from '../_lib/client-token'
import { createTestDb, sqliteAvailable } from '../_test/d1'
import { onRequestPost } from './client-token'

const HOST = '26fwd-staging.pages.dev'
const SECRET = 'client-token-test-secret-0123456789abcdef'
const NOW = Date.parse('2026-11-13T12:00:30Z')
const TOKEN_FORMAT = /^v1\.[A-Za-z0-9_-]{22}\.\d{10}\.[A-Za-z0-9_-]{43}$/

function makeEnv(db: D1Database, overrides: Partial<Env> = {}): Env {
  return { FORWARD_DB: db, CLIENT_TOKEN_SECRET: SECRET, RATE_LIMIT_SALT: 'test-salt', ...overrides }
}

function tokenRequest({ token, ip = '203.0.113.7' }: { token?: string; ip?: string } = {}) {
  const headers: Record<string, string> = { 'CF-Connecting-IP': ip }
  if (token) headers.Cookie = `theme=dark; ${CLIENT_TOKEN_COOKIE}=${token}`
  return new Request(`https://${HOST}/api/client-token`, { method: 'POST', headers })
}

const issuedToken = (response: Response) => new RegExp(`^${CLIENT_TOKEN_COOKIE}=([^;]+)`).exec(response.headers.get('Set-Cookie') ?? '')?.[1]

describe.skipIf(!sqliteAvailable)('POST /api/client-token', () => {
  beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW) })
  afterEach(() => { vi.useRealTimers() })

  it('issues a signed token in an HttpOnly, Secure, SameSite=Strict cookie that lasts 2 hours', async () => {
    const { db } = createTestDb()

    const response = await onRequestPost({ request: tokenRequest(), env: makeEnv(db) })

    expect(response.status).toBe(204)
    expect(issuedToken(response)).toMatch(TOKEN_FORMAT)
    const cookie = response.headers.get('Set-Cookie') ?? ''
    for (const attribute of ['Max-Age=7200', 'Path=/', 'Secure', 'HttpOnly', 'SameSite=Strict']) expect(cookie).toContain(`; ${attribute}`)
    expect(cookie).not.toMatch(/Domain=/i)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })

  it('keeps a still-valid token, so reloading the page does not reset its quota or count as a new token', async () => {
    const { db, query } = createTestDb()
    const token = await issueClientToken(SECRET, NOW - 60 * 60_000)

    const response = await onRequestPost({ request: tokenRequest({ token }), env: makeEnv(db) })

    expect(response.status).toBe(204)
    expect(response.headers.get('Set-Cookie')).toBeNull()
    expect(query('SELECT * FROM submission_rate_limits')).toEqual([])
  })

  it('replaces a token that is expired, tampered with, signed with an old secret or malformed', async () => {
    const { db } = createTestDb()
    const good = await issueClientToken(SECRET, NOW)
    const [version, id, expires, signature] = good.split('.') as [string, string, string, string]
    const bad = {
      expired: await issueClientToken(SECRET, NOW - 7200_000),
      'expiry pushed later': [version, id, String(Number(expires) + 3600), signature].join('.'),
      // The first character: the last one carries two unused bits, so changing it may decode to the same bytes.
      'signature changed': [version, id, expires, `${signature.startsWith('A') ? 'B' : 'A'}${signature.slice(1)}`].join('.'),
      'old secret': await issueClientToken('a-previous-secret-that-was-rotated-out', NOW),
      malformed: 'v1.not-a-token',
    }

    for (const [name, token] of Object.entries(bad)) {
      const response = await onRequestPost({ request: tokenRequest({ token }), env: makeEnv(db) })
      expect(response.status, name).toBe(204)
      expect(issuedToken(response), name).toMatch(TOKEN_FORMAT)
      expect(issuedToken(response), name).not.toBe(token)
    }
  })

  it('issues 600 new tokens per IP per minute, then answers 429 with a retry time; other IPs are unaffected', async () => {
    const { db } = createTestDb()
    const env = makeEnv(db)
    for (let i = 0; i < 600; i++) expect((await onRequestPost({ request: tokenRequest(), env })).status).toBe(204)

    const refused = await onRequestPost({ request: tokenRequest(), env })
    expect(refused.status).toBe(429)
    expect(refused.headers.get('Set-Cookie')).toBeNull()
    expect(await refused.json()).toMatchObject({ error: { code: 'RATE_LIMITED', retry_after_seconds: 30 } })
    expect((await onRequestPost({ request: tokenRequest({ ip: '198.51.100.20' }), env })).status).toBe(204)

    vi.setSystemTime(NOW + 30_000)
    expect((await onRequestPost({ request: tokenRequest(), env })).status).toBe(204)
  })

  it('stores only a salted hash of the IP, never the IP or the token', async () => {
    const { db, query } = createTestDb()
    const response = await onRequestPost({ request: tokenRequest(), env: makeEnv(db) })
    const stored = JSON.stringify(query('SELECT * FROM submission_rate_limits'))
    expect(stored).toMatch(/"iss:[0-9a-f]{64}"/)
    expect(stored).not.toContain('203.0.113.7')
    expect(stored).not.toContain(issuedToken(response)?.split('.')[1])
  })

  it('answers 503 without issuing anything when the secret is missing or too short', async () => {
    const { db, query } = createTestDb()
    for (const secret of [undefined, 'short-secret']) {
      const response = await onRequestPost({ request: tokenRequest(), env: makeEnv(db, { CLIENT_TOKEN_SECRET: secret }) })
      expect(response.status).toBe(503)
      expect(response.headers.get('Set-Cookie')).toBeNull()
    }
    expect(query('SELECT * FROM submission_rate_limits')).toEqual([])
  })

  it('answers 503 while card submissions are paused', async () => {
    const { db } = createTestDb()
    const response = await onRequestPost({ request: tokenRequest(), env: makeEnv(db, { CARD_SUBMISSIONS_ENABLED: 'false' }) })
    expect(response.status).toBe(503)
    expect(response.headers.get('Set-Cookie')).toBeNull()
  })
})
