import { describe, expect, it } from 'vitest'
import { clockOffset, d1Statements, evaluateRun, longestResendGap } from './checks.mjs'

const AT = (iso) => Date.parse(iso)

// One response: sent at `sentAt` on our clock, answered `lag` ms later on a server clock `offset` ms
// ahead of ours, received `rtt` ms after sending. `dated: false` drops the Date header.
function sample(phase, kind, browser, sentAt, fields, { offset = 0, lag = 60, rtt = 120, dated = true } = {}) {
  const answeredAt = sentAt + lag + offset
  return { phase, kind, browser, sentAt, receivedAt: sentAt + rtt, marked: true, ...(dated && { serverDate: Math.floor(answeredAt / 1000) * 1000 }), ...fields }
}

// Two browsers in A and B and one newcomer in C, every request behaving as it should.
function simulatedRun({ start = AT('2026-10-23T13:30:02Z'), resendAfter = 10_000, newcomersAfter = 15_000, clock } = {}) {
  const samples = []
  for (const n of [1, 2]) {
    const a = start + n * 300, b = start + resendAfter + n * 300
    samples.push(sample('A', 'token-new', n, a, { status: 204, cookie: `__Host-fwd_ct=${n}` }, clock))
    samples.push(sample('A', 'card', n, a + 150, { status: 201 }, clock))
    samples.push(sample('B', 'token-kept', n, b, { status: 204 }, clock))
    samples.push(sample('B', 'card', n, b + 150, { status: 429, code: 'RATE_LIMITED', retry: 50 }, clock))
  }
  const c = start + newcomersAfter
  samples.push(sample('C', 'token-new', 3, c, { status: 204, cookie: '__Host-fwd_ct=3' }, clock))
  samples.push(sample('C', 'card', 3, c + 150, { status: 201 }, clock))
  return samples
}

const evaluate = (samples, local = false) => evaluateRun({ samples, users: 2, newcomers: 1, local })
// Results in check order: A tokens, A cards, B tokens, B refused, C stored, marked, no errors.
const outcomes = (run) => run.checks.map(check => check.result)

describe('evaluateRun', () => {
  it('a run inside one clock minute, every resend within 60 s: every check passes', () => {
    const run = evaluate(simulatedRun())
    expect(outcomes(run)).toEqual(['pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass'])
    expect(run.window.oneMinute).toBe(true)
    expect(run.ipRowComparable).toBe(true)
    expect(run.stored).toBe(3)
    expect(run.refused).toBe(2)
  })

  it('regression (#28 review): a run that crosses a clock minute marks C invalid instead of passing it', () => {
    const run = evaluate(simulatedRun({ start: AT('2026-10-23T13:30:50Z') }))
    expect(outcomes(run)).toEqual(['pass', 'pass', 'pass', 'pass', 'invalid', 'pass', 'pass'])
    expect(run.checks[4].why).toContain('two clock minutes')
    expect(run.ipRowComparable).toBe(false)
  })

  it('regression (#28 review): a resend more than 60 s after its first card marks B invalid', () => {
    const run = evaluate(simulatedRun({ start: AT('2026-10-23T13:30:00.500Z'), resendAfter: 61_000, newcomersAfter: 62_000 }))
    expect(run.checks[3]).toMatchObject({ result: 'invalid', why: expect.stringContaining("after that browser's first card") })
    expect(run.resendGapMs).toBeGreaterThan(60_000)
  })

  it('a resend just inside 60 s still counts', () => {
    // Gap = resend received minus first card sent = 59,000 + 120 ms.
    const run = evaluate(simulatedRun({ start: AT('2026-10-23T13:30:00.500Z'), resendAfter: 59_000, newcomersAfter: 59_100 }))
    expect(run.checks[3].result).toBe('pass')
    expect(run.resendGapMs).toBe(59_120)
  })

  it('places the run on the server clock: a server 20 s ahead puts 13:30:30–45 on our clock across its next minute', () => {
    const run = evaluate(simulatedRun({ start: AT('2026-10-23T13:30:30Z'), clock: { offset: 20_000 } }))
    expect(run.offset.low).toBeLessThanOrEqual(20_000)
    expect(run.offset.high).toBeGreaterThanOrEqual(20_000)
    expect(run.checks[4].result).toBe('invalid')
  })

  it('a staging run without Date headers cannot be placed in one minute, so C is invalid; a local run uses this machine\'s clock', () => {
    const undated = simulatedRun({ clock: { dated: false } })
    expect(evaluate(undated).checks[4]).toMatchObject({ result: 'invalid', why: expect.stringContaining('no usable Date header') })
    expect(outcomes(evaluate(undated, true))).toEqual(['pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass'])
  })

  it('failures still fail when their condition holds', () => {
    const samples = simulatedRun()
    samples.find(s => s.phase === 'C' && s.kind === 'card').status = 429
    expect(evaluate(samples).checks[4].result).toBe('fail')
  })
})

describe('clockOffset and longestResendGap', () => {
  it('bounds the server clock within a second from the Date headers', () => {
    const offset = clockOffset(simulatedRun({ clock: { offset: 800 } }))
    expect(offset.low).toBeLessThanOrEqual(800)
    expect(offset.high).toBeGreaterThanOrEqual(800)
    expect(offset.high - offset.low).toBeLessThan(1000)
    expect(clockOffset(simulatedRun({ clock: { dated: false } }))).toBeNull()
  })

  it('a resend from a browser with no first card cannot be shown to be within 60 s', () => {
    expect(longestResendGap([], [{ browser: 1, receivedAt: 1 }])).toBe(Infinity)
  })
})

describe('d1Statements', () => {
  const span = { earliest: AT('2026-10-21T13:28:02.000Z'), latest: AT('2026-10-21T13:28:33.500Z') }
  const window = { ...span, oneMinute: true }

  it('regression (#28 review): cleanup is pinned to one run id and its server time span, never to every 壓測 card', () => {
    const { cleanup, cleanupPreview } = d1Statements({ run: '30d3', span, window })
    const thisRun = "nickname LIKE '壓測-30d3-%' AND created_at BETWEEN '2026-10-21T13:28:02.000Z' AND '2026-10-21T13:28:33.500Z' AND status = 'pending'"
    expect(cleanup).toBe(`DELETE FROM forward_cards WHERE ${thisRun}`)
    expect(cleanupPreview).toBe(`SELECT COUNT(*) AS to_delete FROM forward_cards WHERE ${thisRun}`)
    expect(cleanup).not.toContain("'壓測-%'")
  })

  it('regression (#28 review): finds the IP row by this run\'s minute bucket and last request time, not the latest updated row', () => {
    const { ipRow } = d1Statements({ run: '30d3', span, window })
    expect(ipRow).toContain(`minute_bucket = ${Math.floor(span.earliest / 60_000)}`)
    expect(ipRow).toContain(`last_submit_ms BETWEEN ${span.earliest} AND ${span.latest}`)
    expect(ipRow).not.toMatch(/ORDER BY|LIMIT/)
  })

  it('uses the exact key when a local dry run knows its salt, and has no IP row without a server window', () => {
    expect(d1Statements({ run: '30d3', span, window, ipKey: 'ip:abc' }).ipRow).toMatch(/WHERE limiter_key = 'ip:abc'$/)
    expect(d1Statements({ run: '30d3', span, window: null }).ipRow).toBeNull()
  })

  it('refuses anything but a four-character hex run id', () => {
    expect(() => d1Statements({ run: "x' OR '1'='1", span, window })).toThrow('unexpected run id')
  })
})
