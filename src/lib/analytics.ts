declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let started = false;

/**
 * Loads GA4 only when a valid Measurement ID is configured (DATA-24). Without one,
 * no Google script is requested at all.
 */
export function initAnalytics(measurementId: string | null): void {
  if (started || !measurementId || typeof document === 'undefined') return;
  started = true;
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag() {
    // gtag.js expects the arguments object itself, not an array copy.
    window.dataLayer?.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
}

/** Event names only — no nickname, card text or any other custom payload. */
// create_card counts FORWARD 卡 sent from the form. Every card is shared since 11/04, so it
// matches the cards the server received; it carries no content.
export type TrackedEvent = 'click_give_cta' | 'create_card';

export function trackEvent(name: TrackedEvent): void {
  window.gtag?.('event', name);
}
