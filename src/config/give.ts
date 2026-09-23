/**
 * Where a Give CTA sits on the site. Sent as utm_content so Central Giving can tell
 * which button converted. Naming is provisional until BB signs off (FEAT-13 / US-12).
 */
export type GivePlacement = 'header' | 'respond_finale';

export const GIVE_UTM = {
  source: 'forward_site',
  medium: 'website',
  campaign: 'forward_2026',
} as const;

/** Adds the FORWARD UTM set to the giving URL, keeping any query it already has. */
export function buildGiveUrl(base: string, placement: GivePlacement): string {
  const url = new URL(base);
  url.searchParams.set('utm_source', GIVE_UTM.source);
  url.searchParams.set('utm_medium', GIVE_UTM.medium);
  url.searchParams.set('utm_campaign', GIVE_UTM.campaign);
  url.searchParams.set('utm_content', placement);
  return url.toString();
}
