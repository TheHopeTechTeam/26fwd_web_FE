import { changeStatus, expectedStatus, readAdminBody } from '../../../../_lib/admin-status'
import { ApiError, authorize, handleError, json, validateCardId, type Env } from '../../../../_lib/cards'
type Context = { request: Request; env: Env; params: { id: string } }
export async function onRequestPatch({ request, env, params }: Context): Promise<Response> {
  try {
    authorize(request, env.ADMIN_API_TOKEN)
    const id = validateCardId(params.id)
    // An unreadable body answers like a missing status, as it always has.
    const body = (await readAdminBody(request)) ?? {}
    const status = body.status
    if (status !== 'approved' && status !== 'hidden')
      throw new ApiError(400, 'VALIDATION_ERROR', 'status must be approved or hidden', { fields: { status: 'invalid' } })
    await changeStatus(env.FORWARD_DB, id, status, expectedStatus(body.from))
    return json({ success: true, card_id: id, status })
  } catch (error) { return handleError(error) }
}
