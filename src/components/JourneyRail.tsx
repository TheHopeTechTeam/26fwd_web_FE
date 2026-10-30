import { useEffect, useState } from 'react';
import { CHAPTERS, type ChapterId } from '../data/content';
import { jumpToSection } from '../lib/scroll';
import './JourneyRail.css';

/**
 * Floating journey stepper (US-01 / FEAT-01). Fixed on the right at every width:
 * labelled on desktop, a slim vertical capsule on phones. Scroll-spy uses one
 * IntersectionObserver keyed to a line across the middle of the viewport.
 */
export function JourneyRail() {
  const [active, setActive] = useState<ChapterId | null>(null);

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
        const current = [...CHAPTERS].reverse().find((c) => visible.has(c.id));
        setActive(current ? current.id : null);
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
                  <span className="journey-rail__zh">{chapter.zh}</span>
                </span>
                <span className="journey-rail__dot" aria-hidden="true" />
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
