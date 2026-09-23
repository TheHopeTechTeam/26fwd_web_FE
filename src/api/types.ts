/**
 * Forward Card API contract, shared by the live client and the in-browser mock.
 * The human-readable version for the backend lives in docs/api/README.md and
 * docs/api/openapi.yaml; keep all three in sync.
 */

export type CardStatus = 'pending' | 'approved' | 'hidden';

/** POST /api/cards */
export interface SubmitCardRequest {
  /** trim → 1–20 code points, no control characters */
  nickname: string;
  /** trim → 1–140 code points; tab/newline allowed */
  text_gratitude: string;
  /** trim → 1–140 code points; tab/newline allowed */
  text_anticipate: string;
  /** Must be literally true. */
  agreed_to_publish: true;
  /** Hidden bot trap. Humans always send "". */
  honeypot: string;
  /** Cloudflare Turnstile response; required by the live backend when Turnstile is on. */
  turnstile_token?: string;
}

/** 201 — the card is stored as pending and is NOT public until a reviewer approves it. */
export interface SubmitCardResponse {
  success: true;
  card_id: string;
}

/** A card as the public wall sees it. Never carries status, IP hash or review data. */
export interface PublicCard {
  id: string;
  nickname: string;
  text_gratitude: string;
  text_anticipate: string;
  /** ISO 8601 UTC */
  created_at: string;
}

export interface Pagination {
  page: number;
  limit: number;
  has_more: boolean;
  total_count: number;
}

/** GET /api/cards?page=1&limit=12 — approved cards only, newest first. */
export interface ListCardsResponse {
  items: PublicCard[];
  pagination: Pagination;
}

export interface AdminCard extends PublicCard {
  status: CardStatus;
}

/** GET /api/admin/cards?status=pending — newest first, at most 100 rows. */
export interface AdminListResponse {
  items: AdminCard[];
  has_more: boolean;
}

/** PATCH /api/admin/cards/:id/status and PATCH /api/admin/cards/:id/hide */
export interface AdminStatusResponse {
  success: true;
  card_id: string;
  status: CardStatus;
}

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'TURNSTILE_FAILED'
  | 'PAYLOAD_TOO_LARGE'
  | 'RATE_LIMITED'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'METHOD_NOT_ALLOWED'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

/** Every non-2xx response body. `fields` only appears on VALIDATION_ERROR. */
export interface ApiErrorBody {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    fields?: Record<string, string>;
    retry_after_seconds?: number;
  };
}

export const PUBLIC_PAGE_LIMIT = 12;
export const ADMIN_LIST_LIMIT = 100;
export const ADMIN_TOKEN_MIN_LENGTH = 32;
export const MAX_BODY_BYTES = 4096;
