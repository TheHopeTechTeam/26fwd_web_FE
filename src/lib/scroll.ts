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

/** Sent when the rail's 我要參與奉獻 stop is used, so the phone layout shows the Give side (11/08). */
export const SHOW_GIVE_EVENT = 'fwd:show-give';
/** Sent by the 填寫 FORWARD 卡 links (header nav, rail), so the phone layout shows the card (11/08). */
export const SHOW_CARD_EVENT = 'fwd:show-card';
