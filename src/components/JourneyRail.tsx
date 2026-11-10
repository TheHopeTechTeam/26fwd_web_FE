import { useEffect, useState } from 'react';
import { CHAPTERS, RAIL_GIVE, type ChapterId } from '../data/content';
import { ONE_SIDE_QUERY, SHOW_GIVE_EVENT, jumpToSection } from '../lib/scroll';
import './JourneyRail.css';

/**
 * Floating journey stepper (US-01 / FEAT-01). Fixed on the right at every width:
 * labelled on desktop, a slim vertical capsule on phones. Scroll-spy uses one
 * IntersectionObserver keyed to a line across the middle of the viewport. After the three
 * chapters, a Give stop jumps to Give (11/04). Since 11/05 Give sits beside the FORWARD 卡 in
 * Respond, so the Give stop is a jump only and Respond stays lit there.
 */
type Stop = ChapterId | typeof RAIL_GIVE.id;
const STOPS: Stop[] = [...CHAPTERS.map((c) => c.id), RAIL_GIVE.id];

export function JourneyRail() {
  const [active, setActive] = useState<Stop | null>(null);

  useEffect(() => {
    const sections = CHAPTERS.map((c) => document.getElementById(c.id)).filter((el): el is HTMLElement => !!el);
    if (!sections.length || typeof IntersectionObserver === 'undefined') return;
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // Chapters are in document order; the last one crossing the midline wins.
        setActive([...STOPS].reverse().find((id) => visible.has(id)) ?? null);
      },
      { rootMargin: '-48% 0px -48% 0px' },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="journey-rail" aria-label="旅程章節">
      <ol className="journey-rail__list">
        {CHAPTERS.map((chapter) => {
          const isActive = active === chapter.id;
          return (
            <li key={chapter.id}>
              <a
                href={`#${chapter.id}`}
                className={`journey-rail__item ${chapter.id === 'respond' ? 'journey-rail__item--respond' : ''} ${isActive ? 'is-active' : ''}`}
                aria-current={isActive ? 'step' : undefined}
                onClick={(e) => {
                  // Phones show one side of 第三步 at a time: 回應 opens it on 奉獻, as scrolling
                  // there does, and lands on the two buttons so 我要填寫線上 FORWARD 卡 is in
                  // view; the header's 寫 FORWARD 卡 opens the card (11/10).
                  if (chapter.id === 'respond') {
                    window.dispatchEvent(new Event(SHOW_GIVE_EVENT));
                    if (window.matchMedia?.(ONE_SIDE_QUERY).matches) return jumpToSection(e, RAIL_GIVE.id);
                  }
                  jumpToSection(e, chapter.id);
                }}
              >
                <span className="journey-rail__label">
                  <span className="journey-rail__index">{chapter.index}</span>
                  <span className="journey-rail__en">{chapter.en}</span>
                  <span className="journey-rail__zh">{chapter.rail}</span>
                  <span className="journey-rail__short">{chapter.zh}</span>
                </span>
                <span className="journey-rail__dot" aria-hidden="true" />
              </a>
            </li>
          );
        })}
        <li>
          <a
            href={`#${RAIL_GIVE.id}`}
            className={`journey-rail__item journey-rail__item--give ${active === RAIL_GIVE.id ? 'is-active' : ''}`}
            aria-current={active === RAIL_GIVE.id ? 'step' : undefined}
            onClick={(e) => {
              window.dispatchEvent(new Event(SHOW_GIVE_EVENT));
              jumpToSection(e, RAIL_GIVE.id);
            }}
          >
            <span className="journey-rail__label">
              <span className="journey-rail__en">{RAIL_GIVE.en}</span>
              <span className="journey-rail__zh">{RAIL_GIVE.zh}</span>
              <span className="journey-rail__short">{RAIL_GIVE.short}</span>
            </span>
            <span className="journey-rail__dot" aria-hidden="true" />
          </a>
        </li>
      </ol>
    </nav>
  );
}
