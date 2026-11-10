import { useEffect, useId, useRef, useState, type MouseEvent } from 'react';
import { flushSync } from 'react-dom';
import logoUrl from '../assets/brand/the-hope-logo-white.png';
import { pageUrl } from '../config/env';
import { CHAPTERS, HEADER_WRITE_LABEL, NAV_LABELS } from '../data/content';
import { SHOW_CARD_EVENT, jumpToSection } from '../lib/scroll';
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
    const wide = window.matchMedia('(min-width: 1180px)');
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
    // 「填寫 FORWARD 卡」 opens the card, also where phones show one side at a time (11/08).
    if (onHome && id === 'respond') window.dispatchEvent(new Event(SHOW_CARD_EVENT));
    if (onHome) jumpToSection(event, id);
  };

  // 寫 FORWARD 卡 lands on the card itself. Phones show one side of 第三步 at a time, so the card
  // side is rendered first (flushSync); otherwise the jump would aim at a hidden block.
  const writeCard = (event: MouseEvent<HTMLAnchorElement>) => {
    setMenuOpen(false);
    if (!onHome) return;
    flushSync(() => window.dispatchEvent(new Event(SHOW_CARD_EVENT)));
    jumpToSection(event, 'respond-part-card');
  };

  const links = (
    <ul className="site-nav__list">
      {/* Numbered steps (網站文字表 #1): 1.感謝 / 2.期待 / 3.填寫 FORWARD 卡 / 4. 2026 回應牆 ↗ */}
      {CHAPTERS.map((chapter, i) => (
        <li key={chapter.id}>
          <a href={onHome ? `#${chapter.id}` : pageUrl(`#${chapter.id}`)} onClick={(e) => followChapter(e, chapter.id)}>
            <span className="site-nav__num">{i + 1}.</span>
            {NAV_LABELS[chapter.id]}
          </a>
        </li>
      ))}
      <li>
        <a href={pageUrl('cards/')} onClick={() => setMenuOpen(false)}>
          <span className="site-nav__num">{CHAPTERS.length + 1}.</span>
          {NAV_LABELS.wall}
          <span aria-hidden="true"> ↗</span>
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
          {/* The full H THE HOPE logo from the printed FORWARD 卡 (11/04), in white (11/06). */}
          <img className="site-header__logo" src={logoUrl} alt="" width="164" height="24" />
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
        <nav className="site-nav" aria-label="主要">
          {links}
        </nav>
        <div className="site-header__actions">
          {/* Phones only (11/10): the chapter links are folded into the menu there, so the card
              gets its own way in next to 參與奉獻. */}
          <a
            className="site-header__write"
            href={onHome ? '#respond-part-card' : pageUrl('#respond-part-card')}
            onClick={writeCard}
          >
            {HEADER_WRITE_LABEL}
          </a>
          <GiveButton
            placement="header"
            label={
              <>
                參與奉獻
                <span className="site-header__give-arrow" aria-hidden="true">
                  ↗
                </span>
              </>
            }
            className="btn btn--gold site-header__give"
          />
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
