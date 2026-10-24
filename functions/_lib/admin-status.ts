import type { CardStatus } from '../../src/api/types'
import { ApiError } from './cards'

const STATUSES: readonly string[] = ['pending', 'approved', 'hidden']

// The small JSON body the admin endpoints take. Where `optional`, an empty body is allowed.
export async function readAdminBody(request: Request, optional = false): Promise<Record<string, unknown>> {
  const raw = await request.text()
  if (optional && raw === '') return {}
  const mediaType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase()
  if (mediaType !== 'application/json') throw new ApiError(400, 'VALIDATION_ERROR', 'Content-Type must be application/json')
  if (new TextEncoder().encode(raw).byteLength > 1024) throw new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Request body exceeds 1 KiB')
  try {
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

// `from` in an admin body: the status the reviewer saw when acting, or undefined when not sent.
export function expectedStatus(value: unknown): CardStatus | undefined {
  if (value === undefined) return undefined
  if (typeof value === 'string' && STATUSES.includes(value)) return value as CardStatus
  throw new ApiError(400, 'VALIDATION_ERROR', 'from must be pending, approved or hidden', { fields: { from: 'invalid' } })
}

// Sets a card's status. With `from`, the change applies only while the card still has the status
// the reviewer saw, so two reviewers cannot overwrite each other (#5, Ian 10/23); otherwise 409 with
// the status the card has now. Without `from` it applies regardless, as before.
export async function changeStatus(db: D1Database, id: string, next: CardStatus, from?: CardStatus): Promise<void> {
  const result = from === undefined
    ? await db.prepare('UPDATE forward_cards SET status=? WHERE id=?').bind(next, id).run()
    : await db.prepare('UPDATE forward_cards SET status=? WHERE id=? AND status=?').bind(next, id, from).run()
  if (result.meta.changes) return
  const card = from === undefined ? null : await db.prepare('SELECT status FROM forward_cards WHERE id=?').bind(id).first<{ status: CardStatus }>()
  if (!card) throw new ApiError(404, 'NOT_FOUND', 'Card not found')
  throw new ApiError(409, 'CARD_STATUS_CHANGED', 'The card was changed by someone else', { currentStatus: card.status })
}
