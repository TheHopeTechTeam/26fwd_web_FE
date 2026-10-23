// What a load-test run proved, and the SQL to check and clean up exactly that run (#28 review).
//
// The server handles each request at some moment between our send and our receive, on its own
// clock. Every condition here counts as met only if it holds wherever that moment fell, so a run
// that cannot be shown to meet a check's condition marks that check invalid, to be run again.

export const RESEND_WITHIN_MS = 60_000

// How far the server's clock may be from ours ({ low, high } in ms, server minus ours). Each
// response's Date header names the whole second in which the server answered, and it answered
// between our send and our receive. Null when no response had a usable Date header.
export function clockOffset(samples) {
  let low = -Infinity, high = Infinity
  for (const { serverDate, sentAt, receivedAt } of samples) {
    if (serverDate === undefined) continue
    low = Math.max(low, serverDate - receivedAt)
    high = Math.min(high, serverDate + 1000 - sentAt)
  }
  return Number.isFinite(low) && Number.isFinite(high) && low <= high ? { low, high } : null
}

// The earliest and latest server time at which any of these requests can have been handled, and
// whether that whole span lies in one clock minute, so in one per-IP minute bucket.
export function serverWindow(samples, offset) {
  if (!offset || samples.length === 0) return null
  const earliest = Math.min(...samples.map(s => s.sentAt)) + offset.low
  const latest = Math.max(...samples.map(s => s.receivedAt)) + offset.high
  return { earliest, latest, oneMinute: Math.floor(earliest / 60_000) === Math.floor(latest / 60_000) }
}

// The longest time any browser's resend can have reached the server after its first card did.
// Both moments are on the server's clock, so the clock offset cancels out.
export function longestResendGap(firstCards, resends) {
  const firstSent = new Map(firstCards.map(s => [s.browser, s.sentAt]))
  return Math.max(0, ...resends.map(s => s.receivedAt - (firstSent.get(s.browser) ?? -Infinity)))
}

const iso = (ms) => new Date(ms).toISOString()

// Every check passes, fails, or is invalid when the run did not meet the condition it relies on:
// C shows that B's refused resends left the shared IP quota alone only if A–C share one per-IP
// minute bucket, and B tests the per-token 60-second gap only if every resend came within 60 s.
export function evaluateRun({ samples, users, newcomers, local }) {
  const of = (phase, kind) => samples.filter(s => s.phase === phase && (!kind || s.kind === kind))
  // `count` browsers, each with exactly one response of this kind, all passing `test`.
  const all = (list, count, test) => list.length === count && list.every(test)
  const cardsA = of('A', 'card'), cardsB = of('B', 'card'), cardsC = of('C', 'card')
  const offset = local ? { low: 0, high: 0 } : clockOffset(samples.filter(s => s.phase !== 'preflight'))
  const window = serverWindow([...cardsA, ...cardsB, ...cardsC], offset)
  const resendGapMs = longestResendGap(cardsA, cardsB)
  const windowProblem = !window
    ? 'the server sent no usable Date header, so A–C cannot be placed in one clock minute'
    : window.oneMinute ? null : `A–C may span two clock minutes on the server (${iso(window.earliest)} → ${iso(window.latest)})`
  const resendProblem = resendGapMs < RESEND_WITHIN_MS ? null : `a resend may have reached the server ${(resendGapMs / 1000).toFixed(1)} s after that browser's first card`
  const check = (label, passed, problem = null) => (problem ? { label, result: 'invalid', why: problem } : { label, result: passed ? 'pass' : 'fail' })
  return {
    checks: [
      check(`A: all ${users} got a new token (204 with a cookie)`, all(of('A', 'token-new'), users, s => s.status === 204 && !!s.cookie)),
      check(`A: all ${users} cards stored (201)`, all(cardsA, users, s => s.status === 201)),
      check(`B: all ${users} kept their token (204, no new cookie)`, all(of('B', 'token-kept'), users, s => s.status === 204 && !s.cookie)),
      check(`B: all ${users} resends refused (429 RATE_LIMITED with a retry time)`, all(cardsB, users, s => s.status === 429 && s.code === 'RATE_LIMITED' && s.retry > 0), resendProblem),
      check(`C: all ${newcomers} newcomers stored (201)`, all(cardsC, newcomers, s => s.status === 201), windowProblem),
      check('every response marked X-FWD-Load-Test: on', samples.every(s => s.marked)),
      check('no network errors or 5xx', samples.every(s => s.status > 0 && s.status < 500)),
    ],
    offset,
    window,
    resendGapMs,
    // Every 201 is a stored card, whichever phase it came from (on 10/21 13 first cards refused in A
    // were stored in B), and every 429 is a refusal the IP row must not count.
    stored: samples.filter(s => s.kind === 'card' && s.status === 201).length,
    refused: samples.filter(s => s.kind === 'card' && s.status === 429).length,
    // The IP row's minute count equals the stored cards only when they all fell in one minute.
    ipRowComparable: windowProblem === null,
  }
}

// SQL to check this run in D1 right after it, and to clean it up once Ian approves. Everything is
// pinned to this run: its id in the nickname, and the server-time span its requests can fall in
// (`span`; without a server window, the caller passes a wider one from our own clock). Without the
// staging salt the IP row's key cannot be computed, so it is found by this run's minute bucket and
// last-request time instead; a local dry run that knows its salt passes the exact key.
export function d1Statements({ run, span, window, ipKey }) {
  if (!/^[0-9a-f]{4}$/.test(run)) throw new Error(`unexpected run id ${run}`)
  const nickname = `nickname LIKE '壓測-${run}-%'`
  const thisRun = `${nickname} AND created_at BETWEEN '${iso(span.earliest)}' AND '${iso(span.latest)}'`
  const ipRow = 'SELECT substr(limiter_key, 1, 11) AS key_start, minute_bucket, minute_count, hour_count, last_submit_ms FROM submission_rate_limits'
  return {
    cards: `SELECT COUNT(*) AS cards, COUNT(DISTINCT nickname) AS distinct_nicknames, SUM(status = 'pending') AS pending, MIN(created_at) AS first_created, MAX(created_at) AS last_created FROM forward_cards WHERE ${nickname}`,
    ipRow: ipKey
      ? `${ipRow} WHERE limiter_key = '${ipKey}'`
      : window && `${ipRow} WHERE limiter_key LIKE 'ip:%' AND minute_bucket = ${Math.floor(window.earliest / 60_000)} AND last_submit_ms BETWEEN ${Math.floor(window.earliest)} AND ${Math.ceil(window.latest)}`,
    cleanupPreview: `SELECT COUNT(*) AS to_delete FROM forward_cards WHERE ${thisRun} AND status = 'pending'`,
    cleanup: `DELETE FROM forward_cards WHERE ${thisRun} AND status = 'pending'`,
  }
}
