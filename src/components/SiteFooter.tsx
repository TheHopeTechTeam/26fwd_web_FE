import logoUrl from '../assets/brand/hope-h-white.png';
import { config, pageUrl } from '../config/env';
import './SiteFooter.css';

export function SiteFooter({ railSpace = true }: { railSpace?: boolean }) {
  return (
    <footer className="site-footer">
      <div className={`wrap ${railSpace ? '' : 'wrap--no-rail'} site-footer__inner`}>
        <div className="site-footer__brand">
          <img src={logoUrl} alt="The Hope" width="22" height="28" />
          <div>
            <p className="site-footer__title">FORWARD · There is more</p>
            <p className="site-footer__sub">The Hope · 2026 年末 Campaign</p>
          </div>
        </div>
        <nav aria-label="頁尾連結">
          <ul className="site-footer__links">
            <li>
              <a href={pageUrl('cards/')}>Forward Cards 卡片牆</a>
            </li>
            <li>
              <a href={pageUrl('privacy/')}>隱私與資料說明</a>
            </li>
            <li>
              <a href={config.prayerMapUrl} target="_blank" rel="noopener noreferrer">
                Prayer Map ↗
              </a>
            </li>
            <li>
              <a href="https://thehope.co" target="_blank" rel="noopener noreferrer">
                thehope.co ↗
              </a>
            </li>
          </ul>
        </nav>
        {config.showPreviewBadge && (
          <p className="site-footer__notice">
            本網站目前為開發預覽版：人物、見證、數據與卡片皆為合成示意內容（synthetic），不代表真實人物或正式數字。
          </p>
        )}
      </div>
    </footer>
  );
}
