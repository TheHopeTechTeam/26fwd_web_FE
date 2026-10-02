import { consumeRateLimit, handleError, hashClientIp, json, parseCardSubmission, verifyTurnstile, type Env } from '../_lib/cards'

type Context = { request: Request; env: Env }

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  try {
    if (env.CARD_SUBMISSIONS_ENABLED === 'false') return json({ error: 'MAINTENANCE', message: '目前暫停寫卡，請稍後再試' }, 503)
    const body = await parseCardSubmission(request)
    if (body.honeypot) return json({ success: true, card_id: 'discarded' }, 201)
    await verifyTurnstile(body.turnstile_token, request, env.TURNSTILE_SECRET_KEY, env.TURNSTILE_ALLOWED_HOSTNAME)
    const ipHash = await hashClientIp(request, env.RATE_LIMIT_SALT)
    await consumeRateLimit(env.FORWARD_DB, ipHash, Date.now())
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
    if (!/^\d+$/.test(pageRaw) || Number(pageRaw) < 1) return json({ error: 'VALIDATION_ERROR', message: 'page 必須是正整數' }, 400)
    if (!/^\d+$/.test(limitRaw) || Number(limitRaw) < 1) return json({ error: 'VALIDATION_ERROR', message: 'limit 必須是正整數' }, 400)
    const page = Number(pageRaw), limit = Math.min(12, Number(limitRaw)), offset = (page - 1) * limit
    if (!Number.isSafeInteger(offset) || offset > 120_000) return json({ error: 'VALIDATION_ERROR', message: 'page 超出可查詢範圍' }, 400)
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
