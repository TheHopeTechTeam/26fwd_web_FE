// Staging load test for the Client Token rollout (#5, #15): many people behind one public IP.
// It behaves like the browser client: every card first asks /api/client-token, keeps its own
// cookie, then posts the card with the official Turnstile dummy token.
//
//   A  burst       --users browsers arrive over --ramp seconds, each sends one card     → all 201
//   B  resend      every one of them sends again within 60 seconds with the same cookie → all 429
//   C  newcomers   --newcomers more browsers each send one card                         → all 201
//
// C shows that the refused resends in B did not use up the shared IP quota (#13 review), which
// holds only if A–C share one per-IP minute bucket; B tests the per-token 60-second gap only if
// every resend comes within 60 s. The run starts just after a clock minute, then checks both
// conditions from its own timings and the server's Date headers; a check whose condition is not
// met is reported invalid, to be run again (checks.mjs, #28 review).
//
// It refuses to run unless the first response carries X-FWD-Load-Test: on, which the backend
// only sends while LOAD_TEST_MODE is on for 26fwd-staging.pages.dev (docs/DEPLOYMENT.md).
//
//   node scripts/load-test/run.mjs                      # staging, 300 + 50 browsers
//   node scripts/load-test/run.mjs --users 30 --newcomers 5 --no-align
//   node scripts/load-test/run.mjs --base http://127.0.0.1:8799 --host-header 26fwd-staging.pages.dev --client-ip 203.0.113.50
import http from 'node:http'
import https from 'node:https'
import { createHash, randomBytes } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { clockOffset, d1Statements, evaluateRun, RESEND_WITHIN_MS } from './checks.mjs'

const STAGING = 'https://26fwd-staging.pages.dev'
const STAGING_DATABASE = 'forward_cards_staging'
const DUMMY_TURNSTILE_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX'
const IP_CARDS_PER_MINUTE = 400
// A–C take about --ramp + 15 seconds, and must fit in one clock minute after the 2-second start.
const MAX_RAMP_SECONDS = 40

const { values: args } = parseArgs({
  options: {
    base: { type: 'string', default: STAGING },
    users: { type: 'string', default: '300' },
    newcomers: { type: 'string', default: '50' },
    ramp: { type: 'string', default: '20' },
    'no-align': { type: 'boolean', default: false },
    // Local dry run against `wrangler pages dev` only: what Cloudflare itself would supply, the
    // local D1 database name, and the local RATE_LIMIT_SALT to find the IP row by its exact key.
    'host-header': { type: 'string' },
    'client-ip': { type: 'string' },
    database: { type: 'string' },
    salt: { type: 'string' },
  },
})

const base = new URL(args.base)
const local = ['127.0.0.1', 'localhost'].includes(base.hostname)
const users = Number(args.users), newcomers = Number(args.newcomers), rampMs = Number(args.ramp) * 1000
if (base.origin !== STAGING && !local) fail(`refusing to run against ${base.origin}: only ${STAGING} or a local wrangler dev server`)
if ((args['host-header'] || args['client-ip'] || args.database || args.salt) && !local) fail('--host-header, --client-ip, --database and --salt are for local dry runs only')
if (args.salt && !args['client-ip']) fail('--salt needs --client-ip to compute the IP row key')
if (!(Number.isInteger(users) && users > 0 && Number.isInteger(newcomers) && newcomers >= 0 && rampMs >= 0)) {
  fail('--users and --newcomers must be whole numbers (users at least 1), --ramp a number of seconds')
}
if (users + newcomers > IP_CARDS_PER_MINUTE) fail(`--users + --newcomers must stay within the per-IP limit of ${IP_CARDS_PER_MINUTE} cards a minute`)
if (rampMs > MAX_RAMP_SECONDS * 1000) fail(`--ramp must be at most ${MAX_RAMP_SECONDS} s so that A–C fit in one clock minute`)

// One random id per run, in every nickname, to count and clean up exactly this run's cards.
const run = randomBytes(3).toString('hex').slice(0, 4)
const agent = new (base.protocol === 'https:' ? https : http).Agent({ keepAlive: true })
const samples = []

function fail(message) {
  console.error(`✗ ${message}`)
  process.exit(1)
}

function send(path, { phase, kind, browser, cookie, body }) {
  const headers = { Accept: 'application/json' }
  if (args['host-header']) headers.Host = args['host-header']
  if (args['client-ip']) headers['CF-Connecting-IP'] = args['client-ip']
  if (cookie) headers.Cookie = cookie
  const payload = body === undefined ? undefined : Buffer.from(JSON.stringify(body))
  if (payload) Object.assign(headers, { 'Content-Type': 'application/json', 'Content-Length': payload.length })
  const started = performance.now(), sentAt = Date.now()
  return new Promise(resolve => {
    const finish = (result) => {
      const sample = { phase, kind, browser, ms: Math.round(performance.now() - started), sentAt, receivedAt: Date.now(), ...result }
      samples.push(sample)
      resolve(sample)
    }
    const request = (base.protocol === 'https:' ? https : http).request(new URL(path, base), { method: 'POST', headers, agent, timeout: 30_000 }, response => {
      const chunks = []
      response.on('data', chunk => chunks.push(chunk))
      response.on('end', () => {
        let error
        try { error = JSON.parse(Buffer.concat(chunks).toString() || '{}').error } catch { error = undefined }
        const setCookie = (response.headers['set-cookie'] ?? []).find(value => value.startsWith('__Host-fwd_ct='))
        const serverDate = Date.parse(response.headers.date ?? '')
        finish({
          status: response.statusCode,
          code: error?.code,
          retry: error?.retry_after_seconds,
          marked: response.headers['x-fwd-load-test'] === 'on',
          cookie: setCookie?.split(';')[0],
          serverDate: Number.isNaN(serverDate) ? undefined : serverDate,
        })
      })
    })
    request.on('timeout', () => request.destroy(new Error('timeout after 30 s')))
    request.on('error', error => finish({ status: 0, code: error.message, marked: false }))
    request.end(payload)
  })
}

const card = (n) => ({
  nickname: `壓測-${run}-${String(n).padStart(3, '0')}`,
  text_gratitude: `壓測 ${run}：第 ${n} 張合成卡，感謝神。`,
  text_anticipate: '期待系統在聚會現場也穩定。',
  agreed_to_publish: true,
  honeypot: '',
  turnstile_token: DUMMY_TURNSTILE_TOKEN,
})

// One browser sending one card the way src/api/client.ts does: token first, then the card.
async function sendCard(browser, phase) {
  const token = await send('/api/client-token', { phase, kind: browser.cookie ? 'token-kept' : 'token-new', browser: browser.n, cookie: browser.cookie })
  if (token.cookie) browser.cookie = token.cookie
  if (token.status !== 204) return token
  return send('/api/cards', { phase, kind: 'card', browser: browser.n, cookie: browser.cookie, body: card(browser.n) })
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function wave(browsers, phase, spreadMs) {
  const startedAt = performance.now()
  await Promise.all(browsers.map(async (browser, i) => {
    await sleep(browsers.length > 1 ? (spreadMs * i) / (browsers.length - 1) : 0)
    await sendCard(browser, phase)
  }))
  return Math.round(performance.now() - startedAt)
}

function percentile(values, p) {
  if (values.length === 0) return '-'
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)]
}

function tally(list) {
  const counts = {}
  for (const s of list) {
    const key = s.status === 0 ? `network: ${s.code}` : `${s.status}${s.code ? ` ${s.code}` : ''}`
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}

// --- preflight: never run unless the staging load-test mode is really on ---
const preflight = await send('/api/client-token', { phase: 'preflight', kind: 'token-new' })
if (!preflight.marked) {
  fail(`no "X-FWD-Load-Test: on" header from ${base.origin} (status ${preflight.status}). Turn LOAD_TEST_MODE on for 26fwd-staging and redeploy first.`)
}
console.log(`✓ load-test mode is on at ${base.origin}; run id ${run}`)

// Start just after a clock minute on the server's clock, so that A–C share one per-IP minute bucket.
const preflightOffset = local ? { low: 0, high: 0 } : clockOffset([preflight])
const serverNow = () => Date.now() + (preflightOffset ? (preflightOffset.low + preflightOffset.high) / 2 : 0)
const intoMinute = serverNow() % 60_000
if (!args['no-align'] && intoMinute > 3_000) {
  const wait = 60_000 - intoMinute + 2_000
  console.log(`… waiting ${Math.round(wait / 1000)} s to start just after a clock minute`)
  await sleep(wait)
}

const burst = Array.from({ length: users }, (_, i) => ({ n: i + 1, cookie: undefined }))
const late = Array.from({ length: newcomers }, (_, i) => ({ n: users + i + 1, cookie: undefined }))
const startedAt = new Date()
console.log(`A  burst: ${users} browsers over ${args.ramp} s …`)
const msA = await wave(burst, 'A', rampMs)
console.log(`B  resend: the same ${users} browsers again …`)
const msB = await wave(burst, 'B', 5_000)
console.log(`C  newcomers: ${newcomers} more browsers …`)
const msC = await wave(late, 'C', 5_000)
const finishedAt = new Date()

// --- report ---
const of = (phase) => samples.filter(s => s.phase === phase)
const result = evaluateRun({ samples, users, newcomers, local })
const { checks, offset, window, resendGapMs, stored, refused } = result

const timed = samples.filter(s => s.phase !== 'preflight')
const latency = [
  ['token, new', timed.filter(s => s.kind === 'token-new')],
  ['token, kept', timed.filter(s => s.kind === 'token-kept')],
  ['card stored (201)', timed.filter(s => s.kind === 'card' && s.status === 201)],
  ['card refused (429)', timed.filter(s => s.kind === 'card' && s.status === 429)],
].map(([label, list]) => ({ request: label, count: list.length, p50_ms: percentile(list.map(s => s.ms), 50), p95_ms: percentile(list.map(s => s.ms), 95), max_ms: list.length ? Math.max(...list.map(s => s.ms)) : '-' }))

const seconds = (ms) => `${ms >= 0 ? '+' : ''}${(ms / 1000).toFixed(3)} s`
console.log(`\nrun ${run} · ${startedAt.toISOString()} → ${finishedAt.toISOString()} · phases ${msA} / ${msB} / ${msC} ms`)
console.log('\nresponses:')
console.table({ 'A burst': tally(of('A')), 'B resend': tally(of('B')), 'C newcomers': tally(of('C')) })
console.log('latency (measured from this machine, network included):')
console.table(latency)
console.log('conditions:')
console.log(`  server clock minus this machine: ${offset ? `${seconds(offset.low)} … ${seconds(offset.high)}` : 'unknown (no Date header)'}`)
console.log(`  A–C on the server: ${window ? `${new Date(window.earliest).toISOString()} → ${new Date(window.latest).toISOString()}, ${window.oneMinute ? 'one clock minute ✓' : 'two clock minutes ✗'}` : 'cannot be placed ✗'}`)
console.log(`  resends: at most ${(resendGapMs / 1000).toFixed(1)} s after each browser's first card ${resendGapMs < RESEND_WITHIN_MS ? '(within 60 s ✓)' : '(not within 60 s ✗)'}`)
console.log('checks:')
for (const { label, result: outcome, why } of checks) {
  console.log(outcome === 'invalid' ? `  ⚠ ${label}: INVALID, run again (${why})` : `  ${outcome === 'pass' ? '✓' : '✗'} ${label}`)
}

// D1 statements pinned to this run. Without a server window, fall back to a wide span on our clock.
const span = window ?? { earliest: startedAt.getTime() - 60_000, latest: finishedAt.getTime() + 60_000 }
const ipKey = args.salt ? `ip:${createHash('sha256').update(`${args.salt}:${args['client-ip']}`).digest('hex')}` : undefined
const d1 = d1Statements({ run, span, window, ipKey })
const wrangler = (sql) => `npx wrangler d1 execute ${args.database ?? (local ? '<local database>' : STAGING_DATABASE)} ${local ? '--local' : '--remote'} --command "${sql}"`
console.log(`\nD1, right after the run and before anyone else sends a card from this IP:`)
console.log(`  expect ${stored} cards, ${stored} distinct nicknames, ${stored} pending, created between ${new Date(span.earliest).toISOString()} and ${new Date(span.latest).toISOString()}:`)
console.log(`    ${wrangler(d1.cards)}`)
if (result.ipRowComparable && d1.ipRow) {
  console.log(`  expect ${ipKey ? 'the row' : 'exactly one row'} with minute_count = ${stored}: the cards stored, not the ${refused} refused requests (hour_count also counts cards this IP sent earlier in the hour):`)
  console.log(`    ${wrangler(d1.ipRow)}`)
} else {
  console.log('  ⚠ the IP row cannot be compared: this run\'s cards may span two minute buckets. Run again.')
}
console.log('cleanup, only after Ian approves (also saved in the report): the first must print the same card count, then delete:')
console.log(`    ${wrangler(d1.cleanupPreview)}`)
console.log(`    ${wrangler(d1.cleanup)}`)

mkdirSync(new URL('reports/', import.meta.url), { recursive: true })
const reportFile = new URL(`reports/${startedAt.toISOString().replace(/[:.]/g, '-')}-${run}.json`, import.meta.url)
writeFileSync(reportFile, JSON.stringify({
  run, base: base.origin, users, newcomers, rampSeconds: Number(args.ramp), startedAt, finishedAt,
  phasesMs: { A: msA, B: msB, C: msC }, expectedCardsInD1: stored,
  conditions: {
    serverClockOffsetMs: offset,
    serverWindow: window && { earliest: new Date(window.earliest), latest: new Date(window.latest), oneMinute: window.oneMinute },
    longestResendGapMs: resendGapMs,
  },
  checks, latency, d1,
  responses: { A: tally(of('A')), B: tally(of('B')), C: tally(of('C')) },
  samples: samples.map(({ cookie, ...rest }) => rest),
}, null, 2))
console.log(`\nreport: ${reportFile.pathname}`)
agent.destroy()
process.exit(checks.every(check => check.result === 'pass') ? 0 : 1)
