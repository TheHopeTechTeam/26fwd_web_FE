import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, createApiClient, describeError, type FetchLike } from '../../src/api/client'
import { createMockFetch } from '../../src/api/mock/server'
import type { Env } from '../_lib/cards'
import { createTestDb, sqliteAvailable } from '../_test/d1'
import { onRequestPost as submitCardHandler } from './cards'
import { onRequestPost as clientTokenHandler } from './client-token'

// The front end was built against the in-browser mock, which follows docs/api/openapi.yaml.
// These tests send the same requests to the mock and to the real handler and require the
// same status, error code, field errors and retry hint, so "it worked against the mock"
// also means "it works against the live API".

const HOST = '26fwd-staging.pages.dev'
const NOW = Date.parse('2026-11-14T12:00:30Z')

const valid = {
  nickname: '測試',
  text_gratitude: '感謝神',
  text_anticipate: '期待更多',
  agreed_to_publish: true,
  honeypot: '',
  turnstile_token: 'token-from-widget',
}

type Outcome = { status: number; code?: string; fields?: Record<string, string>; retryHint: boolean }

async function summarize(response: Response): Promise<Outcome> {
  const body = await response.json() as { error?: { code?: string; fields?: Record<string, string>; retry_after_seconds?: number } }
  return {
    status: response.status,
    code: body.error?.code,
    fields: body.error?.fields,
    retryHint: body.error?.retry_after_seconds !== undefined && response.headers.has('Retry-After'),
  }
}

function makeEnv(overrides: Partial<Env> = {}): Env {
  return {
    FORWARD_DB: createTestDb().db,
    TURNSTILE_SECRET_KEY: 'test-secret',
    TURNSTILE_ALLOWED_HOSTNAME: HOST,
    RATE_LIMIT_SALT: 'test-salt',
    CLIENT_TOKEN_SECRET: 'client-token-test-secret-0123456789abcdef',
    ...overrides,
  }
}

// A browser tab on the real handlers. Like a real browser it keeps the cookie the server sets
// and sends it back, but only on requests made with credentials 'same-origin'. `blockCookies`
// is a browser set to refuse cookies. `log` records each response, with "+cookie" when the
// server set a new Client Token.
function browser(env: Env, { blockCookies = false } = {}) {
  let cookie: string | undefined
  const log: string[] = []
  const fetch: FetchLike = async (input, init = {}) => {
    const withCookies = init.credentials === 'same-origin'
    const headers = new Headers(init.headers)
    headers.set('CF-Connecting-IP', '203.0.113.7')
    if (withCookies && cookie) headers.set('Cookie', cookie)
    const request = new Request(`https://${HOST}${input}`, { method: init.method, headers, body: init.body as string | undefined })
    const response = await (input === '/api/client-token' ? clientTokenHandler : submitCardHandler)({ request, env })
    const setCookie = response.headers.get('Set-Cookie')
    if (withCookies && setCookie && !blockCookies) cookie = setCookie.split(';')[0]
    log.push(`${input} ${response.status}${setCookie ? ' +cookie' : ''}`)
    return response
  }
  return { fetch, log }
}

function stubSiteverify(result: Record<string, unknown> = { success: true, action: 'forward_card', hostname: HOST }, status = 200) {
  const siteverify = vi.fn(async () => new Response(JSON.stringify(result), { status }))
  vi.stubGlobal('fetch', siteverify)
  return siteverify
}

type Send = { cardsAlreadySent?: number; withToken?: boolean }

// What the browser client does, but with a raw body: get a Client Token, then post the card.
async function sendRaw(fetch: FetchLike, bodyText: string, { cardsAlreadySent = 0, withToken = true }: Send): Promise<Response> {
  const post = (path: string, body?: string) => fetch(path, {
    method: 'POST',
    credentials: 'same-origin',
    ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body }),
  })
  if (withToken) await post('/api/client-token')
  for (let i = 0; i < cardsAlreadySent; i++) await post('/api/cards', JSON.stringify(valid))
  return post('/api/cards', bodyText)
}

async function viaMock(bodyText: string, send: Send): Promise<Outcome> {
  return summarize(await sendRaw(createMockFetch({ seed: [], latency: [0, 0], now: () => NOW }), bodyText, send))
}

async function viaBackend(bodyText: string, send: Send): Promise<Outcome> {
  stubSiteverify()
  return summarize(await sendRaw(browser(makeEnv()).fetch, bodyText, send))
}

const card = (overrides: Record<string, unknown>) => JSON.stringify({ ...valid, ...overrides })

afterEach(() => { vi.unstubAllGlobals() })

describe.skipIf(!sqliteAvailable)('POST /api/cards — mock and real backend give the same answer', () => {
  const cases: Array<{ name: string; body: string } & Send> = [
    { name: 'a valid card', body: card({}) },
    { name: 'missing nickname', body: card({ nickname: undefined }) },
    { name: 'blank nickname', body: card({ nickname: '   ' }) },
    { name: 'nickname over 20 characters', body: card({ nickname: 'x'.repeat(21) }) },
    { name: 'nickname of 20 emoji (code points, not UTF-16 units)', body: card({ nickname: '😀'.repeat(20) }) },
    { name: 'gratitude over 140 characters', body: card({ text_gratitude: '感'.repeat(141) }) },
    { name: 'tab and Windows newline in a multi-line field', body: card({ text_anticipate: '第一行\t\r\n第二行' }) },
    { name: 'control character in nickname', body: card({ nickname: 'a\u0007b' }) },
    { name: 'bidi override in gratitude', body: card({ text_gratitude: '感謝‮神' }) },
    { name: 'C1 control character in anticipate', body: card({ text_anticipate: '期待\u0085更多' }) },
    { name: 'several invalid fields at once', body: card({ nickname: '', text_gratitude: '感'.repeat(141), agreed_to_publish: false }) },
    { name: 'consent not given', body: card({ agreed_to_publish: false }) },
    { name: 'consent sent as the string "true"', body: card({ agreed_to_publish: 'true' }) },
    { name: 'honeypot that is not a string', body: card({ honeypot: 1 }) },
    { name: 'filled honeypot', body: card({ honeypot: 'https://spam.example' }) },
    { name: 'body is a JSON array', body: '[]' },
    { name: 'body is JSON null', body: 'null' },
    { name: 'malformed JSON', body: '{"nickname":' },
    { name: 'body over 8 KiB', body: card({ text_gratitude: 'x'.repeat(9000) }) },
    { name: 'second card within 60 seconds', body: card({}), cardsAlreadySent: 1 },
    { name: 'no Client Token', body: card({}), withToken: false },
    { name: 'invalid fields and no Client Token (fields are checked first)', body: card({ nickname: '' }), withToken: false },
    { name: 'filled honeypot and no Client Token (the trap still answers first)', body: card({ honeypot: 'x' }), withToken: false },
  ]

  it.each(cases)('$name', async ({ body, ...send }) => {
    const expected = await viaMock(body, send)
    const actual = await viaBackend(body, send)
    expect(actual).toEqual(expected)
  })
})

// The real front-end client calling the real handlers in a simulated browser: what a visitor
// would see once VITE_API_MODE=live. Messages come from describeError(), as in the form.
describe.skipIf(!sqliteAvailable)('POST /api/cards — visitor-facing result through the real client', () => {
  async function failure(env: Env, payload: Record<string, unknown> = valid, cardsAlreadySent = 0): Promise<ApiError> {
    const client = createApiClient({ baseUrl: '', fetch: browser(env).fetch })
    for (let i = 0; i < cardsAlreadySent; i++) await client.submitCard(valid as never)
    const error = await client.submitCard(payload as never).then(() => null, (e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    return error as ApiError
  }

  it('gets a Client Token first, then the card goes through with it', async () => {
    stubSiteverify()
    const tab = browser(makeEnv())

    await expect(createApiClient({ baseUrl: '', fetch: tab.fetch }).submitCard(valid as never)).resolves.toMatchObject({ success: true })

    expect(tab.log).toEqual(['/api/client-token 204 +cookie', '/api/cards 201'])
  })

  it('a page reload keeps the same token, so the quota is not reset', async () => {
    stubSiteverify()
    const tab = browser(makeEnv())
    await createApiClient({ baseUrl: '', fetch: tab.fetch }).submitCard(valid as never)

    const reloaded = createApiClient({ baseUrl: '', fetch: tab.fetch })
    const error = await reloaded.submitCard(valid as never).then(() => null, (e: unknown) => e)

    expect((error as ApiError).code).toBe('RATE_LIMITED')
    expect(tab.log).toEqual(['/api/client-token 204 +cookie', '/api/cards 201', '/api/client-token 204', '/api/cards 429'])
  })

  it('when the server stops accepting the token (here, a secret change), the card is resent once with a new token and the same Turnstile token', async () => {
    const siteverify = stubSiteverify()
    const env = makeEnv()
    const tab = browser(env)
    let rotated = false
    const rotateBeforeFirstCard: FetchLike = (input, init) => {
      if (input === '/api/cards' && !rotated) {
        rotated = true
        env.CLIENT_TOKEN_SECRET = 'a-new-secret-after-rotation-0123456789ab'
      }
      return tab.fetch(input, init)
    }

    await expect(createApiClient({ baseUrl: '', fetch: rotateBeforeFirstCard }).submitCard(valid as never)).resolves.toMatchObject({ success: true })

    expect(tab.log).toEqual(['/api/client-token 204 +cookie', '/api/cards 401', '/api/client-token 204 +cookie', '/api/cards 201'])
    expect(siteverify).toHaveBeenCalledTimes(1)
    expect(((siteverify.mock.calls[0] as unknown as [string, RequestInit])[1].body as FormData).get('response')).toBe('token-from-widget')
  })

  it('if the browser blocks cookies, the visitor is asked to allow them, and Turnstile is never used', async () => {
    const siteverify = stubSiteverify()
    const tab = browser(makeEnv(), { blockCookies: true })

    const error = await createApiClient({ baseUrl: '', fetch: tab.fetch }).submitCard(valid as never).then(() => null, (e: unknown) => e)

    expect((error as ApiError).code).toBe('CLIENT_TOKEN_INVALID')
    expect(describeError(error)).toBe('無法完成送出驗證，請確認瀏覽器允許 Cookie 後再試一次。')
    expect(tab.log).toEqual(['/api/client-token 204 +cookie', '/api/cards 401', '/api/client-token 204 +cookie', '/api/cards 401'])
    expect(siteverify).not.toHaveBeenCalled()
  })

  it('field errors come back per field with the format message', async () => {
    stubSiteverify()
    const error = await failure(makeEnv(), { ...valid, nickname: '', text_gratitude: '感'.repeat(141) })
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.fields).toEqual({ nickname: 'required', text_gratitude: 'too_long' })
    expect(describeError(error)).toBe('格式錯誤，請檢查欄位內容後再送出。')
  })

  it('a failed Turnstile check asks the visitor to verify again', async () => {
    stubSiteverify({ success: false, 'error-codes': ['timeout-or-duplicate'] })
    const error = await failure(makeEnv())
    expect(error.code).toBe('TURNSTILE_FAILED')
    expect(describeError(error)).toBe('人機驗證未通過，請重新驗證後再送出。')
  })

  it('a missing Turnstile token gets the same verification message', async () => {
    stubSiteverify()
    const error = await failure(makeEnv(), { ...valid, turnstile_token: '' })
    expect(error.code).toBe('TURNSTILE_FAILED')
    expect(describeError(error)).toBe('人機驗證未通過，請重新驗證後再送出。')
  })

  it('rate limiting says "too frequent" and carries a retry time', async () => {
    stubSiteverify()
    const error = await failure(makeEnv(), valid, 1)
    expect(error.code).toBe('RATE_LIMITED')
    expect(error.retryAfterSeconds).toBeGreaterThan(0)
    expect(describeError(error)).toBe('發送太頻繁，請稍後再試。')
  })

  it('paused submissions read as a temporary outage', async () => {
    stubSiteverify()
    const error = await failure(makeEnv({ CARD_SUBMISSIONS_ENABLED: 'false' }))
    expect(error.code).toBe('SERVICE_UNAVAILABLE')
    expect(describeError(error)).toBe('服務暫時無法使用，請稍後再試。')
  })

  it('a missing server secret reads as a temporary outage', async () => {
    stubSiteverify()
    for (const missing of [{ TURNSTILE_SECRET_KEY: undefined }, { CLIENT_TOKEN_SECRET: undefined }]) {
      const error = await failure(makeEnv(missing))
      expect(error.code).toBe('SERVICE_UNAVAILABLE')
      expect(describeError(error)).toBe('服務暫時無法使用，請稍後再試。')
    }
  })

  it('a verification service outage is a generic system error, never a stored card', async () => {
    stubSiteverify({}, 500)
    const error = await failure(makeEnv())
    expect(error.code).toBe('INTERNAL_ERROR')
    expect(describeError(error)).toBe('系統暫時發生問題，請稍後再試。')
  })

  it('error messages never echo secrets or internal details', async () => {
    stubSiteverify({}, 500)
    const error = await failure(makeEnv())
    expect(error.message).not.toMatch(/test-secret|test-salt|client-token-test-secret|siteverify|HTTP 500/i)
  })
})
