import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { config } from '../config/env';
import { initAnalytics } from './analytics';
import { prefersReducedMotion } from './hooks';
import '../styles/tokens.css';
import '../styles/base.css';

/** Shared entry for every page: motion flag, analytics, then render. */
export function boot(app: ReactNode): void {
  const root = document.documentElement;
  const syncMotion = () => root.classList.toggle('motion-ok', !prefersReducedMotion());
  syncMotion();
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', syncMotion);

  initAnalytics(config.ga4MeasurementId);

  const container = document.getElementById('root');
  if (!container) throw new Error('#root is missing');
  createRoot(container).render(<StrictMode>{app}</StrictMode>);
}
