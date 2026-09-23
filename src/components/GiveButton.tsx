import type { ReactNode } from 'react';
import { config } from '../config/env';
import { buildGiveUrl, type GivePlacement } from '../config/give';
import { trackEvent } from '../lib/analytics';

interface GiveButtonProps {
  placement: GivePlacement;
  label: ReactNode;
  className?: string;
  /** Shown as the button's description while no official Give URL is configured. */
  disabledHint?: string;
}

/**
 * The FORWARD giving CTA (US-02, US-12). Opens Central Giving with UTM tags and fires
 * the GA4 click_give_cta event. Until a valid https Give URL is configured it renders
 * as a disabled button instead of a link, so nobody lands on a wrong page.
 */
export function GiveButton({ placement, label, className = 'btn btn--gold', disabledHint = '奉獻連結設定中' }: GiveButtonProps) {
  if (!config.giveUrl) {
    return (
      <button type="button" className={className} aria-disabled="true" title={disabledHint} onClick={(e) => e.preventDefault()}>
        {label}
        <span className="sr-only">（{disabledHint}）</span>
      </button>
    );
  }
  return (
    <a
      className={className}
      href={buildGiveUrl(config.giveUrl, placement)}
      target="_blank"
      rel="noopener"
      onClick={() => trackEvent('click_give_cta')}
    >
      {label}
      <span className="sr-only">（在新分頁開啟）</span>
    </a>
  );
}
