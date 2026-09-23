import type {
  AdminListResponse,
  AdminStatusResponse,
  ApiErrorBody,
  ApiErrorCode,
  CardStatus,
  ListCardsResponse,
  SubmitCardRequest,
  SubmitCardResponse,
} from './types';

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type ClientErrorCode = ApiErrorCode | 'NETWORK_ERROR' | 'TIMEOUT' | 'BAD_RESPONSE';

export class ApiError extends Error {
  readonly status: number;
  readonly code: ClientErrorCode;
  readonly fields?: Record<string, string>;
  readonly retryAfterSeconds?: number;

  constructor(
    status: number,
    code: ClientErrorCode,
    message: string,
    extra: { fields?: Record<string, string>; retryAfterSeconds?: number } = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = extra.fields;
    this.retryAfterSeconds = extra.retryAfterSeconds;
  }
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  if (!value || typeof value !== 'object') return false;
  const error = (value as { error?: unknown }).error;
  return !!error && typeof error === 'object' && typeof (error as { code?: unknown }).code === 'string';
}

function codeForStatus(status: number): ClientErrorCode {
  if (status === 400) return 'VALIDATION_ERROR';
  if (status === 401 || status === 403) return 'UNAUTHORIZED';
  if (status === 404) return 'NOT_FOUND';
  if (status === 413) return 'PAYLOAD_TOO_LARGE';
  if (status === 429) return 'RATE_LIMITED';
  if (status === 503) return 'SERVICE_UNAVAILABLE';
  return 'INTERNAL_ERROR';
}

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
}

interface RequestOptions {
  query?: Record<string, string>;
  body?: unknown;
  token?: string;
  signal?: AbortSignal;
}

export interface ClientOptions {
  baseUrl: string;
  fetch: FetchLike;
  timeoutMs?: number;
}

export function createApiClient({ baseUrl, fetch: fetchImpl, timeoutMs = 15000 }: ClientOptions) {
  const root = baseUrl.replace(/\/+$/, '');

  async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
    const { query, body, token, signal } = options;
    const url = root + path + (query ? `?${new URLSearchParams(query).toString()}` : '');
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    const forwardAbort = () => controller.abort();
    signal?.addEventListener('abort', forwardAbort, { once: true });

    let response: Response;
    try {
      response = await fetchImpl(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
        credentials: 'omit',
        cache: token ? 'no-store' : 'default',
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      if (timedOut) throw new ApiError(0, 'TIMEOUT', 'Request timed out');
      throw new ApiError(0, 'NETWORK_ERROR', 'Network request failed');
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', forwardAbort);
    }

    const text = await response.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      const err = isErrorBody(data) ? data.error : null;
      throw new ApiError(response.status, err?.code ?? codeForStatus(response.status), err?.message ?? response.statusText, {
        fields: err?.fields,
        retryAfterSeconds: err?.retry_after_seconds ?? parseRetryAfter(response.headers.get('Retry-After')),
      });
    }
    if (data === null || typeof data !== 'object') {
      throw new ApiError(response.status, 'BAD_RESPONSE', 'Response was not JSON');
    }
    return data as T;
  }

  return {
    submitCard(payload: SubmitCardRequest, signal?: AbortSignal) {
      return request<SubmitCardResponse>('POST', '/api/cards', { body: payload, signal });
    },
    async listCards(params: { page: number; limit: number }, signal?: AbortSignal) {
      const data = await request<ListCardsResponse>('GET', '/api/cards', {
        query: { page: String(params.page), limit: String(params.limit) },
        signal,
      });
      if (!Array.isArray(data.items) || !data.pagination) {
        throw new ApiError(200, 'BAD_RESPONSE', 'Unexpected card list shape');
      }
      return data;
    },
    adminListCards(token: string, status: CardStatus, signal?: AbortSignal) {
      return request<AdminListResponse>('GET', '/api/admin/cards', { query: { status }, token, signal });
    },
    adminSetStatus(token: string, id: string, status: Exclude<CardStatus, 'pending'>) {
      return request<AdminStatusResponse>('PATCH', `/api/admin/cards/${encodeURIComponent(id)}/status`, {
        body: { status },
        token,
      });
    },
    adminHide(token: string, id: string) {
      return request<AdminStatusResponse>('PATCH', `/api/admin/cards/${encodeURIComponent(id)}/hide`, { token });
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

/**
 * Visitor-facing wording. Deliberately generic: validation and moderation rules are
 * never echoed back (US-16), only what the person can do next.
 */
export function describeError(error: unknown): string {
  if (!(error instanceof ApiError)) return '發生未預期的錯誤，請稍後再試。';
  switch (error.code) {
    case 'RATE_LIMITED':
      return '發送太頻繁，請稍後再試。';
    case 'VALIDATION_ERROR':
    case 'PAYLOAD_TOO_LARGE':
      return '格式錯誤，請檢查欄位內容後再送出。';
    case 'TURNSTILE_FAILED':
      return '人機驗證未通過，請重新驗證後再送出。';
    case 'UNAUTHORIZED':
      return '驗證失敗，請重新輸入管理金鑰。';
    case 'NETWORK_ERROR':
    case 'TIMEOUT':
      return '網路連線不穩定，請確認網路後再試一次。';
    case 'SERVICE_UNAVAILABLE':
      return '服務暫時無法使用，請稍後再試。';
    default:
      return '系統暫時發生問題，請稍後再試。';
  }
}
