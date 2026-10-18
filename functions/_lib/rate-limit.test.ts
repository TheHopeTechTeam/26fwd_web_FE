import { describe, expect, it } from 'vitest'
import { createTestDb, migrationNames, sqliteAvailable } from '../_test/d1'
import { ApiError } from './cards'
import { consumeRateLimit, type RateRule } from './rate-limit'

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
