import { useEffect, useRef } from 'react';
import { HERO } from '../data/content';
import { prefersReducedMotion } from '../lib/hooks';
import './Hero.css';

/**
 * 00 · Hero (US-02). No people anywhere in the artwork: an abstract, lit doorway and
 * architectural light. The title scales with its container (cqi) so "FORWARD" never
 * clips at 320–430 px, and the next chapter peeks in at the bottom.
 */
export function Hero() {
  const bgRef = useRef<HTMLDivElement>(null);

  // Light parallax on the backdrop only; skipped entirely for reduced motion.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = Math.min(window.scrollY, window.innerHeight * 1.2);
        if (bgRef.current) bgRef.current.style.transform = `translate3d(0, ${y * 0.28}px, 0)`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__bg" ref={bgRef} aria-hidden="true">
        <div className="hero__glow" />
        <svg className="hero__arch" viewBox="0 0 400 560" preserveAspectRatio="xMidYMax meet">
          <defs>
            <linearGradient id="hero-door" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffe7a8" stopOpacity=".95" />
              <stop offset=".55" stopColor="#ffc946" stopOpacity=".55" />
              <stop offset="1" stopColor="#ffc946" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="hero-frame" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity=".35" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M60 560V200a140 140 0 0 1 280 0v360" fill="none" stroke="url(#hero-frame)" strokeWidth="2" />
          <path d="M20 560V190a180 180 0 0 1 360 0v370" fill="none" stroke="url(#hero-frame)" strokeWidth="1" opacity=".5" />
          <path className="hero__door" d="M110 560V214a90 90 0 0 1 180 0v346z" fill="url(#hero-door)" />
        </svg>
        <div className="hero__beams" />
        <div className="hero__columns" />
        <div className="hero__grain" />
      </div>

      <div className="wrap hero__content">
        <p className="kicker hero__kicker">{HERO.kicker}</p>
        <h1 id="hero-title" className="hero__title">
          <span className="hero__forward">{HERO.title}</span>
          <span className="hero__line">
            <span className="hero__tagline">{HERO.tagline}</span>
            <span className="hero__year">{HERO.year}</span>
          </span>
        </h1>
        <p className="hero__lead">{HERO.lead}</p>
        <div className="hero__actions">
          <a className="btn btn--gold btn--lg" href="#appreciate">
            {HERO.cta}
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M12 5v14M6 13l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
