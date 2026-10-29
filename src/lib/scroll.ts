import type { MouseEvent } from 'react';
import { prefersReducedMotion } from './hooks';

/** In-page chapter link: smooth-scroll (unless reduced motion), keep the hash, move focus. */
export function jumpToSection(event: MouseEvent<HTMLAnchorElement>, id: string): void {
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  history.replaceState(null, '', `#${id}`);
  // Move focus for keyboard and screen-reader users without a second scroll.
  target.focus({ preventScroll: true });
}
