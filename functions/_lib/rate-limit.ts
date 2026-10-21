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
// Requests can reach D1 in a different order from the `now` they read (the 10/21 staging load
// test refused 13 of 300 that way), so the gap is only compared when the rule has one, and
// last_submit_ms only ever moves forward.
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
      last_submit_ms = MAX(COALESCE(last_submit_ms, 0), excluded.last_submit_ms)
    WHERE (minute_bucket <> excluded.minute_bucket OR minute_count < ?)
      AND (hour_bucket <> excluded.hour_bucket OR hour_count < ?)
      AND (? = 0 OR last_submit_ms IS NULL OR last_submit_ms <= excluded.last_submit_ms - ?)
    RETURNING limiter_key`).bind(key, minute, hour, now, rule.perMinute, rule.perHour, rule.minGapMs, rule.minGapMs).first()
  if (counted) return
  throw tooManyRequests(waitMs(await readLimiterRow(db, key), rule, now))
}

// Counts one request against every layer, or against none. All layers are checked before any is
// counted, so a card refused by its token does not use up the shared IP quota (#13 review). Two
// simultaneous requests can both pass the check; the counting above stays atomic per layer, so
// the limits still hold, and at worst a request refused by a later layer is counted by an
// earlier one.
export async function consumeRateLimits(db: D1Database, layers: Array<[key: string, rule: RateRule]>, now: number): Promise<void> {
  let longestWait = 0
  for (const [key, rule] of layers) longestWait = Math.max(longestWait, waitMs(await readLimiterRow(db, key), rule, now))
  if (longestWait > 0) throw tooManyRequests(longestWait)
  for (const [key, rule] of layers) await consumeRateLimit(db, key, rule, now)
}

function readLimiterRow(db: D1Database, key: string): Promise<LimiterRow | null> {
  return db.prepare(`SELECT minute_bucket, minute_count, hour_bucket, hour_count, last_submit_ms
    FROM submission_rate_limits WHERE limiter_key = ?`).bind(key).first<LimiterRow>()
}

// How long until `rule` lets the next request through for this row; 0 or less means now. Mirrors
// the WHERE clause of the UPSERT in consumeRateLimit.
function waitMs(row: LimiterRow | null, rule: RateRule, now: number): number {
  if (!row) return 0
  const minute = Math.floor(now / 60_000), hour = Math.floor(now / 3_600_000)
  let wait = 0
  if (row.minute_bucket === minute && row.minute_count >= rule.perMinute) wait = Math.max(wait, (minute + 1) * 60_000 - now)
  if (row.hour_bucket === hour && row.hour_count >= rule.perHour) wait = Math.max(wait, (hour + 1) * 3_600_000 - now)
  if (rule.minGapMs > 0 && row.last_submit_ms !== null) wait = Math.max(wait, row.last_submit_ms + rule.minGapMs - now)
  return wait
}

const tooManyRequests = (wait: number) =>
  new ApiError(429, 'RATE_LIMITED', 'Too many requests', { retryAfterSeconds: Math.max(1, Math.ceil(wait / 1000)) })
