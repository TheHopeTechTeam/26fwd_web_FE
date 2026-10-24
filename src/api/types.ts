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

/**
 * The model's judgment of a card (M1.6). `outcome`: clear = no reason to hold it, flagged = some
 * reason, the rest = no usable answer (the card stays pending). Never contains card text.
 */
export interface AdminModeration {
  model: string;
  /** 12-character version of the questions used; null when none were configured. */
  questions_version: string | null;
  outcome: 'clear' | 'flagged' | 'questions_missing' | 'timeout' | 'model_error' | 'invalid_output';
  reason: string | null;
  reason_probability: number | null;
  needs_attention_probability: number | null;
  /** True only when this judgment published the card. */
  auto_published: boolean;
  judged_at: string;
}

export interface AdminCard extends PublicCard {
  status: CardStatus;
  /** Null when the card was not judged, e.g. while auto-publish is off. */
  moderation?: AdminModeration | null;
}

/** GET /api/admin/cards?status=pending — newest first, at most 100 rows. */
export interface AdminListResponse {
  items: AdminCard[];
  has_more: boolean;
}

/**
 * PATCH /api/admin/cards/:id/status body. `from` is the status the reviewer saw: with it, the
 * change applies only while the card still has that status, otherwise 409 CARD_STATUS_CHANGED.
 */
export interface AdminStatusRequest {
  status: Exclude<CardStatus, 'pending'>;
  from?: CardStatus;
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
  /** 401 on POST /api/cards: the Client Token cookie is missing, expired or not genuine. */
  | 'CLIENT_TOKEN_INVALID'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'METHOD_NOT_ALLOWED'
  /** 409 on the admin status and hide endpoints: someone else changed the card first. */
  | 'CARD_STATUS_CHANGED'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

/**
 * Every non-2xx response body. `fields` only appears on VALIDATION_ERROR, `current_status` only on
 * CARD_STATUS_CHANGED.
 */
export interface ApiErrorBody {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    fields?: Record<string, string>;
    retry_after_seconds?: number;
    current_status?: CardStatus;
  };
}

export const PUBLIC_PAGE_LIMIT = 12;
export const ADMIN_LIST_LIMIT = 100;
export const ADMIN_TOKEN_MIN_LENGTH = 32;
export const MAX_BODY_BYTES = 4096;
