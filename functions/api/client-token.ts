import { errorResponse, handleError, type Env } from '../_lib/cards'
import { clientTokenCookie, issueClientToken, readClientToken } from '../_lib/client-token'
import { clientIp, consumeRateLimit, RATE_RULES, requireSalt, saltedHash } from '../_lib/rate-limit'

type Context = { request: Request; env: Env }

const noContent = (headers: Record<string, string> = {}) =>
  new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers } })

// The browser calls this before every card submission. A browser that already holds a valid
// token keeps it, so reloading the page does not hand out a fresh quota, and only new tokens
// count towards the per-IP issuing limit.
export async function onRequestPost({ request, env }: Context): Promise<Response> {
  try {
    if (env.CARD_SUBMISSIONS_ENABLED === 'false') return errorResponse(503, 'SERVICE_UNAVAILABLE', 'Card submissions are paused')
    const now = Date.now()
    if (await readClientToken(request, env.CLIENT_TOKEN_SECRET, now)) return noContent()
    const salt = requireSalt(env.RATE_LIMIT_SALT)
    await consumeRateLimit(env.FORWARD_DB, `iss:${await saltedHash(salt, clientIp(request))}`, RATE_RULES.ipTokenIssue, now)
    return noContent({ 'Set-Cookie': clientTokenCookie(await issueClientToken(env.CLIENT_TOKEN_SECRET, now)) })
  } catch (error) { return handleError(error) }
}
