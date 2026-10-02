import { ApiError, authorize, handleError, json, validateCardId, type Env } from '../../../../_lib/cards'
type Context = { request: Request; env: Env; params: { id: string } }
export async function onRequestPatch({ request, env, params }: Context): Promise<Response> {
  try {
    authorize(request, env.ADMIN_API_TOKEN)
    const id = validateCardId(params.id)
    const result = await env.FORWARD_DB.prepare("UPDATE forward_cards SET status='hidden' WHERE id=?").bind(id).run()
    if (!result.meta.changes) throw new ApiError(404, 'NOT_FOUND', '找不到卡片')
    return json({ success: true, card_id: id, status: 'hidden' })
  } catch (error) { return handleError(error) }
}
