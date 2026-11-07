import { deleteHiddenCard } from '../../../_lib/admin-status'
import { authorize, handleError, json, validateCardId, type Env } from '../../../_lib/cards'
type Context = { request: Request; env: Env; params: { id: string } }
// No body and no `from`: only a hidden card can be deleted, so a card that is no longer hidden gets
// 409 with its status now and stays (#35).
export async function onRequestDelete({ request, env, params }: Context): Promise<Response> {
  try {
    authorize(request, env.ADMIN_API_TOKEN)
    const id = validateCardId(params.id)
    await deleteHiddenCard(env.FORWARD_DB, id)
    return json({ success: true, card_id: id })
  } catch (error) { return handleError(error) }
}
