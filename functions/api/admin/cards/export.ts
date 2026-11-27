import type { AdminExportCard, AdminExportResponse } from '../../../../src/api/types'
import { authorize, handleError, json, type Env } from '../../../_lib/cards'
type Context = { request: Request; env: Env }
// Every card still stored, whatever its status, for the reviewers' Excel download (#76). Only the
// file's four columns leave the database: no id, status or judgment. Cards deleted for good are no
// longer in forward_cards, so they are not exported. The admin page builds the .xlsx in the
// browser, so this stays one query and a JSON body, well within the free plan's CPU time per
// request. Like every admin response it is no-store, and the card text is never logged.
export async function onRequestGet({ request, env }: Context): Promise<Response> {
  try {
    authorize(request, env.ADMIN_API_TOKEN)
    const { results } = await env.FORWARD_DB.prepare(`SELECT nickname, text_gratitude, text_anticipate, created_at
      FROM forward_cards ORDER BY created_at ASC, id ASC`).all<AdminExportCard>()
    return json({ items: results } satisfies AdminExportResponse)
  } catch (error) { return handleError(error) }
}
