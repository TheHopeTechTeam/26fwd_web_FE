import { config } from '../config/env';
import { createApiClient, type FetchLike } from './client';

// The mock server (and its synthetic seed data) is a separate chunk that is only
// fetched when VITE_API_MODE=mock, so the live build never downloads it.
let mockFetch: Promise<FetchLike> | null = null;
const viaMock: FetchLike = async (input, init) => {
  mockFetch ??= import('./mock/server').then((m) => m.createMockFetch());
  return (await mockFetch)(input, init);
};

export const api = createApiClient({
  baseUrl: config.apiMode === 'live' ? config.apiBaseUrl : '',
  fetch: config.apiMode === 'live' ? (input, init) => fetch(input, init) : viaMock,
});

export { ApiError, describeError } from './client';
export * from './types';
