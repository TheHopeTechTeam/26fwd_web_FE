import { changeStatus, expectedStatus, readAdminBody } from '../../../../_lib/admin-status'
import { ApiError, authorize, handleError, json, validateCardId, type Env } from '../../../../_lib/cards'
type Context = { request: Request; env: Env; params: { id: string } }
// The body is optional: { from } makes the takedown conditional on the status the reviewer saw. A
// body that is there but unreadable is refused, so a broken request never skips that check.
export async function onRequestPatch({ request, env, params }: Context): Promise<Response> {
  try {
    authorize(request, env.ADMIN_API_TOKEN)
    const id = validateCardId(params.id)
    const body = await readAdminBody(request, true)
    if (!body) throw new ApiError(400, 'VALIDATION_ERROR', 'Body must be a JSON object', { fields: { from: 'invalid' } })
    await changeStatus(env.FORWARD_DB, id, 'hidden', expectedStatus(body.from))
    return json({ success: true, card_id: id, status: 'hidden' })
  } catch (error) { return handleError(error) }
}
