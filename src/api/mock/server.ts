/**
 * In-browser stand-in for the Forward Card backend. It speaks the exact HTTP contract in
 * docs/api (status codes, JSON bodies, Retry-After), so the real client code path runs
 * unchanged and swapping to the live API is a config flip.
 *
 * Everything lives in memory only: nothing typed into the form is written to
 * localStorage/sessionStorage (US-15), and a reload resets the data.
 */
import type { FetchLike } from '../client';
import {
  ADMIN_LIST_LIMIT,
  ADMIN_TOKEN_MIN_LENGTH,
  MAX_BODY_BYTES,
  PUBLIC_PAGE_LIMIT,
  type AdminCard,
  type ApiErrorBody,
  type ApiErrorCode,
  type CardStatus,
  type PublicCard,
} from '../types';
import { LIMITS, normalizeNewlines, validateField, type CardField } from '../../lib/text';
import { createSeedCards, type StoredCard } from './seed';

export interface MockResponse {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
}

export interface MockServerOptions {
  now?: () => number;
  seed?: StoredCard[];
}

const CLIENT_TOKEN_TTL_MS = 7200_000;
const MIN_GAP_MS = 60_000;
const RATE_PER_HOUR = 3;
const ID_PATTERN = /^[A-Za-z0-9_-]{1,80}$/;

function error(status: number, code: ApiErrorCode, message: string, extra: Partial<ApiErrorBody['error']> = {}): MockResponse {
  const headers: Record<string, string> = {};
  if (extra.retry_after_seconds !== undefined) headers['Retry-After'] = String(extra.retry_after_seconds);
  return { status, body: { success: false, error: { code, message, ...extra } } satisfies ApiErrorBody, headers };
}

function toPublic(card: StoredCard): PublicCard {
  return {
    id: card.id,
    nickname: card.nickname,
    text_gratitude: card.text_gratitude,
    text_anticipate: card.text_anticipate,
    created_at: card.created_at,
  };
}

function newestFirst(a: StoredCard, b: StoredCard): number {
  return b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id);
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return `c_${crypto.randomUUID()}`;
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `c_${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function parseIntParam(value: string | null, fallback: number): number | null {
  if (value === null || value === '') return fallback;
  return /^\d+$/.test(value) ? Number(value) : null;
}

export function createMockServer(options: MockServerOptions = {}) {
  const now = options.now ?? (() => Date.now());
  const cards: StoredCard[] = options.seed ?? createSeedCards(now());
  // Stands in for the one simulated browser's Client Token cookie and its quota. Like the real
  // cookie it is set by POST /api/client-token and only travels with requests made with
  // credentials 'same-origin'; a new token starts a new quota, as on the server.
  let clientToken: { expiresAt: number; lastCardAt: number | null; hourBucket: number; hourCount: number } | null = null;

  function issueClientToken(sendsCookies: boolean): MockResponse {
    const t = now();
    if (sendsCookies && (!clientToken || clientToken.expiresAt <= t)) {
      clientToken = { expiresAt: t + CLIENT_TOKEN_TTL_MS, lastCardAt: null, hourBucket: -1, hourCount: 0 };
    }
    return { status: 204, body: null, headers: { 'Cache-Control': 'no-store' } };
  }

  function authorized(headers: Headers): boolean {
    const match = /^Bearer (.+)$/.exec(headers.get('Authorization') ?? '');
    return !!match && (match[1] ?? '').length >= ADMIN_TOKEN_MIN_LENGTH;
  }

  function submitCard(bodyText: string, sendsCookies: boolean): MockResponse {
    if (new TextEncoder().encode(bodyText).length > MAX_BODY_BYTES) {
      return error(413, 'PAYLOAD_TOO_LARGE', 'Request body exceeds 8 KiB');
    }
    let body: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(bodyText);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
      body = parsed as Record<string, unknown>;
    } catch {
      return error(400, 'VALIDATION_ERROR', 'Body must be a JSON object');
    }

    const fields: Record<string, string> = {};
    const clean: Partial<Record<CardField, string>> = {};
    for (const field of Object.keys(LIMITS) as CardField[]) {
      const raw = body[field];
      if (typeof raw !== 'string') {
        fields[field] = 'required';
        continue;
      }
      const problem = validateField(field, raw);
      if (problem) fields[field] = problem;
      else clean[field] = normalizeNewlines(raw).trim();
    }
    if (body.agreed_to_publish !== true) fields.agreed_to_publish = 'must_be_true';
    if (body.honeypot !== undefined && typeof body.honeypot !== 'string') fields.honeypot = 'invalid';
    if (Object.keys(fields).length > 0) {
      return error(400, 'VALIDATION_ERROR', 'One or more fields are invalid', { fields });
    }

    // Bot trap: look successful, store nothing, and do not touch the rate limiter.
    if (typeof body.honeypot === 'string' && body.honeypot !== '') {
      return { status: 201, body: { success: true, card_id: randomId() } };
    }

    const t = now();
    const token = sendsCookies && clientToken && clientToken.expiresAt > t ? clientToken : null;
    if (!token) return error(401, 'CLIENT_TOKEN_INVALID', 'Missing, expired or invalid client token');

    // Per token: 60 seconds after the previous card, and 3 per clock hour.
    const hour = Math.floor(t / 3600000);
    if (token.hourBucket !== hour) {
      token.hourBucket = hour;
      token.hourCount = 0;
    }
    let waitMs = 0;
    if (token.lastCardAt !== null) waitMs = Math.max(waitMs, token.lastCardAt + MIN_GAP_MS - t);
    if (token.hourCount >= RATE_PER_HOUR) waitMs = Math.max(waitMs, (hour + 1) * 3600000 - t);
    if (waitMs > 0) {
      return error(429, 'RATE_LIMITED', 'Too many requests', { retry_after_seconds: Math.max(1, Math.ceil(waitMs / 1000)) });
    }
    token.lastCardAt = t;
    token.hourCount++;

    const card: StoredCard = {
      id: randomId(),
      nickname: clean.nickname ?? '',
      text_gratitude: clean.text_gratitude ?? '',
      text_anticipate: clean.text_anticipate ?? '',
      status: 'pending',
      created_at: new Date(t).toISOString(),
    };
    cards.push(card);
    return { status: 201, body: { success: true, card_id: card.id } };
  }

  function listPublic(params: URLSearchParams): MockResponse {
    const page = parseIntParam(params.get('page'), 1);
    const limit = parseIntParam(params.get('limit'), PUBLIC_PAGE_LIMIT);
    if (page === null || page < 1 || limit === null || limit < 1 || limit > PUBLIC_PAGE_LIMIT) {
      return error(400, 'VALIDATION_ERROR', `page must be ≥ 1 and limit 1–${PUBLIC_PAGE_LIMIT}`);
    }
    const approved = cards.filter((c) => c.status === 'approved').sort(newestFirst);
    const start = (page - 1) * limit;
    return {
      status: 200,
      body: {
        items: approved.slice(start, start + limit).map(toPublic),
        pagination: { page, limit, has_more: start + limit < approved.length, total_count: approved.length },
      },
      headers: { 'Cache-Control': 'public, max-age=0, must-revalidate' },
    };
  }

  function listAdmin(params: URLSearchParams): MockResponse {
    const status = params.get('status');
    if (status !== 'pending' && status !== 'approved' && status !== 'hidden') {
      return error(400, 'VALIDATION_ERROR', 'status must be pending, approved or hidden');
    }
    const matching = cards.filter((c) => c.status === status).sort(newestFirst);
    // The mock never runs the model, so no card carries a judgment.
    const items: AdminCard[] = matching.slice(0, ADMIN_LIST_LIMIT).map((c) => ({ ...toPublic(c), status: c.status, moderation: null }));
    return { status: 200, body: { items, has_more: matching.length > ADMIN_LIST_LIMIT }, headers: { 'Cache-Control': 'no-store' } };
  }

  // `from` (required) is the status the reviewer saw: if the card has changed since, 409.
  function updateStatus(id: string, status: CardStatus, from: unknown): MockResponse {
    if (from !== 'pending' && from !== 'approved' && from !== 'hidden') {
      return error(400, 'VALIDATION_ERROR', 'from must be pending, approved or hidden', { fields: { from: from === undefined ? 'required' : 'invalid' } });
    }
    const card = cards.find((c) => c.id === id);
    if (!card) return error(404, 'NOT_FOUND', 'Card not found');
    if (card.status !== from) {
      return error(409, 'CARD_STATUS_CHANGED', 'The card was changed by someone else', { current_status: card.status });
    }
    card.status = status;
    return { status: 200, body: { success: true, card_id: card.id, status: card.status }, headers: { 'Cache-Control': 'no-store' } };
  }

  async function handle(
    method: string,
    rawUrl: string,
    headers: Headers,
    bodyText: string,
    sendsCookies = false,
  ): Promise<MockResponse> {
    const url = new URL(rawUrl, 'https://mock.invalid');
    const path = url.pathname.replace(/\/+$/, '');

    if (path === '/api/client-token') {
      if (method === 'POST') return issueClientToken(sendsCookies);
      return error(405, 'METHOD_NOT_ALLOWED', 'Method not allowed');
    }

    if (path === '/api/cards') {
      if (method === 'POST') return submitCard(bodyText, sendsCookies);
      if (method === 'GET') return listPublic(url.searchParams);
      return error(405, 'METHOD_NOT_ALLOWED', 'Method not allowed');
    }

    if (path.startsWith('/api/admin/')) {
      if (!authorized(headers)) return error(401, 'UNAUTHORIZED', 'Missing or invalid admin token');

      if (path === '/api/admin/cards' && method === 'GET') return listAdmin(url.searchParams);

      const match = /^\/api\/admin\/cards\/([^/]+)\/(status|hide)$/.exec(path);
      if (match && method === 'PATCH') {
        const id = decodeURIComponent(match[1] ?? '');
        if (!ID_PATTERN.test(id)) return error(400, 'VALIDATION_ERROR', 'Invalid card id');
        // Like the backend: a body that is not a JSON object reads as {}.
        let body: { status?: unknown; from?: unknown } = {};
        try {
          const parsed: unknown = JSON.parse(bodyText);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) body = parsed as { status?: unknown; from?: unknown };
        } catch {
          // stays {}
        }
        if (match[2] === 'hide') return updateStatus(id, 'hidden', body.from);
        const next = body.status;
        if (next !== 'approved' && next !== 'hidden') {
          return error(400, 'VALIDATION_ERROR', 'status must be approved or hidden', { fields: { status: 'invalid' } });
        }
        return updateStatus(id, next, body.from);
      }
    }

    return error(404, 'NOT_FOUND', 'Not found');
  }

  return { handle, cards };
}

export interface MockFetchOptions extends MockServerOptions {
  /** [min, max] simulated latency in ms, so loading states are visible. */
  latency?: [number, number];
}

export function createMockFetch(options: MockFetchOptions = {}): FetchLike {
  const server = createMockServer(options);
  const [min, max] = options.latency ?? [350, 850];

  return async (input, init = {}) => {
    const wait = min + Math.random() * Math.max(0, max - min);
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, wait);
      init.signal?.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(new DOMException('Aborted', 'AbortError'));
        },
        { once: true },
      );
    });
    const body = typeof init.body === 'string' ? init.body : '';
    const sendsCookies = init.credentials === 'same-origin' || init.credentials === 'include';
    const result = await server.handle(init.method ?? 'GET', input, new Headers(init.headers), body, sendsCookies);
    return new Response(result.status === 204 ? null : JSON.stringify(result.body), {
      status: result.status,
      headers: { 'Content-Type': 'application/json; charset=utf-8', ...result.headers },
    });
  };
}
