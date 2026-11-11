import { ADMIN_TOKEN_MIN_LENGTH } from '../api/types';

/**
 * Where the review console keeps its key between reloads (#67): this tab's sessionStorage, for at
 * most 12 hours from sign-in, so a phone that reloads the page in the background does not ask for
 * the key again. 登出, a 401, leaving the admin page for another page of the site, closing the tab
 * or 12 hours clear it. Never localStorage, the URL or logs.
 *
 * Any script of this origin can read sessionStorage, so the admin page loads no third-party script
 * (its own CSP in public/_headers, no GA4 in boot), and every other page drops the key before its
 * own third-party scripts load (keepAdminSessionOffThisPage).
 */
export const ADMIN_SESSION_KEY = 'fwd-admin-session';
export const ADMIN_SESSION_MS = 12 * 60 * 60 * 1000;

export interface AdminSession {
  token: string;
  /** Date.now() at sign-in. The session ends ADMIN_SESSION_MS later and is never extended. */
  signedInAt: number;
}

export type SessionStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** This tab's sessionStorage, or null where the browser blocks it: the key then lives in memory only, as before #67. */
function tabStorage(): SessionStore | null {
  try {
    return globalThis.sessionStorage ?? null;
  } catch {
    return null;
  }
}

export function sessionExpiresAt(session: AdminSession): number {
  return session.signedInAt + ADMIN_SESSION_MS;
}

export function saveAdminSession(session: AdminSession, store = tabStorage()): void {
  try {
    store?.setItem(ADMIN_SESSION_KEY, JSON.stringify({ token: session.token, signedInAt: session.signedInAt }));
  } catch {
    // Storage full or blocked: the key stays in memory only, as before #67.
  }
}

export function forgetAdminSession(store = tabStorage()): void {
  try {
    store?.removeItem(ADMIN_SESSION_KEY);
  } catch {
    // Storage blocked: nothing was saved there either.
  }
}

/**
 * The session saved in this tab, while it is within 12 hours of sign-in. Anything else under the
 * key (expired, unreadable, a sign-in time in the future after the clock moved back) is removed.
 * `expired` tells the lock screen to say why the key is asked for again.
 */
export function restoreAdminSession(now = Date.now(), store = tabStorage()): { session: AdminSession | null; expired: boolean } {
  let raw: string | null;
  try {
    raw = store?.getItem(ADMIN_SESSION_KEY) ?? null;
  } catch {
    return { session: null, expired: false };
  }
  if (raw === null) return { session: null, expired: false };
  const session = parse(raw);
  if (session && now >= session.signedInAt && now < sessionExpiresAt(session)) return { session, expired: false };
  forgetAdminSession(store);
  return { session: null, expired: session !== null && now >= sessionExpiresAt(session) };
}

function parse(raw: string): AdminSession | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== 'object' || value === null) return null;
  const { token, signedInAt } = value as Record<string, unknown>;
  if (typeof token !== 'string' || token.length < ADMIN_TOKEN_MIN_LENGTH) return null;
  if (typeof signedInAt !== 'number' || !Number.isFinite(signedInAt)) return null;
  return { token, signedInAt };
}

/**
 * Every page but the admin page: drop the review key before this page loads GA4, Turnstile or
 * YouTube, and again each time the browser shows the page, including a return through the
 * back/forward cache, where this page's scripts are already running.
 */
export function keepAdminSessionOffThisPage(target: Pick<EventTarget, 'addEventListener'> = window, store = tabStorage()): void {
  forgetAdminSession(store);
  target.addEventListener('pageshow', () => forgetAdminSession(store));
}
