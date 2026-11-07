import type { CardStatus } from '../../src/api/types'
import { ApiError } from './cards'

const STATUSES: readonly string[] = ['pending', 'approved', 'hidden']

// The small JSON body the admin endpoints take, or null when it is not a JSON object.
export async function readAdminBody(request: Request): Promise<Record<string, unknown> | null> {
  const raw = await request.text()
  const mediaType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase()
  if (mediaType !== 'application/json') throw new ApiError(400, 'VALIDATION_ERROR', 'Content-Type must be application/json')
  if (new TextEncoder().encode(raw).byteLength > 1024) throw new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Request body exceeds 1 KiB')
  try {
    const parsed: unknown = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null
  } catch {
    return null
  }
}

// `from` in an admin body: the status the reviewer saw when acting. Required (Ian 10/25), so no
// change skips the check below.
export function expectedStatus(value: unknown): CardStatus {
  if (typeof value === 'string' && STATUSES.includes(value)) return value as CardStatus
  throw new ApiError(400, 'VALIDATION_ERROR', 'from must be pending, approved or hidden', { fields: { from: value === undefined ? 'required' : 'invalid' } })
}

// Sets a card's status only while it still has the status the reviewer saw, so two reviewers cannot
// overwrite each other (#5, Ian 10/23); otherwise 409 with the status the card has now. A change is
// recorded in card_status_changes in the same transaction (Ian 10/25).
export async function changeStatus(db: D1Database, id: string, next: CardStatus, from: CardStatus): Promise<void> {
  const [update] = await db.batch([
    db.prepare('UPDATE forward_cards SET status=? WHERE id=? AND status=?').bind(next, id, from),
    // changes() is the UPDATE's; asking for the status a card already has changes nothing.
    db.prepare(`INSERT INTO card_status_changes (card_id, from_status, to_status, actor, changed_at)
      SELECT ?, ?, ?, 'reviewer', ? WHERE changes() = 1 AND ? <> ?`).bind(id, from, next, new Date().toISOString(), from, next),
  ])
  if (update?.meta.changes) return
  await refuse(db, id)
}

// Deletes a card only while it is hidden (#35), so a card someone published again after the reviewer
// loaded the list is never deleted: that is the same 409 as above. In the same transaction its
// judgment and status history go too, by statement rather than only through ON DELETE CASCADE, so
// nothing is left behind where foreign keys are not enforced; one row in card_deletions, with no
// card text, records the deletion.
export async function deleteHiddenCard(db: D1Database, id: string): Promise<void> {
  const gone = 'NOT EXISTS (SELECT 1 FROM forward_cards WHERE id=?)'
  const [removal] = await db.batch([
    db.prepare("DELETE FROM forward_cards WHERE id=? AND status='hidden'").bind(id),
    // changes() is the DELETE's: a card that was not deleted leaves no record.
    db.prepare(`INSERT INTO card_deletions (card_id, actor, deleted_at)
      SELECT ?, 'reviewer', ? WHERE changes() = 1`).bind(id, new Date().toISOString()),
    db.prepare(`DELETE FROM card_moderations WHERE card_id=? AND ${gone}`).bind(id, id),
    db.prepare(`DELETE FROM card_status_changes WHERE card_id=? AND ${gone}`).bind(id, id),
  ])
  if (removal?.meta.changes) return
  await refuse(db, id)
}

// Why a change or a delete did not apply: the card does not exist (404), or it no longer has the
// status the reviewer saw (409, with the status it has now).
async function refuse(db: D1Database, id: string): Promise<never> {
  const card = await db.prepare('SELECT status FROM forward_cards WHERE id=?').bind(id).first<{ status: CardStatus }>()
  if (!card) throw new ApiError(404, 'NOT_FOUND', 'Card not found')
  throw new ApiError(409, 'CARD_STATUS_CHANGED', 'The card was changed by someone else', { currentStatus: card.status })
}
