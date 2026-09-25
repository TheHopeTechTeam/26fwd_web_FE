import { authorize, handleError, json, type Env } from '../../_lib/cards'
type Context = { request: Request; env: Env }
export async function onRequestGet({ request, env }: Context): Promise<Response> {
  try {
    authorize(request, env.ADMIN_API_TOKEN)
    const status = new URL(request.url).searchParams.get('status') ?? 'pending'
    if (!['pending','approved','hidden'].includes(status)) return json({ error: 'VALIDATION_ERROR', message: '無效狀態' }, 400)
    const rows = await env.FORWARD_DB.prepare(`SELECT id,nickname,text_gratitude,text_anticipate,status,created_at FROM forward_cards WHERE status=? ORDER BY created_at DESC,id DESC LIMIT 100`).bind(status).all()
    return json({ items: rows.results })
  } catch (error) { return handleError(error) }
}
