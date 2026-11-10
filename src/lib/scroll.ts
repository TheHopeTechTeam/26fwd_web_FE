import type { MouseEvent } from 'react';
import { prefersReducedMotion } from './hooks';

/** Below 900px 第三步 shows one side at a time, under two buttons (Respond.css). */
export const ONE_SIDE_QUERY = '(max-width: 899px)';

/**
 * Where a jump to `id` lands. On phones the FORWARD 卡 sits right under the 我要參與奉獻 /
 * 我要填寫線上 FORWARD 卡 buttons, so a jump to the card stops at those buttons and keeps them in
 * view (11/10).
 */
export function landingFor(id: string): HTMLElement | null {
  const target = document.getElementById(id);
  if (id === 'respond-part-card' && window.matchMedia?.(ONE_SIDE_QUERY).matches) {
    return target?.closest<HTMLElement>('.respond-actions') ?? target;
  }
  return target;
}

/** In-page chapter link: smooth-scroll (unless reduced motion), keep the hash, move focus. */
export function jumpToSection(event: MouseEvent<HTMLAnchorElement>, id: string): void {
  const target = landingFor(id);
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  history.replaceState(null, '', `#${id}`);
  // Move focus for keyboard and screen-reader users without a second scroll.
  target.focus({ preventScroll: true });
}

/** Sent by the rail's 回應 and 我要參與奉獻 stops, so the phone layout shows the Give side (11/08, 11/10). */
export const SHOW_GIVE_EVENT = 'fwd:show-give';
/** Sent by the header's 填寫 FORWARD 卡 links (menu, 寫 FORWARD 卡 button), so the phone layout shows the card (11/08). */
export const SHOW_CARD_EVENT = 'fwd:show-card';
