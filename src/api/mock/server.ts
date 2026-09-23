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

const RATE_PER_MINUTE = 1;
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
  // One simulated client, so the limiter state is a single pair of buckets.
  const rate = { minuteBucket: -1, minuteCount: 0, hourBucket: -1, hourCount: 0 };

  function authorized(headers: Headers): boolean {
    const match = /^Bearer (.+)$/.exec(headers.get('Authorization') ?? '');
    return !!match && (match[1] ?? '').length >= ADMIN_TOKEN_MIN_LENGTH;
  }

  function submitCard(bodyText: string): MockResponse {
    if (new TextEncoder().encode(bodyText).length > MAX_BODY_BYTES) {
      return error(413, 'PAYLOAD_TOO_LARGE', 'Request body exceeds 4 KiB');
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
    const minute = Math.floor(t / 60000);
    const hour = Math.floor(t / 3600000);
    if (rate.minuteBucket !== minute) {
      rate.minuteBucket = minute;
      rate.minuteCount = 0;
    }
    if (rate.hourBucket !== hour) {
      rate.hourBucket = hour;
      rate.hourCount = 0;
    }
    if (rate.hourCount >= RATE_PER_HOUR) {
      return error(429, 'RATE_LIMITED', 'Too many submissions', {
        retry_after_seconds: Math.ceil(((hour + 1) * 3600000 - t) / 1000),
      });
    }
    if (rate.minuteCount >= RATE_PER_MINUTE) {
      return error(429, 'RATE_LIMITED', 'Too many submissions', {
        retry_after_seconds: Math.ceil(((minute + 1) * 60000 - t) / 1000),
      });
    }
    rate.minuteCount++;
    rate.hourCount++;

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
      headers: { 'Cache-Control': 'public, max-age=15' },
    };
  }

  function listAdmin(params: URLSearchParams): MockResponse {
    const status = params.get('status');
    if (status !== 'pending' && status !== 'approved' && status !== 'hidden') {
      return error(400, 'VALIDATION_ERROR', 'status must be pending, approved or hidden');
    }
    const matching = cards.filter((c) => c.status === status).sort(newestFirst);
    const items: AdminCard[] = matching.slice(0, ADMIN_LIST_LIMIT).map((c) => ({ ...toPublic(c), status: c.status }));
    return { status: 200, body: { items, has_more: matching.length > ADMIN_LIST_LIMIT }, headers: { 'Cache-Control': 'no-store' } };
  }

  function updateStatus(id: string, status: CardStatus): MockResponse {
    const card = cards.find((c) => c.id === id);
    if (!card) return error(404, 'NOT_FOUND', 'Card not found');
    card.status = status;
    return { status: 200, body: { success: true, card_id: card.id, status: card.status }, headers: { 'Cache-Control': 'no-store' } };
  }

  async function handle(method: string, rawUrl: string, headers: Headers, bodyText: string): Promise<MockResponse> {
    const url = new URL(rawUrl, 'https://mock.invalid');
    const path = url.pathname.replace(/\/+$/, '');

    if (path === '/api/cards') {
      if (method === 'POST') return submitCard(bodyText);
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
        if (match[2] === 'hide') return updateStatus(id, 'hidden');
        let next: unknown;
        try {
          next = (JSON.parse(bodyText || '{}') as { status?: unknown }).status;
        } catch {
          next = undefined;
        }
        if (next !== 'approved' && next !== 'hidden') {
          return error(400, 'VALIDATION_ERROR', 'status must be approved or hidden', { fields: { status: 'invalid' } });
        }
        return updateStatus(id, next);
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
    const result = await server.handle(init.method ?? 'GET', input, new Headers(init.headers), body);
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { 'Content-Type': 'application/json; charset=utf-8', ...result.headers },
    });
  };
}
