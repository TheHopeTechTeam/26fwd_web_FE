import { describe, expect, it } from 'vitest'
import { createTestDb, migrationNames, sqliteAvailable } from '../_test/d1'
import { ApiError } from './cards'
import { consumeRateLimit, consumeRateLimits, type RateRule } from './rate-limit'

const AT = (iso: string) => Date.parse(iso)
const NO_LIMIT = Number.MAX_SAFE_INTEGER

async function attempt(db: D1Database, key: string, rule: RateRule, now: number): Promise<'ok' | number> {
  try {
    await consumeRateLimit(db, key, rule, now)
    return 'ok'
  } catch (error) {
    if (error instanceof ApiError && error.code === 'RATE_LIMITED') return error.retryAfterSeconds ?? -1
    throw error
  }
}

describe.skipIf(!sqliteAvailable)('consumeRateLimit (real SQLite, real migrations)', () => {
  const perMinute: RateRule = { perMinute: 2, perHour: NO_LIMIT, minGapMs: 0 }
  const gap: RateRule = { perMinute: NO_LIMIT, perHour: 3, minGapMs: 60_000 }

  it('allows the per-minute quota, then refuses with the seconds left in that minute', async () => {
    const { db } = createTestDb()
    expect(await attempt(db, 'ip:aa', perMinute, AT('2026-11-13T12:00:10Z'))).toBe('ok')
    expect(await attempt(db, 'ip:aa', perMinute, AT('2026-11-13T12:00:20Z'))).toBe('ok')
    expect(await attempt(db, 'ip:aa', perMinute, AT('2026-11-13T12:00:30Z'))).toBe(30)
    expect(await attempt(db, 'ip:aa', perMinute, AT('2026-11-13T12:01:00Z'))).toBe('ok')
  })

  it('regression: measures 60 seconds from the last card, so a clock-minute boundary no longer lets a second card through', async () => {
    const { db } = createTestDb()
    expect(await attempt(db, 'tok:aa', gap, AT('2026-11-13T12:00:59Z'))).toBe('ok')
    expect(await attempt(db, 'tok:aa', gap, AT('2026-11-13T12:01:01Z'))).toBe(58)
  })

  it('a refused attempt neither uses up quota nor pushes the wait further out', async () => {
    const { db, query } = createTestDb()
    expect(await attempt(db, 'tok:aa', gap, AT('2026-11-13T12:00:00Z'))).toBe('ok')
    expect(await attempt(db, 'tok:aa', gap, AT('2026-11-13T12:00:30Z'))).toBe(30)
    expect(await attempt(db, 'tok:aa', gap, AT('2026-11-13T12:00:45Z'))).toBe(15)
    expect(await attempt(db, 'tok:aa', gap, AT('2026-11-13T12:01:00Z'))).toBe('ok')
    expect(query('SELECT hour_count FROM submission_rate_limits WHERE limiter_key = ?', 'tok:aa')).toEqual([{ hour_count: 2 }])
  })

  it('the hourly quota follows the clock hour and reports the wait until the next one', async () => {
    const { db } = createTestDb()
    for (const time of ['12:00:00', '12:01:00', '12:02:00']) expect(await attempt(db, 'tok:aa', gap, AT(`2026-11-13T${time}Z`))).toBe('ok')
    expect(await attempt(db, 'tok:aa', gap, AT('2026-11-13T12:03:00Z'))).toBe(57 * 60)
    expect(await attempt(db, 'tok:aa', gap, AT('2026-11-13T13:00:00Z'))).toBe('ok')
  })

  it('keeps every key separate', async () => {
    const { db } = createTestDb()
    expect(await attempt(db, 'tok:aa', gap, AT('2026-11-13T12:00:00Z'))).toBe('ok')
    expect(await attempt(db, 'tok:bb', gap, AT('2026-11-13T12:00:01Z'))).toBe('ok')
    expect(await attempt(db, 'tok:aa', gap, AT('2026-11-13T12:00:02Z'))).toBe(58)
  })

  it('opportunistically deletes rows untouched for more than 24 hours', async () => {
    const { db, query } = createTestDb()
    const now = 64 * 460_000 * 60_000 // a minute divisible by 64, which triggers cleanup for keys ending in "00"
    const hour = Math.floor(now / 3_600_000)
    query(`INSERT INTO submission_rate_limits VALUES ('ip:old', 0, 1, ?, 1, NULL), ('ip:recent', 0, 1, ?, 1, NULL)`, hour - 25, hour - 24)
    await consumeRateLimit(db, 'ip:00', perMinute, now)
    expect(query('SELECT limiter_key FROM submission_rate_limits ORDER BY limiter_key').map(row => row.limiter_key)).toEqual(['ip:00', 'ip:recent'])
  })
})

describe.skipIf(!sqliteAvailable)('consumeRateLimits: every layer or none', () => {
  const ipRule: RateRule = { perMinute: 400, perHour: NO_LIMIT, minGapMs: 0 }
  const tokenRule: RateRule = { perMinute: NO_LIMIT, perHour: 3, minGapMs: 60_000 }
  const counts = (query: (sql: string, ...params: unknown[]) => Record<string, unknown>[]) =>
    Object.fromEntries(query('SELECT limiter_key, minute_count FROM submission_rate_limits').map(row => [row.limiter_key, row.minute_count]))

  async function attemptBoth(db: D1Database, token: string, now: number): Promise<'ok' | number> {
    try {
      await consumeRateLimits(db, [['ip:shared', ipRule], [token, tokenRule]], now)
      return 'ok'
    } catch (error) {
      if (error instanceof ApiError && error.code === 'RATE_LIMITED') return error.retryAfterSeconds ?? -1
      throw error
    }
  }

  it('counts every layer when all of them allow the request', async () => {
    const { db, query } = createTestDb()
    expect(await attemptBoth(db, 'tok:a', AT('2026-11-13T12:00:10Z'))).toBe('ok')
    expect(counts(query)).toEqual({ 'ip:shared': 1, 'tok:a': 1 })
  })

  it('regression (#13 review): a card refused for its token does not use up the shared IP quota', async () => {
    const { db, query } = createTestDb()
    expect(await attemptBoth(db, 'tok:a', AT('2026-11-13T12:00:10Z'))).toBe('ok')
    for (const second of [15, 20, 25]) expect(await attemptBoth(db, 'tok:a', AT(`2026-11-13T12:00:${second}Z`))).toBeGreaterThan(0)
    expect(counts(query)).toEqual({ 'ip:shared': 1, 'tok:a': 1 })
  })

  it('a card refused by the IP layer does not use up its token quota either', async () => {
    const { db, query } = createTestDb()
    query(`INSERT INTO submission_rate_limits VALUES ('ip:shared', ?, 400, 0, 0, NULL)`, Math.floor(AT('2026-11-13T12:00:10Z') / 60_000))
    expect(await attemptBoth(db, 'tok:a', AT('2026-11-13T12:00:10Z'))).toBe(50)
    expect(counts(query)).toEqual({ 'ip:shared': 400 })
  })

  it('when several layers refuse, reports the longest wait', async () => {
    const { db, query } = createTestDb()
    expect(await attemptBoth(db, 'tok:a', AT('2026-11-13T12:00:10Z'))).toBe('ok')
    query(`UPDATE submission_rate_limits SET minute_count = 400 WHERE limiter_key = 'ip:shared'`)
    // IP: free again at 12:01:00 (40 s); token: 60 s after 12:00:10, at 12:01:10 (50 s).
    expect(await attemptBoth(db, 'tok:a', AT('2026-11-13T12:00:20Z'))).toBe(50)
  })
})

// On Cloudflare, concurrent requests can reach D1 in a different order from the `now` they read
// (staging load test 10/21: 13 of 300 first cards were refused with "wait 1 second").
describe.skipIf(!sqliteAvailable)('requests that reach the database out of order', () => {
  const ipRule: RateRule = { perMinute: 400, perHour: 2000, minGapMs: 0 }
  const tokenRule: RateRule = { perMinute: NO_LIMIT, perHour: 3, minGapMs: 60_000 }
  const later = AT('2026-11-13T12:00:10.900Z'), earlier = AT('2026-11-13T12:00:10.400Z')

  it('regression (load test 10/21): a rule without a gap counts a request whose time is earlier than the last one', async () => {
    const { db, query } = createTestDb()
    expect(await attempt(db, 'ip:shared', ipRule, later)).toBe('ok')
    expect(await attempt(db, 'ip:shared', ipRule, earlier)).toBe('ok')
    expect(query('SELECT minute_count, last_submit_ms FROM submission_rate_limits')).toEqual([{ minute_count: 2, last_submit_ms: later }])
  })

  it('regression (load test 10/21): the all-layers check does not refuse it either', async () => {
    const { db } = createTestDb()
    await consumeRateLimits(db, [['ip:shared', ipRule], ['tok:a', tokenRule]], later)
    await expect(consumeRateLimits(db, [['ip:shared', ipRule], ['tok:b', tokenRule]], earlier)).resolves.toBeUndefined()
  })

  // Many random interleavings, reproducible (fixed seed): 30 browsers on one IP send 60 cards
  // within two minutes, each request's time jittered and its arrival delayed by up to 1.5 s, as
  // when Turnstile latency varies. Two things must always hold.
  it('random out-of-order arrivals: a first card is never refused, and one token never gets two cards within 60 seconds', async () => {
    let seed = 20261021
    const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 2 ** 32 }
    for (let round = 0; round < 25; round++) {
      const { db } = createTestDb()
      const start = AT('2026-11-13T12:00:00Z')
      const arrivals = Array.from({ length: 60 }, () => ({ token: `tok:${Math.floor(random() * 30)}`, now: start + Math.floor(random() * 120_000) }))
        .map((request) => ({ ...request, arrives: request.now + random() * 1500 }))
        .sort((a, b) => a.arrives - b.arrives)
      const stored = new Map<string, number[]>()
      for (const { token, now } of arrivals) {
        try {
          await consumeRateLimits(db, [['ip:shared', ipRule], [token, tokenRule]], now)
          stored.set(token, [...(stored.get(token) ?? []), now])
        } catch (error) {
          if (!(error instanceof ApiError) || error.code !== 'RATE_LIMITED') throw error
          expect(stored.has(token), `round ${round}: first card of ${token} refused`).toBe(true)
          expect(error.retryAfterSeconds).toBeGreaterThanOrEqual(1)
        }
      }
      for (const times of stored.values()) {
        const sorted = [...times].sort((a, b) => a - b)
        for (let i = 1; i < sorted.length; i++) expect(sorted[i]! - sorted[i - 1]!).toBeGreaterThanOrEqual(60_000)
      }
    }
  })

  it('the 60-second rule still refuses a second card from the same token, whatever order they arrive in', async () => {
    const { db, query } = createTestDb()
    expect(await attempt(db, 'tok:a', tokenRule, later)).toBe('ok')
    expect(await attempt(db, 'tok:a', tokenRule, earlier)).toBe(61)
    expect(query('SELECT hour_count, last_submit_ms FROM submission_rate_limits')).toEqual([{ hour_count: 1, last_submit_ms: later }])
  })
})

describe.skipIf(!sqliteAvailable)('migration 0002', () => {
  it('renames the key column and keeps the rows written under 0001', () => {
    const [first, second] = migrationNames()
    expect([first, second]).toEqual(['0001_initial.sql', '0002_client_token_rate_limits.sql'])
    const { query, migrate } = createTestDb(['0001_initial.sql'])
    query(`INSERT INTO submission_rate_limits (ip_hash, minute_bucket, minute_count, hour_bucket, hour_count) VALUES ('abc', 1, 1, 1, 1)`)

    migrate('0002_client_token_rate_limits.sql')

    expect(query('SELECT * FROM submission_rate_limits')).toEqual([
      { limiter_key: 'abc', minute_bucket: 1, minute_count: 1, hour_bucket: 1, hour_count: 1, last_submit_ms: null },
    ])
  })
})
