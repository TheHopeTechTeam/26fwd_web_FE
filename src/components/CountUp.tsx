import { useEffect, useRef, useState } from 'react';
import { easeOutCubic, formatNumber } from '../lib/format';
import { prefersReducedMotion, useInView } from '../lib/hooks';

interface CountUpProps {
  value: number;
  suffix?: string;
  durationMs?: number;
}

/**
 * Counts from 0 to `value` once, the first time it scrolls into view (FEAT-07):
 * 1.5 s ease-out, thousands separators, optional suffix. Screen readers get the
 * final number straight away; reduced motion skips the animation.
 */
export function CountUp({ value, suffix = '', durationMs = 1500 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { threshold: 0.5 });
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion()) {
      setShown(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      setShown(Math.round(value * easeOutCubic(progress)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, durationMs]);

  const final = `${formatNumber(value)}${suffix}`;
  return (
    <span ref={ref} className="count-up">
      <span aria-hidden="true">
        {formatNumber(shown)}
        {suffix}
      </span>
      <span className="sr-only">{final}</span>
    </span>
  );
}
