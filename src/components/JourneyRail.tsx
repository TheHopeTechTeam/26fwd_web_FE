import { useEffect, useState } from 'react';
import { CHAPTERS, RAIL_GIVE, type ChapterId } from '../data/content';
import { jumpToSection } from '../lib/scroll';
import './JourneyRail.css';

/**
 * Floating journey stepper (US-01 / FEAT-01). Fixed on the right at every width:
 * labelled on desktop, a slim vertical capsule on phones. Scroll-spy uses one
 * IntersectionObserver keyed to a line across the middle of the viewport. After the three
 * chapters, a Give stop jumps to the finale at the end of Respond (11/04).
 */
type Stop = ChapterId | typeof RAIL_GIVE.id;
const STOPS: Stop[] = [...CHAPTERS.map((c) => c.id), RAIL_GIVE.id];

export function JourneyRail() {
  const [active, setActive] = useState<Stop | null>(null);

  useEffect(() => {
    const sections = STOPS.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (!sections.length || typeof IntersectionObserver === 'undefined') return;
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // Stops are in document order (the finale sits inside Respond); the last one crossing the midline wins.
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
                className={`journey-rail__item ${isActive ? 'is-active' : ''}`}
                aria-current={isActive ? 'step' : undefined}
                onClick={(e) => jumpToSection(e, chapter.id)}
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
            onClick={(e) => jumpToSection(e, RAIL_GIVE.id)}
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
