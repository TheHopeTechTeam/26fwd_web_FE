import { ApiError, authorize, handleError, json, validateCardId, type Env } from '../../../../_lib/cards'
type Context = { request: Request; env: Env; params: { id: string } }
export async function onRequestPatch({ request, env, params }: Context): Promise<Response> {
  try {
    authorize(request, env.ADMIN_API_TOKEN)
    const id = validateCardId(params.id)
    const mediaType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase()
    if (mediaType !== 'application/json') throw new ApiError(400, 'VALIDATION_ERROR', 'Content-Type must be application/json')
    const raw = await request.text()
    if (new TextEncoder().encode(raw).byteLength > 1024) throw new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Request body exceeds 1 KiB')
    let status: unknown
    try {
      const parsed: unknown = JSON.parse(raw)
      status = parsed && typeof parsed === 'object' ? (parsed as { status?: unknown }).status : undefined
    } catch { status = undefined }
    if (status !== 'approved' && status !== 'hidden')
      throw new ApiError(400, 'VALIDATION_ERROR', 'status must be approved or hidden', { fields: { status: 'invalid' } })
    const result = await env.FORWARD_DB.prepare('UPDATE forward_cards SET status=? WHERE id=?').bind(status, id).run()
    if (!result.meta.changes) throw new ApiError(404, 'NOT_FOUND', 'Card not found')
    return json({ success: true, card_id: id, status })
  } catch (error) { return handleError(error) }
}
