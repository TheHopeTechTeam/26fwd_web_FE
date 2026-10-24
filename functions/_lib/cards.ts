import { ADMIN_TOKEN_MIN_LENGTH, MAX_BODY_BYTES, type ApiErrorBody, type ApiErrorCode, type CardStatus } from '../../src/api/types'
import { LIMITS, normalizeNewlines, validateField, type CardField } from '../../src/lib/text'

export interface Env {
  FORWARD_DB: D1Database
  TURNSTILE_SECRET_KEY?: string
  TURNSTILE_ALLOWED_HOSTNAME?: string
  ADMIN_API_TOKEN?: string
  RATE_LIMIT_SALT?: string
  CLIENT_TOKEN_SECRET?: string
  CARD_SUBMISSIONS_ENABLED?: string
  // Staging only; see loadTestActive().
  LOAD_TEST_MODE?: string
  // M1.6 (_lib/moderation.ts): the Workers AI binding and the questions (an encrypted secret).
  AI?: { run(model: string, inputs: Record<string, unknown>): Promise<unknown> }
  MODERATION_QUESTIONS?: string
}

export type CardSubmission = {
  nickname: string
  text_gratitude: string
  text_anticipate: string
  agreed_to_publish: true
  honeypot: string
  turnstile_token: string
}

type ErrorExtra = { fields?: Record<string, string>; retryAfterSeconds?: number; currentStatus?: CardStatus }

export class ApiError extends Error {
  status: number
  code: ApiErrorCode
  fields?: Record<string, string>
  retryAfterSeconds?: number
  currentStatus?: CardStatus

  constructor(status: number, code: ApiErrorCode, message: string, extra: ErrorExtra = {}) {
    super(message)
    this.status = status
    this.code = code
    this.fields = extra.fields
    this.retryAfterSeconds = extra.retryAfterSeconds
    this.currentStatus = extra.currentStatus
  }
}
const jsonHeaders = {
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
}
export const json = (data: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(data), { status, headers: { ...jsonHeaders, ...headers } })

// Every non-2xx body follows docs/api/openapi.yaml: { success: false, error: { code, message, fields?, retry_after_seconds?, current_status? } }.
export function errorResponse(status: number, code: ApiErrorCode, message: string, extra: ErrorExtra = {}): Response {
  const error: ApiErrorBody['error'] = { code, message }
  if (extra.fields) error.fields = extra.fields
  if (extra.currentStatus) error.current_status = extra.currentStatus
  const headers: Record<string, string> = {}
  if (extra.retryAfterSeconds !== undefined) {
    error.retry_after_seconds = extra.retryAfterSeconds
    headers['Retry-After'] = String(extra.retryAfterSeconds)
  }
  return json({ success: false, error } satisfies ApiErrorBody, status, headers)
}

// Field rules come from src/lib/text.ts, the same code the form and the mock API use,
// so the browser, the mock and this backend cannot disagree on what is valid.
export async function parseCardSubmission(request: Request): Promise<CardSubmission> {
  const mediaType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase()
  if (mediaType !== 'application/json') throw new ApiError(400, 'VALIDATION_ERROR', 'Content-Type must be application/json')
  const raw = await request.text()
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) throw new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Request body exceeds 4 KiB')
  let body: Record<string, unknown>
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object')
    body = parsed as Record<string, unknown>
  } catch { throw new ApiError(400, 'VALIDATION_ERROR', 'Body must be a JSON object') }

  const fields: Record<string, string> = {}
  const clean: Partial<Record<CardField, string>> = {}
  for (const field of Object.keys(LIMITS) as CardField[]) {
    const value = body[field]
    if (typeof value !== 'string') { fields[field] = 'required'; continue }
    const problem = validateField(field, value)
    if (problem) fields[field] = problem
    else clean[field] = normalizeNewlines(value).trim()
  }
  if (body.agreed_to_publish !== true) fields.agreed_to_publish = 'must_be_true'
  if (body.honeypot !== undefined && typeof body.honeypot !== 'string') fields.honeypot = 'invalid'
  if (Object.keys(fields).length > 0) throw new ApiError(400, 'VALIDATION_ERROR', 'One or more fields are invalid', { fields })

  const honeypot = typeof body.honeypot === 'string' ? body.honeypot : ''
  const token = typeof body.turnstile_token === 'string' ? body.turnstile_token : ''
  if (!honeypot && !token) throw new ApiError(400, 'TURNSTILE_FAILED', 'Missing Turnstile token')
  return {
    nickname: clean.nickname ?? '',
    text_gratitude: clean.text_gratitude ?? '',
    text_anticipate: clean.text_anticipate ?? '',
    agreed_to_publish: true,
    honeypot,
    turnstile_token: token,
  }
}

// Staging load test (#5): scripted clients cannot solve a real Turnstile challenge, so while
// LOAD_TEST_MODE=true the Turnstile check uses Cloudflare's always-pass test secret. It only takes
// effect on the hostname written here, so the variable changes nothing if it is ever set on
// production or reached through a preview URL. While active, every API response carries
// X-FWD-Load-Test: on (functions/api/_middleware.ts).
export const LOAD_TEST_HOSTNAME = '26fwd-staging.pages.dev'
const TURNSTILE_ALWAYS_PASS_SECRET = '1x0000000000000000000000000000000AA'

export function loadTestActive(request: Request, env: Env): boolean {
  return env.LOAD_TEST_MODE === 'true' && new URL(request.url).hostname === LOAD_TEST_HOSTNAME
}

export async function verifyTurnstile(token: string, request: Request, env: Env): Promise<void> {
  const loadTest = loadTestActive(request, env)
  const secret = loadTest ? TURNSTILE_ALWAYS_PASS_SECRET : env.TURNSTILE_SECRET_KEY
  if (!secret) throw new ApiError(503, 'SERVICE_UNAVAILABLE', 'Turnstile secret is not configured')
  const form = new FormData(); form.set('secret', secret); form.set('response', token)
  const ip = request.headers.get('CF-Connecting-IP'); if (ip) form.set('remoteip', ip)
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form })
  if (!response.ok) throw new Error(`Turnstile HTTP ${response.status}`)
  const result = await response.json() as { success?: boolean; hostname?: string; action?: string }
  if (!result.success) throw new ApiError(400, 'TURNSTILE_FAILED', 'Turnstile verification failed')
  // The always-pass secret answers with placeholder action and hostname values.
  if (loadTest) return
  const expectedHostname = env.TURNSTILE_ALLOWED_HOSTNAME || new URL(request.url).hostname
  if (result.action !== 'forward_card' || result.hostname !== expectedHostname)
    throw new ApiError(400, 'TURNSTILE_FAILED', 'Turnstile verification failed')
}

export function authorize(request: Request, expected?: string): void {
  const value = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  if (!expected || expected.length < ADMIN_TOKEN_MIN_LENGTH) throw new ApiError(503, 'SERVICE_UNAVAILABLE', 'Admin token is not securely configured')
  if (value.length !== expected.length) throw new ApiError(401, 'UNAUTHORIZED', 'Missing or invalid admin token')
  let diff = 0; for (let i = 0; i < value.length; i++) diff |= value.charCodeAt(i) ^ expected.charCodeAt(i)
  if (diff !== 0) throw new ApiError(401, 'UNAUTHORIZED', 'Missing or invalid admin token')
}

export function validateCardId(value: string): string {
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(value)) throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid card id')
  return value
}

export function handleError(error: unknown): Response {
  if (error instanceof ApiError) return errorResponse(error.status, error.code, error.message, { fields: error.fields, retryAfterSeconds: error.retryAfterSeconds, currentStatus: error.currentStatus })
  console.error('Card API failure', error)
  return errorResponse(500, 'INTERNAL_ERROR', 'Unexpected server error')
}
