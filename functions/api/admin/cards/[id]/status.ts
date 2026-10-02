import { ApiError, authorize, handleError, json, validateCardId, type Env } from '../../../../_lib/cards'
type Context = { request: Request; env: Env; params: { id: string } }
export async function onRequestPatch({ request, env, params }: Context): Promise<Response> {
  try {
    authorize(request, env.ADMIN_API_TOKEN)
    const id = validateCardId(params.id)
    const mediaType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase()
    if (mediaType !== 'application/json') throw new ApiError(400, 'VALIDATION_ERROR', '只接受 JSON 格式')
    const raw = await request.text()
    if (new TextEncoder().encode(raw).byteLength > 1024) throw new ApiError(400, 'VALIDATION_ERROR', '內容超過 1 KiB')
    let body: { status?: unknown }
    try { body = JSON.parse(raw) as { status?: unknown } } catch { throw new ApiError(400, 'VALIDATION_ERROR', 'JSON 格式錯誤') }
    if (body.status !== 'approved' && body.status !== 'hidden') throw new ApiError(400, 'VALIDATION_ERROR', '狀態只能是 approved 或 hidden')
    const result = await env.FORWARD_DB.prepare('UPDATE forward_cards SET status=? WHERE id=?').bind(body.status, id).run()
    if (!result.meta.changes) throw new ApiError(404, 'NOT_FOUND', '找不到卡片')
    return json({ success: true, card_id: id, status: body.status })
  } catch (error) { return handleError(error) }
}
