import { useEffect, useState, type RefObject } from 'react';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.(REDUCED_MOTION).matches === true;
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION);
    const update = () => setReduced(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

/** True once the element has entered the viewport (or immediately without IO support). */
export function useInView(ref: RefObject<Element | null>, options: IntersectionObserverInit = {}, once = true): boolean {
  const [inView, setInView] = useState(false);
  const { root, rootMargin, threshold } = options;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { root, rootMargin, threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, root, rootMargin, threshold, once]);
  return inView;
}

let lockCount = 0;
let savedPaddingRight = '';

/**
 * Background scroll lock for modals, including iOS Safari: overflow hidden on <html>
 * (plus overscroll-behavior: contain on the dialog) stops the page scrolling behind.
 */
export function lockScroll(): void {
  if (lockCount++ > 0) return;
  const root = document.documentElement;
  const scrollbar = window.innerWidth - root.clientWidth;
  savedPaddingRight = document.body.style.paddingRight;
  if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
  root.classList.add('scroll-locked');
}

export function unlockScroll(): void {
  if (lockCount === 0 || --lockCount > 0) return;
  document.documentElement.classList.remove('scroll-locked');
  document.body.style.paddingRight = savedPaddingRight;
}
