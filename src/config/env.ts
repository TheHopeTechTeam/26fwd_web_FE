export type ApiMode = 'mock' | 'live';

export interface AppConfig {
  apiMode: ApiMode;
  /** Backend origin for live mode; '' means same origin. */
  apiBaseUrl: string;
  /** Official giving page. null keeps every Give CTA safely disabled. */
  giveUrl: string | null;
  ga4MeasurementId: string | null;
  turnstileSiteKey: string | null;
  prayerMapUrl: string;
  prayerMapPrivacyUrl: string;
  /** Only flip on once the Prayer Map host allows this origin to frame it. */
  prayerMapEmbedEnabled: boolean;
  showPreviewBadge: boolean;
}

type Env = Record<string, string | boolean | undefined>;

export const DEFAULT_PRAYER_MAP_URL = 'https://prayer-map-omega.vercel.app/';

/** Accepts only absolute https URLs; anything else is treated as "not configured". */
export function parseHttpsUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function str(env: Env, key: string): string {
  const v = env[key];
  return typeof v === 'string' ? v.trim() : '';
}

function flag(env: Env, key: string, fallback: boolean): boolean {
  const v = str(env, key).toLowerCase();
  if (v === 'true' || v === '1') return true;
  if (v === 'false' || v === '0') return false;
  return fallback;
}

export function readConfig(env: Env): AppConfig {
  const prayerMapUrl = parseHttpsUrl(str(env, 'VITE_PRAYER_MAP_URL')) ?? DEFAULT_PRAYER_MAP_URL;
  const ga4 = str(env, 'VITE_GA4_MEASUREMENT_ID');
  const apiBase = str(env, 'VITE_API_BASE_URL').replace(/\/+$/, '');

  return {
    apiMode: str(env, 'VITE_API_MODE') === 'live' ? 'live' : 'mock',
    apiBaseUrl: apiBase === '' || parseHttpsUrl(apiBase) || apiBase.startsWith('http://localhost') ? apiBase : '',
    giveUrl: parseHttpsUrl(str(env, 'VITE_GIVE_URL')),
    ga4MeasurementId: /^G-[A-Z0-9]{4,}$/.test(ga4) ? ga4 : null,
    turnstileSiteKey: str(env, 'VITE_TURNSTILE_SITE_KEY') || null,
    prayerMapUrl,
    prayerMapPrivacyUrl: new URL('privacy', prayerMapUrl).toString(),
    prayerMapEmbedEnabled: flag(env, 'VITE_PRAYER_MAP_EMBED_ENABLED', false),
    showPreviewBadge: flag(env, 'VITE_SHOW_PREVIEW_BADGE', true),
  };
}

export const config: AppConfig = readConfig(import.meta.env as unknown as Env);

/** Resolve a path under /public against the deploy base (GitHub Pages serves under /<repo>/). */
export function asset(path: string): string {
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) return path;
  return import.meta.env.BASE_URL + path.replace(/^\/+/, '');
}

/** Internal page link, e.g. pageUrl('cards/') or pageUrl('#respond'). */
export function pageUrl(path = ''): string {
  return import.meta.env.BASE_URL + path.replace(/^\/+/, '');
}
