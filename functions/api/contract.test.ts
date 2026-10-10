import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, createApiClient, describeError, type FetchLike } from '../../src/api/client'
import { createMockFetch } from '../../src/api/mock/server'
import type { Env } from '../_lib/cards'
import { onRequestPost } from './cards'

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

// D1 stand-in. `submissionsSoFar` is how many cards this client already sent this minute.
function fakeDb(submissionsSoFar = 0) {
  const counts = { minute_count: submissionsSoFar + 1, hour_count: submissionsSoFar + 1 }
  return {
    prepare(sql: string) {
      const statement = {
        bind() { return statement },
        async run() { return { meta: { changes: 1 } } },
        async all() { return { results: [] } },
        async first() { return /SELECT minute_count/.test(sql) ? counts : null },
      }
      return statement
    },
  } as unknown as D1Database
}

function makeEnv(overrides: Partial<Env> = {}, submissionsSoFar = 0): Env {
  return {
    FORWARD_DB: fakeDb(submissionsSoFar),
    TURNSTILE_SECRET_KEY: 'test-secret',
    TURNSTILE_ALLOWED_HOSTNAME: HOST,
    RATE_LIMIT_SALT: 'test-salt',
    ...overrides,
  }
}

function stubSiteverify(result: Record<string, unknown> = { success: true, action: 'forward_card', hostname: HOST }, status = 200) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(result), { status })))
}

async function viaMock(bodyText: string, submissionsSoFar = 0): Promise<Outcome> {
  const mockFetch = createMockFetch({ seed: [], latency: [0, 0], now: () => NOW })
  for (let i = 0; i < submissionsSoFar; i++) await mockFetch('/api/cards', { method: 'POST', body: JSON.stringify(valid) })
  return summarize(await mockFetch('/api/cards', { method: 'POST', body: bodyText }))
}

async function viaBackend(bodyText: string, submissionsSoFar = 0): Promise<Outcome> {
  stubSiteverify()
  const request = new Request(`https://${HOST}/api/cards`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'CF-Connecting-IP': '203.0.113.7' },
    body: bodyText,
  })
  return summarize(await onRequestPost({ request, env: makeEnv({}, submissionsSoFar) }))
}

const card = (overrides: Record<string, unknown>) => JSON.stringify({ ...valid, ...overrides })

afterEach(() => { vi.unstubAllGlobals() })

describe('POST /api/cards — mock and real backend give the same answer', () => {
  const cases: Array<{ name: string; body: string; submissionsSoFar?: number }> = [
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
    { name: 'body over 4 KiB', body: card({ text_gratitude: 'x'.repeat(5000) }) },
    { name: 'second card within the same minute', body: card({}), submissionsSoFar: 1 },
  ]

  it.each(cases)('$name', async ({ body, submissionsSoFar }) => {
    const expected = await viaMock(body, submissionsSoFar)
    const actual = await viaBackend(body, submissionsSoFar)
    expect(actual).toEqual(expected)
  })
})

// The real front-end client calling the real handler: what a visitor would see once
// VITE_API_MODE=live. Messages come from describeError(), the same function the form uses.
describe('POST /api/cards — visitor-facing result through the real client', () => {
  function clientFor(env: Env) {
    const backendFetch: FetchLike = async (input, init = {}) => onRequestPost({
      request: new Request(`https://${HOST}${input}`, {
        method: init.method,
        headers: { ...(init.headers as Record<string, string>), 'CF-Connecting-IP': '203.0.113.7' },
        body: init.body as string,
      }),
      env,
    })
    return createApiClient({ baseUrl: '', fetch: backendFetch })
  }

  async function failure(env: Env, payload: Record<string, unknown> = valid): Promise<ApiError> {
    const error = await clientFor(env).submitCard(payload as never).then(() => null, (e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    return error as ApiError
  }

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
    const error = await failure(makeEnv({}, 1))
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
    const error = await failure(makeEnv({ TURNSTILE_SECRET_KEY: undefined }))
    expect(error.code).toBe('SERVICE_UNAVAILABLE')
    expect(describeError(error)).toBe('服務暫時無法使用，請稍後再試。')
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
    expect(error.message).not.toMatch(/test-secret|test-salt|siteverify|HTTP 500/i)
  })
})
