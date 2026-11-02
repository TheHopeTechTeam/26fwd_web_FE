import { changeStatus, expectedStatus, readAdminBody } from '../../../../_lib/admin-status'
import { authorize, handleError, json, validateCardId, type Env } from '../../../../_lib/cards'
type Context = { request: Request; env: Env; params: { id: string } }
// The body { from } is required: the takedown applies only while the card still has the status the
// reviewer saw. A missing or unreadable body is refused, so no request skips that check.
export async function onRequestPatch({ request, env, params }: Context): Promise<Response> {
  try {
    authorize(request, env.ADMIN_API_TOKEN)
    const id = validateCardId(params.id)
    const body = (await readAdminBody(request)) ?? {}
    await changeStatus(env.FORWARD_DB, id, 'hidden', expectedStatus(body.from))
    return json({ success: true, card_id: id, status: 'hidden' })
  } catch (error) { return handleError(error) }
}
