import { ADMIN_LIST_LIMIT, type AdminCard, type AdminModeration } from '../../../src/api/types'
import { authorize, errorResponse, handleError, json, type Env } from '../../_lib/cards'
type Context = { request: Request; env: Env }
// A card joined with its judgment; every judgment column is null when there is none.
type Row = Omit<AdminCard, 'moderation'> & {
  model: string | null
  questions_version: string | null
  outcome: AdminModeration['outcome'] | null
  reason: string | null
  reason_probability: number | null
  needs_attention_probability: number | null
  auto_published: number | null
  judged_at: string | null
}
export async function onRequestGet({ request, env }: Context): Promise<Response> {
  try {
    authorize(request, env.ADMIN_API_TOKEN)
    const status = new URL(request.url).searchParams.get('status') ?? 'pending'
    if (!['pending','approved','hidden'].includes(status)) return errorResponse(400, 'VALIDATION_ERROR', 'status must be pending, approved or hidden')
    // Fetch one extra row to tell whether more than ADMIN_LIST_LIMIT cards match. Each card comes
    // with the model's judgment, if any, for the audit trail reviewers see (M1.6, Ian 10/15).
    const rows = await env.FORWARD_DB.prepare(`SELECT c.id, c.nickname, c.text_gratitude, c.text_anticipate, c.status, c.created_at,
        m.model, m.questions_version, m.outcome, m.reason, m.reason_probability, m.needs_attention_probability, m.auto_published, m.judged_at
      FROM forward_cards c LEFT JOIN card_moderations m ON m.card_id = c.id
      WHERE c.status=? ORDER BY c.created_at DESC, c.id DESC LIMIT ?`).bind(status, ADMIN_LIST_LIMIT + 1).all<Row>()
    const items: AdminCard[] = rows.results.slice(0, ADMIN_LIST_LIMIT).map(
      ({ model, questions_version, outcome, reason, reason_probability, needs_attention_probability, auto_published, judged_at, ...card }) => ({
        ...card,
        moderation: outcome && model && judged_at
          ? { model, questions_version, outcome, reason, reason_probability, needs_attention_probability, auto_published: auto_published === 1, judged_at }
          : null,
      }))
    return json({ items, has_more: rows.results.length > ADMIN_LIST_LIMIT })
  } catch (error) { return handleError(error) }
}
