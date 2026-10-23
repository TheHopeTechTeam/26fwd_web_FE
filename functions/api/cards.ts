import { errorResponse, handleError, json, parseCardSubmission, verifyTurnstile, type Env } from '../_lib/cards'
import { requireClientToken } from '../_lib/client-token'
import { clientIp, consumeRateLimits, RATE_RULES, requireSalt, saltedHash } from '../_lib/rate-limit'

type Context = { request: Request; env: Env }

// Order: validate → honeypot → Client Token → Turnstile → rate limits → insert. The Client Token
// comes before Turnstile because a Turnstile token works only once: when the browser re-fetches
// an expired Client Token and resends, the same Turnstile token is still unused.
export async function onRequestPost({ request, env }: Context): Promise<Response> {
  try {
    if (env.CARD_SUBMISSIONS_ENABLED === 'false') return errorResponse(503, 'SERVICE_UNAVAILABLE', 'Card submissions are paused')
    const body = await parseCardSubmission(request)
    if (body.honeypot) return json({ success: true, card_id: `c_${crypto.randomUUID()}` }, 201)
    const tokenId = await requireClientToken(request, env.CLIENT_TOKEN_SECRET, Date.now())
    await verifyTurnstile(body.turnstile_token, request, env)
    const salt = requireSalt(env.RATE_LIMIT_SALT), now = Date.now()
    await consumeRateLimits(env.FORWARD_DB, [
      [`ip:${await saltedHash(salt, clientIp(request))}`, RATE_RULES.ipSubmit],
      [`tok:${await saltedHash(salt, tokenId)}`, RATE_RULES.token],
    ], now)
    const id = `c_${crypto.randomUUID()}`, createdAt = new Date().toISOString()
    await env.FORWARD_DB.prepare(`INSERT INTO forward_cards
      (id,nickname,text_gratitude,text_anticipate,status,agreed_to_publish,created_at)
      VALUES (?,?,?,?, 'pending',1,?)`).bind(id, body.nickname, body.text_gratitude, body.text_anticipate, createdAt).run()
    return json({ success: true, card_id: id }, 201)
  } catch (error) { return handleError(error) }
}

// Each Cloudflare data center keeps its own copy of a wall page for this long, and nothing purges
// the copies elsewhere, so this lifetime alone bounds how long a hidden card stays on the wall:
// under the 15 seconds agreed in #5 (D1 read fix, Ian 10/21).
export const WALL_CACHE_SECONDS = 10
// Browsers revalidate every time, so their copy cannot outlast the edge one.
const BROWSER_CACHE_CONTROL = 'public, max-age=0, must-revalidate'

export async function onRequestGet({ request, env }: Context): Promise<Response> {
  try {
    const url = new URL(request.url)
    const pageRaw = url.searchParams.get('page') ?? '1', limitRaw = url.searchParams.get('limit') ?? '12'
    if (!/^\d+$/.test(pageRaw) || Number(pageRaw) < 1) return errorResponse(400, 'VALIDATION_ERROR', 'page must be a positive integer')
    if (!/^\d+$/.test(limitRaw) || Number(limitRaw) < 1) return errorResponse(400, 'VALIDATION_ERROR', 'limit must be a positive integer')
    const page = Number(pageRaw), limit = Math.min(12, Number(limitRaw)), offset = (page - 1) * limit
    if (!Number.isSafeInteger(offset) || offset > 120_000) return errorResponse(400, 'VALIDATION_ERROR', 'page is out of range')
    // One entry per page and limit, so other query parameters cannot bypass the cache. A cache
    // failure only costs a database read; it never fails the wall.
    const key = new Request(`${url.origin}${url.pathname}?page=${page}&limit=${limit}`)
    const cache = typeof caches === 'undefined' ? undefined : caches.default
    const hit = await cache?.match(key).catch(() => undefined)
    if (hit) return forBrowsers(hit)
    const response = json(await wallPage(env.FORWARD_DB, page, limit, offset), 200, { 'Cache-Control': `public, max-age=${WALL_CACHE_SECONDS}` })
    await cache?.put(key, response.clone()).catch(() => undefined)
    return forBrowsers(response)
  } catch (error) { return handleError(error) }
}

// total_count comes from the one-row total kept by migration 0003's triggers, instead of counting
// every approved card on every load. A page past the last card is answered without reading cards.
async function wallPage(db: D1Database, page: number, limit: number, offset: number) {
  const total = await approvedTotal(db)
  const rows = offset < total
    ? (await db.prepare(`SELECT id,nickname,text_gratitude,text_anticipate,created_at FROM forward_cards
        WHERE status='approved' ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?`).bind(limit + 1, offset).all()).results
    : []
  return { items: rows.slice(0, limit), pagination: { page, limit, has_more: rows.length > limit, total_count: total } }
}

// Counts instead, and says so in the log, while the total is missing (0003 not applied yet).
async function approvedTotal(db: D1Database): Promise<number> {
  try {
    const row = await db.prepare("SELECT count FROM forward_card_counts WHERE status='approved'").first<{ count: number }>()
    if (row) return row.count
  } catch { /* no forward_card_counts table yet */ }
  console.error('forward_card_counts has no approved total; counting the cards instead (apply migration 0003)')
  const counted = await db.prepare("SELECT COUNT(*) AS count FROM forward_cards WHERE status='approved'").first<{ count: number }>()
  return counted?.count ?? 0
}

function forBrowsers(response: Response): Response {
  const copy = new Response(response.body, response)
  copy.headers.set('Cache-Control', BROWSER_CACHE_CONTROL)
  return copy
}
