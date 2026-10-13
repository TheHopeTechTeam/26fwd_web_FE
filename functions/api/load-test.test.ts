import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Env } from '../_lib/cards'
import { CLIENT_TOKEN_COOKIE, issueClientToken } from '../_lib/client-token'
import { createTestDb, sqliteAvailable } from '../_test/d1'
import { onRequest } from './_middleware'
import { onRequestPost } from './cards'

const STAGING = '26fwd-staging.pages.dev'
const ALWAYS_PASS_SECRET = '1x0000000000000000000000000000000AA'
const TOKEN_SECRET = 'client-token-test-secret-0123456789abcdef'
// What siteverify returns for the dummy token under the always-pass secret: no real action or hostname.
const DUMMY_RESULT = { success: true, action: '', hostname: 'example.com' }

function makeEnv(db: D1Database, overrides: Partial<Env> = {}): Env {
  return {
    FORWARD_DB: db,
    TURNSTILE_SECRET_KEY: 'real-staging-secret',
    TURNSTILE_ALLOWED_HOSTNAME: STAGING,
    RATE_LIMIT_SALT: 'test-salt',
    CLIENT_TOKEN_SECRET: TOKEN_SECRET,
    LOAD_TEST_MODE: 'true',
    ...overrides,
  }
}

async function submitTo(host: string) {
  return new Request(`https://${host}/api/cards`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'CF-Connecting-IP': '203.0.113.7',
      Cookie: `${CLIENT_TOKEN_COOKIE}=${await issueClientToken(TOKEN_SECRET, Date.now())}`,
    },
    body: JSON.stringify({
      nickname: '壓測-001', text_gratitude: '感謝神', text_anticipate: '期待更多',
      agreed_to_publish: true, honeypot: '', turnstile_token: 'XXXX.DUMMY.TOKEN.XXXX',
    }),
  })
}

function stubSiteverify(result: Record<string, unknown>) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(result)))
  vi.stubGlobal('fetch', fetchMock)
  return () => ((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as FormData).get('secret')
}

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe.skipIf(!sqliteAvailable)('staging load-test mode — Turnstile', () => {
  it('on the staging hostname, verifies with the always-pass test secret and checks only success', async () => {
    const secretSent = stubSiteverify(DUMMY_RESULT)
    const { db, query } = createTestDb()

    const response = await onRequestPost({ request: await submitTo(STAGING), env: makeEnv(db) })

    expect(response.status).toBe(201)
    expect(secretSent()).toBe(ALWAYS_PASS_SECRET)
    expect(query('SELECT nickname FROM forward_cards')).toEqual([{ nickname: '壓測-001' }])
  })

  it('still refuses a failed verification', async () => {
    stubSiteverify({ success: false })
    const { db } = createTestDb()

    const response = await onRequestPost({ request: await submitTo(STAGING), env: makeEnv(db) })

    expect(response.status).toBe(400)
  })

  it.each(['forward.thehope.co', `abc123.${STAGING}`])('has no effect on %s, even with the variable set', async host => {
    const secretSent = stubSiteverify(DUMMY_RESULT)
    const { db, query } = createTestDb()

    const response = await onRequestPost({
      request: await submitTo(host),
      env: makeEnv(db, { TURNSTILE_ALLOWED_HOSTNAME: host }),
    })

    expect(response.status).toBe(400)
    expect(secretSent()).toBe('real-staging-secret')
    expect(query('SELECT * FROM forward_cards')).toEqual([])
  })

  it('is off on staging unless the variable is exactly "true"', async () => {
    const secretSent = stubSiteverify(DUMMY_RESULT)
    const { db } = createTestDb()

    const response = await onRequestPost({ request: await submitTo(STAGING), env: makeEnv(db, { LOAD_TEST_MODE: '1' }) })

    expect(response.status).toBe(400)
    expect(secretSent()).toBe('real-staging-secret')
  })
})

describe('staging load-test mode — API response marker', () => {
  const env = (overrides: Partial<Env> = {}) => ({ FORWARD_DB: {} as D1Database, LOAD_TEST_MODE: 'true', ...overrides })
  const run = (host: string, envValue: Env) => onRequest({
    request: new Request(`https://${host}/api/client-token`, { method: 'POST' }),
    env: envValue,
    next: async () => new Response(null, { status: 204, headers: { 'Set-Cookie': 'kept=1' } }),
  })

  it('marks every API response with X-FWD-Load-Test: on and logs the request', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const response = await run(STAGING, env())

    expect(response.headers.get('X-FWD-Load-Test')).toBe('on')
    expect(response.status).toBe(204)
    expect(response.headers.get('Set-Cookie')).toBe('kept=1')
    expect(warn).toHaveBeenCalledWith('LOAD_TEST_MODE on: POST /api/client-token')
  })

  it('leaves responses unmarked when the mode is off', async () => {
    const response = await run(STAGING, env({ LOAD_TEST_MODE: undefined }))
    expect(response.headers.has('X-FWD-Load-Test')).toBe(false)
  })

  it('logs an error, and marks nothing, when the variable is set on another hostname', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await run('forward.thehope.co', env())

    expect(response.headers.has('X-FWD-Load-Test')).toBe(false)
    expect(error).toHaveBeenCalledWith(expect.stringContaining('LOAD_TEST_MODE is set but ignored on forward.thehope.co'))
  })
})
