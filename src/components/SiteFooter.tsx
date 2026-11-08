import logoUrl from '../assets/brand/the-hope-logo-white.png';
import { pageUrl } from '../config/env';
import './SiteFooter.css';

export function SiteFooter({ railSpace = true }: { railSpace?: boolean }) {
  return (
    <footer className="site-footer">
      <div className={`wrap ${railSpace ? '' : 'wrap--no-rail'} site-footer__inner`}>
        <div className="site-footer__brand">
          <img src={logoUrl} alt="The Hope" width="192" height="28" />
          <p className="site-footer__title">FORWARD · There is More</p>
        </div>
        <nav aria-label="頁尾連結">
          <ul className="site-footer__links">
            <li>
              <a href={pageUrl('cards/')}>2026 回應牆</a>
            </li>
            <li>
              <a href={pageUrl('privacy/')}>隱私與資料說明</a>
            </li>
            <li>
              <a href="https://thehope.co" target="_blank" rel="noopener noreferrer">
                thehope.co ↗
              </a>
            </li>
          </ul>
        </nav>
        {/* The music credit and the preview notice were removed on 11/04; the site has no music
            since 11/05 (team choice). */}
      </div>
    </footer>
  );
}
