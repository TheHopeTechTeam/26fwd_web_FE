export interface Env {
  FORWARD_DB: D1Database
  TURNSTILE_SECRET_KEY?: string
  TURNSTILE_ALLOWED_HOSTNAME?: string
  ADMIN_API_TOKEN?: string
  RATE_LIMIT_SALT?: string
  CARD_SUBMISSIONS_ENABLED?: string
}

export type CardSubmission = {
  nickname: string
  text_gratitude: string
  text_anticipate: string
  agreed_to_publish: true
  honeypot: string
  turnstile_token: string
}

export class ApiError extends Error {
  status: number
  code: string
  retryAfterSeconds?: number

  constructor(status: number, code: string, message: string, retryAfterSeconds?: number) {
    super(message)
    this.status = status
    this.code = code
    this.retryAfterSeconds = retryAfterSeconds
  }
}
const length = (value: string) => Array.from(value).length
const hasControlCharacters = (value: string, allowTextWhitespace: boolean) => Array.from(value).some(character => {
  const code = character.charCodeAt(0)
  if (code === 127) return true
  if (code > 31) return false
  return !allowTextWhitespace || (code !== 9 && code !== 10 && code !== 13)
})
const jsonHeaders = {
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
}
export const json = (data: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(data), { status, headers: { ...jsonHeaders, ...headers } })

export async function parseCardSubmission(request: Request): Promise<CardSubmission> {
  const mediaType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase()
  if (mediaType !== 'application/json')
    throw new ApiError(400, 'VALIDATION_ERROR', '只接受 JSON 格式')
  const raw = await request.text()
  if (new TextEncoder().encode(raw).byteLength > 4096)
    throw new ApiError(400, 'VALIDATION_ERROR', '內容超過 4 KiB')
  let body: Record<string, unknown>
  try { body = JSON.parse(raw) as Record<string, unknown> } catch { throw new ApiError(400, 'VALIDATION_ERROR', 'JSON 格式錯誤') }
  const nickname = typeof body.nickname === 'string' ? body.nickname.trim() : ''
  const gratitude = typeof body.text_gratitude === 'string' ? body.text_gratitude.trim() : ''
  const anticipate = typeof body.text_anticipate === 'string' ? body.text_anticipate.trim() : ''
  const honeypot = typeof body.honeypot === 'string' ? body.honeypot : ''
  const token = typeof body.turnstile_token === 'string' ? body.turnstile_token : ''
  if (length(nickname) < 1 || length(nickname) > 20) throw new ApiError(400, 'VALIDATION_ERROR', '暱稱需為 1–20 字')
  if (hasControlCharacters(nickname, false)) throw new ApiError(400, 'VALIDATION_ERROR', '暱稱不可包含控制字元')
  if (hasControlCharacters(`${gratitude}${anticipate}`, true))
    throw new ApiError(400, 'VALIDATION_ERROR', '內容包含不支援的控制字元')
  if (length(gratitude) < 1 || length(gratitude) > 140 || length(anticipate) < 1 || length(anticipate) > 140)
    throw new ApiError(400, 'VALIDATION_ERROR', '每題需為 1–140 字')
  if (body.agreed_to_publish !== true) throw new ApiError(400, 'VALIDATION_ERROR', '請確認公開分享同意')
  if (!honeypot && !token) throw new ApiError(400, 'VALIDATION_ERROR', '缺少 Turnstile 驗證')
  return { nickname, text_gratitude: gratitude, text_anticipate: anticipate, agreed_to_publish: true, honeypot, turnstile_token: token }
}

export async function verifyTurnstile(token: string, request: Request, secret?: string, allowedHostname?: string): Promise<void> {
  if (!secret) throw new ApiError(503, 'CONFIGURATION_ERROR', '驗證服務尚未設定')
  const form = new FormData(); form.set('secret', secret); form.set('response', token)
  const ip = request.headers.get('CF-Connecting-IP'); if (ip) form.set('remoteip', ip)
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form })
  if (!response.ok) throw new Error(`Turnstile HTTP ${response.status}`)
  const result = await response.json() as { success?: boolean; hostname?: string; action?: string }
  const requestHostname = new URL(request.url).hostname
  const expectedHostname = allowedHostname || requestHostname
  if (!result.success || result.action !== 'forward-card' || result.hostname !== expectedHostname)
    throw new ApiError(400, 'TURNSTILE_ERROR', '人機驗證失敗')
}

export async function hashClientIp(request: Request, salt?: string): Promise<string> {
  if (!salt) throw new ApiError(503, 'CONFIGURATION_ERROR', '限流服務尚未設定')
  const ip = request.headers.get('CF-Connecting-IP')
  if (!ip) throw new ApiError(400, 'VALIDATION_ERROR', '無法辨識連線來源')
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${ip}`))
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function consumeRateLimit(db: D1Database, ipHash: string, now: number): Promise<void> {
  const minute = Math.floor(now / 60000), hour = Math.floor(now / 3600000)
  if (Number.parseInt(ipHash.slice(0, 2), 16) % 64 === minute % 64)
    await db.prepare('DELETE FROM submission_rate_limits WHERE hour_bucket < ?').bind(hour - 24).run()
  await db.prepare(`INSERT INTO submission_rate_limits (ip_hash, minute_bucket, minute_count, hour_bucket, hour_count)
    VALUES (?, ?, 1, ?, 1) ON CONFLICT(ip_hash) DO UPDATE SET
    minute_count = CASE WHEN minute_bucket = excluded.minute_bucket THEN minute_count + 1 ELSE 1 END,
    minute_bucket = excluded.minute_bucket,
    hour_count = CASE WHEN hour_bucket = excluded.hour_bucket THEN hour_count + 1 ELSE 1 END,
    hour_bucket = excluded.hour_bucket`).bind(ipHash, minute, hour).run()
  const row = await db.prepare('SELECT minute_count, hour_count FROM submission_rate_limits WHERE ip_hash = ?').bind(ipHash).first<{ minute_count: number; hour_count: number }>()
  if (!row) throw new Error('Rate limit state unavailable')
  if (row.hour_count > 3) throw new ApiError(429, 'RATE_LIMITED', '發送太頻繁，請稍後再試', Math.max(1, Math.ceil(((hour + 1) * 3600000 - now) / 1000)))
  if (row.minute_count > 1) throw new ApiError(429, 'RATE_LIMITED', '發送太頻繁，請稍後再試', Math.max(1, Math.ceil(((minute + 1) * 60000 - now) / 1000)))
}

export function authorize(request: Request, expected?: string): void {
  const value = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  if (!expected || expected.length < 32) throw new ApiError(503, 'CONFIGURATION_ERROR', '管理驗證尚未安全設定')
  if (value.length !== expected.length) throw new ApiError(401, 'UNAUTHORIZED', '未授權')
  let diff = 0; for (let i = 0; i < value.length; i++) diff |= value.charCodeAt(i) ^ expected.charCodeAt(i)
  if (diff !== 0) throw new ApiError(401, 'UNAUTHORIZED', '未授權')
}

export function validateCardId(value: string): string {
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(value)) throw new ApiError(400, 'VALIDATION_ERROR', '無效卡片編號')
  return value
}

export function handleError(error: unknown): Response {
  if (error instanceof ApiError) return json({ error: error.code, message: error.message }, error.status, error.retryAfterSeconds ? { 'Retry-After': String(error.retryAfterSeconds) } : {})
  console.error('Card API failure', error)
  return json({ error: 'SERVER_ERROR', message: '系統暫時無法送出，請稍後再試' }, 500)
}
