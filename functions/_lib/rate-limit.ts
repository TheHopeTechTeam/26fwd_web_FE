import { ApiError } from './cards'

export type RateRule = { perMinute: number; perHour: number; minGapMs: number }

const NO_LIMIT = Number.MAX_SAFE_INTEGER

// Staging candidates agreed in #5; confirm them after the 300-user load test.
export const RATE_RULES = {
  // One browser: the next card at least 60 seconds after its last one, and three per clock hour.
  token: { perMinute: NO_LIMIT, perHour: 3, minGapMs: 60_000 },
  // One public IP, which a whole venue wifi or mobile carrier NAT can share.
  ipSubmit: { perMinute: 400, perHour: 2000, minGapMs: 0 },
  ipTokenIssue: { perMinute: 600, perHour: NO_LIMIT, minGapMs: 0 },
} satisfies Record<string, RateRule>

export function requireSalt(salt?: string): string {
  if (!salt) throw new ApiError(503, 'SERVICE_UNAVAILABLE', 'Rate limit salt is not configured')
  return salt
}

export function clientIp(request: Request): string {
  const ip = request.headers.get('CF-Connecting-IP')
  if (!ip) throw new ApiError(400, 'VALIDATION_ERROR', 'Client IP is unavailable')
  return ip
}

// The salt keeps the digest from being reversed by hashing every possible IPv4 address.
export async function saltedHash(salt: string, value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${value}`))
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

type LimiterRow = { minute_bucket: number; minute_count: number; hour_bucket: number; hour_count: number; last_submit_ms: number | null }

// Counts one request for `key`, or throws 429 without counting it. A single conditional UPSERT
// both checks and counts, so concurrent requests cannot all slip under a limit, and a refused
// retry neither uses up quota nor pushes the wait further out.
export async function consumeRateLimit(db: D1Database, key: string, rule: RateRule, now: number): Promise<void> {
  const minute = Math.floor(now / 60_000), hour = Math.floor(now / 3_600_000)
  if (Number.parseInt(key.slice(-2), 16) % 64 === minute % 64)
    await db.prepare('DELETE FROM submission_rate_limits WHERE hour_bucket < ?').bind(hour - 24).run()
  const counted = await db.prepare(`INSERT INTO submission_rate_limits
      (limiter_key, minute_bucket, minute_count, hour_bucket, hour_count, last_submit_ms)
    VALUES (?, ?, 1, ?, 1, ?)
    ON CONFLICT (limiter_key) DO UPDATE SET
      minute_count = CASE WHEN minute_bucket = excluded.minute_bucket THEN minute_count + 1 ELSE 1 END,
      minute_bucket = excluded.minute_bucket,
      hour_count = CASE WHEN hour_bucket = excluded.hour_bucket THEN hour_count + 1 ELSE 1 END,
      hour_bucket = excluded.hour_bucket,
      last_submit_ms = excluded.last_submit_ms
    WHERE (minute_bucket <> excluded.minute_bucket OR minute_count < ?)
      AND (hour_bucket <> excluded.hour_bucket OR hour_count < ?)
      AND (last_submit_ms IS NULL OR last_submit_ms <= excluded.last_submit_ms - ?)
    RETURNING limiter_key`).bind(key, minute, hour, now, rule.perMinute, rule.perHour, rule.minGapMs).first()
  if (counted) return
  const row = await db.prepare(`SELECT minute_bucket, minute_count, hour_bucket, hour_count, last_submit_ms
    FROM submission_rate_limits WHERE limiter_key = ?`).bind(key).first<LimiterRow>()
  throw new ApiError(429, 'RATE_LIMITED', 'Too many requests', { retryAfterSeconds: secondsUntilAllowed(row, rule, now) })
}

function secondsUntilAllowed(row: LimiterRow | null, rule: RateRule, now: number): number {
  const minute = Math.floor(now / 60_000), hour = Math.floor(now / 3_600_000)
  let waitMs = 0
  if (row) {
    if (row.minute_bucket === minute && row.minute_count >= rule.perMinute) waitMs = Math.max(waitMs, (minute + 1) * 60_000 - now)
    if (row.hour_bucket === hour && row.hour_count >= rule.perHour) waitMs = Math.max(waitMs, (hour + 1) * 3_600_000 - now)
    if (row.last_submit_ms !== null) waitMs = Math.max(waitMs, row.last_submit_ms + rule.minGapMs - now)
  }
  return Math.max(1, Math.ceil(waitMs / 1000))
}
