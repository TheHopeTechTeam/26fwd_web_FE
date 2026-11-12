import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { config } from '../config/env';
import { keepAdminSessionOffThisPage } from './adminSession';
import { initAnalytics } from './analytics';
import { prefersReducedMotion } from './hooks';
import '../styles/body-font.css';
import '../styles/tokens.css';
import '../styles/base.css';

/**
 * Shared entry for every page: the review key, motion flag, analytics, then render. Only the admin
 * page passes `admin: true` (#67): it keeps the review key and loads no GA4. Every other page drops
 * the key first, before any third-party script can load.
 */
export function boot(app: ReactNode, { admin = false }: { admin?: boolean } = {}): void {
  if (!admin) keepAdminSessionOffThisPage();

  const root = document.documentElement;
  const syncMotion = () => root.classList.toggle('motion-ok', !prefersReducedMotion());
  syncMotion();
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', syncMotion);

  // The admin page's CSP allows no third-party script either (public/_headers).
  if (!admin) initAnalytics(config.ga4MeasurementId);

  const container = document.getElementById('root');
  if (!container) throw new Error('#root is missing');
  createRoot(container).render(<StrictMode>{app}</StrictMode>);

  // Review aids (separate chunk, off otherwise): `?ids=1` tags text and images with their sheet
  // 編號; `?review=1` also lists the sheet wording the page does not show yet.
  const query = new URLSearchParams(location.search);
  if (query.has('ids') || query.has('review')) void import('./idOverlay');
}
