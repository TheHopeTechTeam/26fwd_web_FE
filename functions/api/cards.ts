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

export async function onRequestGet({ request, env }: Context): Promise<Response> {
  try {
    const url = new URL(request.url)
    const pageRaw = url.searchParams.get('page') ?? '1', limitRaw = url.searchParams.get('limit') ?? '12'
    if (!/^\d+$/.test(pageRaw) || Number(pageRaw) < 1) return errorResponse(400, 'VALIDATION_ERROR', 'page must be a positive integer')
    if (!/^\d+$/.test(limitRaw) || Number(limitRaw) < 1) return errorResponse(400, 'VALIDATION_ERROR', 'limit must be a positive integer')
    const page = Number(pageRaw), limit = Math.min(12, Number(limitRaw)), offset = (page - 1) * limit
    if (!Number.isSafeInteger(offset) || offset > 120_000) return errorResponse(400, 'VALIDATION_ERROR', 'page is out of range')
    const [rows, count] = await Promise.all([
      env.FORWARD_DB.prepare(`SELECT id,nickname,text_gratitude,text_anticipate,created_at FROM forward_cards
        WHERE status='approved' ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?`).bind(limit + 1, offset).all(),
      env.FORWARD_DB.prepare("SELECT COUNT(*) AS count FROM forward_cards WHERE status='approved'").first<{ count: number }>(),
    ])
    const items = rows.results.slice(0, limit)
    return json({ items, pagination: { page, limit, has_more: rows.results.length > limit, total_count: count?.count ?? 0 } }, 200,
      { 'Cache-Control': 'public, max-age=0, s-maxage=15, must-revalidate' })
  } catch (error) { return handleError(error) }
}
