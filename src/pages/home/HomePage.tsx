import { useEffect } from 'react';
import { JourneyRail } from '../../components/JourneyRail';
import { SiteFooter } from '../../components/SiteFooter';
import { SiteHeader } from '../../components/SiteHeader';
import { Anticipate } from '../../sections/Anticipate';
import { Appreciate } from '../../sections/Appreciate';
import { Hero } from '../../sections/Hero';
import { Respond } from '../../sections/Respond';

/**
 * Arriving with a #link (e.g. 「回到填寫 FORWARD 卡」 on the privacy page) lands on that part.
 * The sections are drawn after the page loads, so the browser's own jump finds nothing; this
 * scrolls there once they exist, and again as fonts and images settle, unless the visitor has
 * started scrolling themselves (11/08).
 */
function useLandOnHash(): void {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    let touched = false;
    const stop = () => {
      touched = true;
    };
    const go = () => {
      if (!touched) document.getElementById(id)?.scrollIntoView({ block: 'start' });
    };
    const events = ['wheel', 'touchstart', 'keydown'] as const;
    events.forEach((e) => window.addEventListener(e, stop, { once: true, passive: true }));
    const frame = requestAnimationFrame(go);
    void document.fonts?.ready.then(go);
    window.addEventListener('load', go, { once: true });
    const late = window.setTimeout(go, 1500);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(late);
      window.removeEventListener('load', go);
      events.forEach((e) => window.removeEventListener(e, stop));
    };
  }, []);
}

export function HomePage() {
  useLandOnHash();
  return (
    <>
      <a className="skip-link" href="#appreciate">
        跳到主要內容
      </a>
      <SiteHeader progress />
      <JourneyRail />
      <main>
        <Hero />
        <Appreciate />
        <Anticipate />
        <Respond />
      </main>
      <SiteFooter />
    </>
  );
}
