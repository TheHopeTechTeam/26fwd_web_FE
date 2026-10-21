// Staging load test for the Client Token rollout (#5, #15): many people behind one public IP.
// It behaves like the browser client: every card first asks /api/client-token, keeps its own
// cookie, then posts the card with the official Turnstile dummy token.
//
//   A  burst       --users browsers arrive over --ramp seconds, each sends one card     → all 201
//   B  resend      every one of them sends again within 60 seconds with the same cookie → all 429
//   C  newcomers   --newcomers more browsers each send one card                         → all 201
//
// C shows that the refused resends in B did not use up the shared IP quota (#13 review). By
// default the run starts just after a clock minute so A–C share one per-IP minute bucket.
//
// It refuses to run unless the first response carries X-FWD-Load-Test: on, which the backend
// only sends while LOAD_TEST_MODE is on for 26fwd-staging.pages.dev (docs/DEPLOYMENT.md).
//
//   node scripts/load-test/run.mjs                      # staging, 300 + 50 browsers
//   node scripts/load-test/run.mjs --users 30 --newcomers 5 --no-align
//   node scripts/load-test/run.mjs --base http://127.0.0.1:8799 --host-header 26fwd-staging.pages.dev --client-ip 203.0.113.50
import http from 'node:http'
import https from 'node:https'
import { randomBytes } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { parseArgs } from 'node:util'

const STAGING = 'https://26fwd-staging.pages.dev'
const DUMMY_TURNSTILE_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX'
const IP_CARDS_PER_MINUTE = 400

const { values: args } = parseArgs({
  options: {
    base: { type: 'string', default: STAGING },
    users: { type: 'string', default: '300' },
    newcomers: { type: 'string', default: '50' },
    ramp: { type: 'string', default: '20' },
    'no-align': { type: 'boolean', default: false },
    // Local dry run against `wrangler pages dev` only: what Cloudflare itself would supply.
    'host-header': { type: 'string' },
    'client-ip': { type: 'string' },
  },
})

const base = new URL(args.base)
const local = ['127.0.0.1', 'localhost'].includes(base.hostname)
const users = Number(args.users), newcomers = Number(args.newcomers), rampMs = Number(args.ramp) * 1000
if (base.origin !== STAGING && !local) fail(`refusing to run against ${base.origin}: only ${STAGING} or a local wrangler dev server`)
if ((args['host-header'] || args['client-ip']) && !local) fail('--host-header and --client-ip are for local dry runs only')
if (!(Number.isInteger(users) && users > 0 && Number.isInteger(newcomers) && newcomers >= 0 && rampMs >= 0)) {
  fail('--users and --newcomers must be whole numbers (users at least 1), --ramp a number of seconds')
}
if (users + newcomers > IP_CARDS_PER_MINUTE) fail(`--users + --newcomers must stay within the per-IP limit of ${IP_CARDS_PER_MINUTE} cards a minute`)

// One random id per run, in every nickname, to count and clean up exactly this run's cards.
const run = randomBytes(3).toString('hex').slice(0, 4)
const agent = new (base.protocol === 'https:' ? https : http).Agent({ keepAlive: true })
const samples = []

function fail(message) {
  console.error(`✗ ${message}`)
  process.exit(1)
}

function send(path, { phase, kind, cookie, body }) {
  const headers = { Accept: 'application/json' }
  if (args['host-header']) headers.Host = args['host-header']
  if (args['client-ip']) headers['CF-Connecting-IP'] = args['client-ip']
  if (cookie) headers.Cookie = cookie
  const payload = body === undefined ? undefined : Buffer.from(JSON.stringify(body))
  if (payload) Object.assign(headers, { 'Content-Type': 'application/json', 'Content-Length': payload.length })
  const started = performance.now()
  return new Promise(resolve => {
    const finish = (result) => {
      const sample = { phase, kind, ms: Math.round(performance.now() - started), ...result }
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
        finish({
          status: response.statusCode,
          code: error?.code,
          retry: error?.retry_after_seconds,
          marked: response.headers['x-fwd-load-test'] === 'on',
          cookie: setCookie?.split(';')[0],
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
  const token = await send('/api/client-token', { phase, kind: browser.cookie ? 'token-kept' : 'token-new', cookie: browser.cookie })
  if (token.cookie) browser.cookie = token.cookie
  if (token.status !== 204) return token
  return send('/api/cards', { phase, kind: 'card', cookie: browser.cookie, body: card(browser.n) })
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

// A, B and C take about --ramp + 15 seconds; starting just after a clock minute keeps them in one
// per-IP minute bucket, so C really tests whether B used up the shared quota.
const intoMinute = Date.now() % 60_000
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
const of = (phase, kind) => samples.filter(s => s.phase === phase && (!kind || s.kind === kind))
// `count` browsers, each with exactly one response of this kind, all with `status`.
const all = (list, count, test) => list.length === count && list.every(test)
const cardsA = of('A', 'card'), cardsB = of('B', 'card'), cardsC = of('C', 'card')
// Every 201 is a stored card, whichever phase it came from (on 10/21 13 first cards refused in A
// were stored in B), and every 429 is a refusal the IP row must not count.
const stored = samples.filter(s => s.kind === 'card' && s.status === 201).length
const refused = samples.filter(s => s.kind === 'card' && s.status === 429).length
const checks = [
  [`A: all ${users} got a new token (204 with a cookie)`, all(of('A', 'token-new'), users, s => s.status === 204 && !!s.cookie)],
  [`A: all ${users} cards stored (201)`, all(cardsA, users, s => s.status === 201)],
  [`B: all ${users} kept their token (204, no new cookie)`, all(of('B', 'token-kept'), users, s => s.status === 204 && !s.cookie)],
  [`B: all ${users} resends refused (429 RATE_LIMITED with a retry time)`, all(cardsB, users, s => s.status === 429 && s.code === 'RATE_LIMITED' && s.retry > 0)],
  [`C: all ${newcomers} newcomers stored (201)`, all(cardsC, newcomers, s => s.status === 201)],
  ['every response marked X-FWD-Load-Test: on', samples.every(s => s.marked)],
  ['no network errors or 5xx', samples.every(s => s.status > 0 && s.status < 500)],
]

const timed = samples.filter(s => s.phase !== 'preflight')
const latency = [
  ['token, new', timed.filter(s => s.kind === 'token-new')],
  ['token, kept', timed.filter(s => s.kind === 'token-kept')],
  ['card stored (201)', timed.filter(s => s.kind === 'card' && s.status === 201)],
  ['card refused (429)', timed.filter(s => s.kind === 'card' && s.status === 429)],
].map(([label, list]) => ({ request: label, count: list.length, p50_ms: percentile(list.map(s => s.ms), 50), p95_ms: percentile(list.map(s => s.ms), 95), max_ms: list.length ? Math.max(...list.map(s => s.ms)) : '-' }))

console.log(`\nrun ${run} · ${startedAt.toISOString()} → ${finishedAt.toISOString()} · phases ${msA} / ${msB} / ${msC} ms`)
console.log('\nresponses:')
console.table({ 'A burst': tally(of('A')), 'B resend': tally(of('B')), 'C newcomers': tally(of('C')) })
console.log('latency (measured from this machine, network included):')
console.table(latency)
console.log('checks:')
for (const [label, passed] of checks) console.log(`  ${passed ? '✓' : '✗'} ${label}`)

const nickname = `壓測-${run}-%`
console.log(`\nexpected in D1: ${stored} cards for this run. Check with:`)
console.log(`  npx wrangler d1 execute forward_cards_staging --remote --command "SELECT COUNT(*) AS cards, COUNT(DISTINCT nickname) AS distinct_nicknames, SUM(status = 'pending') AS pending FROM forward_cards WHERE nickname LIKE '${nickname}'"`)
console.log(`  npx wrangler d1 execute forward_cards_staging --remote --command "SELECT minute_count, hour_count FROM submission_rate_limits WHERE limiter_key LIKE 'ip:%' ORDER BY last_submit_ms DESC LIMIT 1"`)
console.log(`  (the IP row should count ${stored}: the cards stored, not the ${refused} refused requests)`)

mkdirSync(new URL('reports/', import.meta.url), { recursive: true })
const reportFile = new URL(`reports/${startedAt.toISOString().replace(/[:.]/g, '-')}-${run}.json`, import.meta.url)
writeFileSync(reportFile, JSON.stringify({
  run, base: base.origin, users, newcomers, rampSeconds: Number(args.ramp), startedAt, finishedAt,
  phasesMs: { A: msA, B: msB, C: msC }, expectedCardsInD1: stored,
  checks: Object.fromEntries(checks), latency,
  responses: { A: tally(of('A')), B: tally(of('B')), C: tally(of('C')) },
  samples: samples.map(({ cookie, ...rest }) => rest),
}, null, 2))
console.log(`\nreport: ${reportFile.pathname}`)
agent.destroy()
process.exit(checks.every(([, passed]) => passed) ? 0 : 1)
