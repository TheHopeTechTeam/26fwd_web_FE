import { ADMIN_LIST_LIMIT } from '../../../src/api/types'
import { authorize, errorResponse, handleError, json, type Env } from '../../_lib/cards'
type Context = { request: Request; env: Env }
export async function onRequestGet({ request, env }: Context): Promise<Response> {
  try {
    authorize(request, env.ADMIN_API_TOKEN)
    const status = new URL(request.url).searchParams.get('status') ?? 'pending'
    if (!['pending','approved','hidden'].includes(status)) return errorResponse(400, 'VALIDATION_ERROR', 'status must be pending, approved or hidden')
    // Fetch one extra row to tell whether more than ADMIN_LIST_LIMIT cards match.
    const rows = await env.FORWARD_DB.prepare(`SELECT id,nickname,text_gratitude,text_anticipate,status,created_at FROM forward_cards WHERE status=? ORDER BY created_at DESC,id DESC LIMIT ?`).bind(status, ADMIN_LIST_LIMIT + 1).all()
    return json({ items: rows.results.slice(0, ADMIN_LIST_LIMIT), has_more: rows.results.length > ADMIN_LIST_LIMIT })
  } catch (error) { return handleError(error) }
}
