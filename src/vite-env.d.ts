/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_MODE?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_GIVE_URL?: string;
  readonly VITE_GA4_MEASUREMENT_ID?: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
  readonly VITE_PRAYER_MAP_URL?: string;
  readonly VITE_PRAYER_MAP_EMBED_ENABLED?: string;
  readonly VITE_SHOW_PREVIEW_BADGE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
