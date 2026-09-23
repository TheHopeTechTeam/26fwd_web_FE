import { useEffect, useRef, useState } from 'react';
import logoUrl from '../assets/brand/hope-h-white.png';
import { config, pageUrl } from '../config/env';
import { GiveButton } from './GiveButton';
import './SiteHeader.css';

interface SiteHeaderProps {
  /** Show the reading-progress bar (the long journey page only). */
  progress?: boolean;
  /** Replaces the wordmark link target, e.g. a back link on sub-pages. */
  backLabel?: string;
}

export function SiteHeader({ progress = false, backLabel }: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const root = document.documentElement;
      setScrolled(root.scrollTop > 24);
      if (barRef.current) {
        const max = root.scrollHeight - root.clientHeight;
        barRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, root.scrollTop / max) : 0})`;
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      {progress && (
        <div className="site-header__progress" aria-hidden="true">
          <div ref={barRef} className="site-header__progress-bar" />
        </div>
      )}
      <div className="site-header__inner">
        <a className="site-header__brand" href={pageUrl()} aria-label="FORWARD 2026 首頁">
          <img src={logoUrl} alt="" width="19" height="24" />
          <span className="site-header__wordmark">
            {backLabel ? (
              <>
                <span aria-hidden="true">←</span> {backLabel}
              </>
            ) : (
              <>
                FORWARD <span className="site-header__year">2026</span>
              </>
            )}
          </span>
        </a>
        {config.showPreviewBadge && (
          <span className="site-header__badge" title="內容為合成示意資料，非正式上線內容">
            <span className="site-header__badge-long">SYNTHETIC </span>PREVIEW
          </span>
        )}
        <div className="site-header__actions">
          <GiveButton
            placement="header"
            label={
              <>
                奉獻<span className="site-header__give-en"> Give</span>
              </>
            }
            className="btn btn--gold btn--sm site-header__give"
          />
        </div>
      </div>
    </header>
  );
}
