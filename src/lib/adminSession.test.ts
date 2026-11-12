import { describe, expect, it } from 'vitest';
import {
  ADMIN_SESSION_KEY,
  ADMIN_SESSION_MS,
  forgetAdminSession,
  keepAdminSessionOffThisPage,
  restoreAdminSession,
  saveAdminSession,
  type SessionStore,
} from './adminSession';

const TOKEN = 'k'.repeat(40);
const SIGNED_IN = Date.UTC(2026, 10, 12, 1, 0, 0);

// A sessionStorage stand-in that records every key it is asked to write.
function memoryStore(entries: Record<string, string> = {}) {
  const data = new Map(Object.entries(entries));
  const written = new Set<string>();
  const store: SessionStore = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      written.add(key);
      data.set(key, String(value));
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
  return { store, data, written };
}

const stored = (token: unknown, signedInAt: unknown) => ({ [ADMIN_SESSION_KEY]: JSON.stringify({ token, signedInAt }) });

describe('admin session (#67)', () => {
  it('keeps the key across a reload for 12 hours from sign-in, under its one key only', () => {
    const { store, data, written } = memoryStore();
    saveAdminSession({ token: TOKEN, signedInAt: SIGNED_IN }, store);
    expect([...written]).toEqual([ADMIN_SESSION_KEY]);
    expect(JSON.parse(data.get(ADMIN_SESSION_KEY) ?? '')).toEqual({ token: TOKEN, signedInAt: SIGNED_IN });

    for (const later of [0, 1, ADMIN_SESSION_MS - 1]) {
      expect(restoreAdminSession(SIGNED_IN + later, store)).toEqual({ session: { token: TOKEN, signedInAt: SIGNED_IN }, expired: false });
    }
    // Restoring does not extend the session.
    expect(JSON.parse(data.get(ADMIN_SESSION_KEY) ?? '').signedInAt).toBe(SIGNED_IN);
  });

  it('drops the key at 12 hours and says it expired', () => {
    for (const later of [ADMIN_SESSION_MS, ADMIN_SESSION_MS + 1, 30 * 24 * 60 * 60 * 1000]) {
      const { store, data } = memoryStore(stored(TOKEN, SIGNED_IN));
      expect(restoreAdminSession(SIGNED_IN + later, store)).toEqual({ session: null, expired: true });
      expect(data.has(ADMIN_SESSION_KEY)).toBe(false);
    }
  });

  it('drops anything else under the key without calling it expired', () => {
    const bad: Array<Record<string, string>> = [
      { [ADMIN_SESSION_KEY]: 'not json' },
      { [ADMIN_SESSION_KEY]: 'null' },
      { [ADMIN_SESSION_KEY]: JSON.stringify(TOKEN) },
      stored('k'.repeat(31), SIGNED_IN), // shorter than any admin key
      stored(42, SIGNED_IN),
      stored(TOKEN, String(SIGNED_IN)),
      stored(TOKEN, null),
      stored(TOKEN, SIGNED_IN + 60_000), // signed in "later": the clock moved back
    ];
    for (const entries of bad) {
      const { store, data } = memoryStore(entries);
      expect(restoreAdminSession(SIGNED_IN, store)).toEqual({ session: null, expired: false });
      expect(data.has(ADMIN_SESSION_KEY)).toBe(false);
    }
  });

  it('signs nobody in when nothing is stored, and forgets on request', () => {
    const { store, data } = memoryStore({ other: 'kept' });
    expect(restoreAdminSession(SIGNED_IN, store)).toEqual({ session: null, expired: false });
    saveAdminSession({ token: TOKEN, signedInAt: SIGNED_IN }, store);
    forgetAdminSession(store);
    expect(data.has(ADMIN_SESSION_KEY)).toBe(false);
    expect(data.get('other')).toBe('kept');
  });

  it('falls back to memory only when the browser blocks storage', () => {
    const blocked: SessionStore = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {
        throw new Error('SecurityError');
      },
    };
    for (const store of [blocked, null]) {
      expect(() => saveAdminSession({ token: TOKEN, signedInAt: SIGNED_IN }, store)).not.toThrow();
      expect(() => forgetAdminSession(store)).not.toThrow();
      expect(restoreAdminSession(SIGNED_IN, store)).toEqual({ session: null, expired: false });
    }
  });

  it('every other page drops the key at once and each time it is shown again', () => {
    const { store, data } = memoryStore(stored(TOKEN, SIGNED_IN));
    const page = new EventTarget();
    keepAdminSessionOffThisPage(page, store);
    expect(data.has(ADMIN_SESSION_KEY)).toBe(false);

    // The admin page stored it again; this page comes back from the back/forward cache.
    saveAdminSession({ token: TOKEN, signedInAt: SIGNED_IN }, store);
    page.dispatchEvent(new Event('pageshow'));
    expect(data.has(ADMIN_SESSION_KEY)).toBe(false);
  });
});
