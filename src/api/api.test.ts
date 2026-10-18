import { describe, expect, it } from 'vitest';
import { ApiError, createApiClient, describeError, type FetchLike } from './client';
import { createMockFetch } from './mock/server';
import { createSeedCards } from './mock/seed';
import type { SubmitCardRequest } from './types';

const ADMIN_TOKEN = 'x'.repeat(32);

function setup(start = Date.parse('2026-11-14T12:00:00Z')) {
  let now = start;
  const seed = createSeedCards(now);
  const client = createApiClient({ baseUrl: '', fetch: createMockFetch({ now: () => now, seed, latency: [0, 0] }) });
  return {
    client,
    seed,
    advance: (ms: number) => {
      now += ms;
    },
  };
}

const valid: SubmitCardRequest = {
  nickname: '  小恩  ',
  text_gratitude: '感謝神這一年的帶領',
  text_anticipate: '期待更多',
  agreed_to_publish: true,
  honeypot: '',
};

async function expectError(promise: Promise<unknown>, status: number, code: string) {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ApiError);
  expect((error as ApiError).status).toBe(status);
  expect((error as ApiError).code).toBe(code);
  return error as ApiError;
}

describe('GET /api/cards', () => {
  it('returns approved cards newest-first, 12 per page', async () => {
    const { client } = setup();
    const first = await client.listCards({ page: 1, limit: 12 });
    expect(first.items).toHaveLength(12);
    expect(first.pagination).toEqual({ page: 1, limit: 12, has_more: true, total_count: 50 });
    const times = first.items.map((c) => c.created_at);
    expect([...times].sort().reverse()).toEqual(times);

    const last = await client.listCards({ page: 5, limit: 12 });
    expect(last.items).toHaveLength(2);
    expect(last.pagination.has_more).toBe(false);
  });

  it('never leaks status or non-approved cards', async () => {
    const { client } = setup();
    const page = await client.listCards({ page: 1, limit: 12 });
    for (const card of page.items) {
      expect(Object.keys(card).sort()).toEqual(['created_at', 'id', 'nickname', 'text_anticipate', 'text_gratitude']);
      expect(card.id.startsWith('seed_p') || card.id.startsWith('seed_h')).toBe(false);
    }
  });

  it('rejects limits above 12', async () => {
    const { client } = setup();
    await expectError(client.listCards({ page: 1, limit: 50 }), 400, 'VALIDATION_ERROR');
  });
});

describe('POST /api/cards', () => {
  it('stores a trimmed pending card that stays off the public wall', async () => {
    const { client, seed } = setup();
    const res = await client.submitCard(valid);
    expect(res.success).toBe(true);
    expect(res.card_id).toMatch(/^c_[0-9a-f-]{36}$/);
    const stored = seed.find((c) => c.id === res.card_id);
    expect(stored).toMatchObject({ nickname: '小恩', status: 'pending' });

    const page = await client.listCards({ page: 1, limit: 12 });
    expect(page.items.some((c) => c.id === res.card_id)).toBe(false);
    expect(page.pagination.total_count).toBe(50);
  });

  it('returns field errors for bad input', async () => {
    const { client } = setup();
    const error = await expectError(
      client.submitCard({ ...valid, nickname: '', text_gratitude: '謝'.repeat(141), agreed_to_publish: false as true }),
      400,
      'VALIDATION_ERROR',
    );
    expect(error.fields).toEqual({ nickname: 'required', text_gratitude: 'too_long', agreed_to_publish: 'must_be_true' });
    expect(describeError(error)).toBe('格式錯誤，請檢查欄位內容後再送出。');
  });

  it('silently discards honeypot hits without using the rate limit', async () => {
    const { client, seed } = setup();
    const before = seed.length;
    const res = await client.submitCard({ ...valid, honeypot: 'http://spam.example' });
    expect(res.success).toBe(true);
    expect(seed.length).toBe(before);
    await expect(client.submitCard(valid)).resolves.toMatchObject({ success: true });
  });

  it('allows a card 60 seconds after the previous one and 3 per hour, with Retry-After', async () => {
    const { client, advance } = setup();
    await client.submitCard(valid);
    const tooSoon = await expectError(client.submitCard(valid), 429, 'RATE_LIMITED');
    expect(tooSoon.retryAfterSeconds).toBe(60);
    expect(describeError(tooSoon)).toBe('發送太頻繁，請稍後再試。');

    advance(61_000);
    await client.submitCard(valid);
    advance(61_000);
    await client.submitCard(valid);
    advance(61_000);
    const hourly = await expectError(client.submitCard(valid), 429, 'RATE_LIMITED');
    expect(hourly.retryAfterSeconds).toBeGreaterThan(60);
  });
});

describe('Client Token', () => {
  const invalidToken = { success: false, error: { code: 'CLIENT_TOKEN_INVALID', message: 'Missing, expired or invalid client token' } };

  // A fetch that answers with the given [status, body] pairs in order and records each request.
  function scripted(...responses: Array<[number, unknown?]>) {
    const calls: Array<{ path: string; body?: string }> = [];
    const fetch: FetchLike = async (input, init = {}) => {
      calls.push({ path: input, body: init.body as string | undefined });
      const [status, body] = responses.shift() ?? [500];
      return new Response(status === 204 ? null : JSON.stringify(body ?? {}), { status });
    };
    return { client: createApiClient({ baseUrl: '', fetch }), calls };
  }

  it('gets a Client Token before each card; only those two requests carry cookies', async () => {
    const seed = createSeedCards(Date.parse('2026-11-14T12:00:00Z'));
    const mock = createMockFetch({ seed, latency: [0, 0] });
    const calls: string[] = [];
    const client = createApiClient({
      baseUrl: '',
      fetch: (input, init) => {
        calls.push(`${init?.method} ${input.split('?')[0]} ${init?.credentials}`);
        return mock(input, init);
      },
    });

    await client.listCards({ page: 1, limit: 12 });
    await client.submitCard(valid);
    await client.adminListCards(ADMIN_TOKEN, 'pending');

    expect(calls).toEqual([
      'GET /api/cards omit',
      'POST /api/client-token same-origin',
      'POST /api/cards same-origin',
      'GET /api/admin/cards omit',
    ]);
  });

  it('the mock refuses a card sent without the token cookie, like the server', async () => {
    const mock = createMockFetch({ seed: [], latency: [0, 0] });
    const send = (credentials: RequestCredentials) =>
      mock('/api/cards', { method: 'POST', body: JSON.stringify(valid), credentials }).then((r) => r.status);

    expect(await send('same-origin')).toBe(401);
    await mock('/api/client-token', { method: 'POST', credentials: 'same-origin' });
    expect(await send('omit')).toBe(401);
    expect(await send('same-origin')).toBe(201);
  });

  it('a page reload keeps the token, so it does not reset the quota', async () => {
    const mock = createMockFetch({ seed: [], latency: [0, 0] });
    await createApiClient({ baseUrl: '', fetch: mock }).submitCard(valid);
    const afterReload = createApiClient({ baseUrl: '', fetch: mock });
    await expectError(afterReload.submitCard(valid), 429, 'RATE_LIMITED');
  });

  it('after the 2-hour expiry, the next card simply gets a new token', async () => {
    const { client, advance } = setup();
    await client.submitCard(valid);
    advance(7200_000 + 1000);
    await expect(client.submitCard(valid)).resolves.toMatchObject({ success: true });
  });

  it('when the token is refused, gets a new one and resends the same card once', async () => {
    const { client, calls } = scripted([204], [401, invalidToken], [204], [201, { success: true, card_id: 'c_x' }]);

    await expect(client.submitCard(valid)).resolves.toEqual({ success: true, card_id: 'c_x' });

    expect(calls.map((c) => c.path)).toEqual(['/api/client-token', '/api/cards', '/api/client-token', '/api/cards']);
    expect(calls[3]?.body).toBe(calls[1]?.body);
  });

  it('gives up after that one retry and asks the visitor to allow cookies', async () => {
    const { client, calls } = scripted([204], [401, invalidToken], [204], [401, invalidToken]);

    const error = await expectError(client.submitCard(valid), 401, 'CLIENT_TOKEN_INVALID');

    expect(calls).toHaveLength(4);
    expect(describeError(error)).toBe('無法完成送出驗證，請確認瀏覽器允許 Cookie 後再試一次。');
  });

  it('does not send the card when no token can be had, and does not retry other errors', async () => {
    const limited = { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests', retry_after_seconds: 30 } };
    const noToken = scripted([429, limited]);
    const tooSoon = await expectError(noToken.client.submitCard(valid), 429, 'RATE_LIMITED');
    expect(tooSoon.retryAfterSeconds).toBe(30);
    expect(noToken.calls).toHaveLength(1);

    const fieldError = { success: false, error: { code: 'VALIDATION_ERROR', message: 'x', fields: { nickname: 'required' } } };
    const invalid = scripted([204], [400, fieldError]);
    await expectError(invalid.client.submitCard(valid), 400, 'VALIDATION_ERROR');
    expect(invalid.calls).toHaveLength(2);
  });
});

describe('admin API', () => {
  it('requires a bearer token of at least 32 characters', async () => {
    const { client } = setup();
    await expectError(client.adminListCards('short', 'pending'), 401, 'UNAUTHORIZED');
  });

  it('approves a pending card so it appears publicly, and hides it again', async () => {
    const { client } = setup();
    const pending = await client.adminListCards(ADMIN_TOKEN, 'pending');
    expect(pending.items.length).toBeGreaterThan(0);
    expect(pending.items.every((c) => c.status === 'pending')).toBe(true);
    const target = pending.items[0]!;

    await expect(client.adminSetStatus(ADMIN_TOKEN, target.id, 'approved')).resolves.toEqual({
      success: true,
      card_id: target.id,
      status: 'approved',
    });
    const wall = await client.listCards({ page: 1, limit: 12 });
    expect(wall.items[0]?.id).toBe(target.id);

    await client.adminHide(ADMIN_TOKEN, target.id);
    const after = await client.listCards({ page: 1, limit: 12 });
    expect(after.items.some((c) => c.id === target.id)).toBe(false);
  });

  it('404s on unknown ids', async () => {
    const { client } = setup();
    await expectError(client.adminHide(ADMIN_TOKEN, 'c_missing'), 404, 'NOT_FOUND');
  });
});
