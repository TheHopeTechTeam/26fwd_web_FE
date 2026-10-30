import { useEffect, useId, useRef, useState, type MouseEvent } from 'react';
import logoUrl from '../assets/brand/hope-h-white.png';
import { config, pageUrl } from '../config/env';
import { CHAPTERS } from '../data/content';
import { jumpToSection } from '../lib/scroll';
import { GiveButton } from './GiveButton';
import { MusicToggle } from './MusicToggle';
import './SiteHeader.css';

interface SiteHeaderProps {
  /** Show the reading-progress bar (the long journey page only). */
  progress?: boolean;
  /** Replaces the wordmark link target, e.g. a back link on sub-pages. */
  backLabel?: string;
}

export function SiteHeader({ progress = false, backLabel }: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const menuId = useId();
  // Sub-pages (cards, privacy) link back to the chapters on the home page.
  const onHome = !backLabel;

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

  // Phone menu: Esc or a tap outside the header closes it; so does growing to the desktop nav.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const wide = window.matchMedia('(min-width: 960px)');
    const onWide = () => wide.matches && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    wide.addEventListener('change', onWide);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      wide.removeEventListener('change', onWide);
    };
  }, [menuOpen]);

  const followChapter = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    setMenuOpen(false);
    if (onHome) jumpToSection(event, id);
  };

  const links = (
    <ul className="site-nav__list">
      {CHAPTERS.map((chapter) => (
        <li key={chapter.id}>
          <a href={onHome ? `#${chapter.id}` : pageUrl(`#${chapter.id}`)} onClick={(e) => followChapter(e, chapter.id)}>
            {chapter.zh}
          </a>
        </li>
      ))}
      <li>
        <a href={pageUrl('cards/')} onClick={() => setMenuOpen(false)}>
          卡片牆<span aria-hidden="true"> ↗</span>
        </a>
      </li>
    </ul>
  );

  return (
    <header ref={headerRef} className={`site-header ${scrolled || menuOpen ? 'is-scrolled' : ''}`}>
      {progress && (
        <div className="site-header__progress" aria-hidden="true">
          <div ref={barRef} className="site-header__progress-bar" />
        </div>
      )}
      <div className="site-header__inner">
        <a className="site-header__brand" href={pageUrl()} aria-label="FORWARD 2026 首頁">
          <img src={logoUrl} alt="" width="28" height="36" />
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
        <nav className="site-nav" aria-label="主要">
          {links}
        </nav>
        <div className="site-header__actions">
          <MusicToggle />
          <GiveButton placement="header" label="參與奉獻" className="btn btn--gold btn--sm site-header__give" />
          <button
            type="button"
            className="site-header__menu-btn"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="site-header__menu-icon" aria-hidden="true" />
            <span className="sr-only">{menuOpen ? '關閉選單' : '開啟選單'}</span>
          </button>
        </div>
      </div>
      <nav id={menuId} className="site-menu" aria-label="主要" hidden={!menuOpen}>
        {links}
      </nav>
    </header>
  );
}
