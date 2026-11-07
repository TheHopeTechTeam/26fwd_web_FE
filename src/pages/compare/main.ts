/**
 * /compare/: the live home page (left) beside design trial 3 (right), each in its own iframe at
 * a real device width scaled to fit. Scrolling either side moves the other to the same place in
 * the same block (hero, each chapter, each ministry…), since the two pages differ in height.
 * Built only for mock (preview) builds, like /design/.
 */
import './compare.css';

type Device = 'desktop' | 'phone';
const WIDTH: Record<Device, number> = { desktop: 1440, phone: 390 };
const BASE = import.meta.env.BASE_URL;

// Blocks in page order; the same list exists on both pages.
const ANCHORS = [
  '.hero',
  '#appreciate',
  '#appreciate .polaroid-block',
  '#anticipate',
  'article.ministry',
  '#respond',
  '.respond-actions',
  '.teaser',
  '.site-footer',
];

const frames = [...document.querySelectorAll<HTMLIFrameElement>('.cmp-frame iframe')];
const markButton = document.querySelector<HTMLButtonElement>('.cmp-marks')!;
let device: Device = 'desktop';
let marks = false;

const src = (side: string) => {
  if (side === 'old') return marks ? `${BASE}design/` : BASE;
  return `${BASE}design-trial-3/${marks ? '?frames=1' : ''}`;
};

function layout(): void {
  const width = WIDTH[device];
  for (const f of frames) {
    const box = f.parentElement!;
    const scale = Math.min(1, box.clientWidth / width);
    f.style.width = `${width}px`;
    f.style.height = `${box.clientHeight / scale}px`;
    f.style.transform = `translateX(-50%) scale(${scale})`;
  }
}

/** Top of every anchor in document coordinates, or null when a page is not ready. */
function anchorTops(win: Window): number[] | null {
  try {
    const doc = win.document;
    const tops = ANCHORS.flatMap((sel) => [...doc.querySelectorAll(sel)]).map((el) => el.getBoundingClientRect().top + win.scrollY);
    if (!tops.length) return null;
    const max = Math.max(0, doc.documentElement.scrollHeight - win.innerHeight);
    // Blocks near the bottom can start below the last reachable position: clamp them.
    return [0, ...tops.map((t) => Math.min(t, max)).sort((a, b) => a - b), max];
  } catch {
    return null;
  }
}

/** Map a scroll position on one page to the same block and fraction on the other. */
function mapScroll(y: number, from: number[], to: number[]): number {
  const at = (list: number[], i: number) => list[i] ?? 0;
  if (from.length !== to.length) {
    return (y / (at(from, from.length - 1) || 1)) * at(to, to.length - 1);
  }
  for (let i = from.length - 2; i >= 0; i -= 1) {
    if (y >= at(from, i)) {
      const span = at(from, i + 1) - at(from, i);
      const f = span > 0 ? Math.min(1, (y - at(from, i)) / span) : 0;
      return at(to, i) + f * (at(to, i + 1) - at(to, i));
    }
  }
  return 0;
}

// The side the user is scrolling drives; scroll events from the other side during that time are
// our own echo and are ignored, so the two never pull each other back and forth.
let driver: Window | null = null;
let driverUntil = 0;

function onScroll(source: Window): void {
  const now = performance.now();
  if (driver && driver !== source && now < driverUntil) return;
  driver = source;
  driverUntil = now + 300;
  const target = frames.map((f) => f.contentWindow).find((w) => w && w !== source);
  if (!target) return;
  const from = anchorTops(source);
  const to = anchorTops(target);
  if (!from || !to) return;
  target.scrollTo({ top: Math.round(mapScroll(source.scrollY, from, to)), behavior: 'instant' as ScrollBehavior });
}

function load(keepFraction = true): void {
  const old = frames[0]?.contentWindow;
  let fraction = 0;
  try {
    if (keepFraction && old) fraction = old.scrollY / Math.max(1, old.document.documentElement.scrollHeight - old.innerHeight);
  } catch {
    /* not loaded yet */
  }
  for (const f of frames) {
    f.onload = () => {
      const win = f.contentWindow!;
      let queued = false;
      win.addEventListener(
        'scroll',
        () => {
          if (queued) return;
          queued = true;
          requestAnimationFrame(() => {
            queued = false;
            onScroll(win);
          });
        },
        { passive: true },
      );
      if (f.dataset.side === 'old' && fraction > 0) {
        // Let the page settle (fonts, images) before restoring the place.
        setTimeout(() => win.scrollTo({ top: fraction * (win.document.documentElement.scrollHeight - win.innerHeight) }), 800);
      }
    };
    f.src = src(f.dataset.side ?? 'old');
  }
}

for (const b of document.querySelectorAll<HTMLButtonElement>('[data-device]')) {
  b.addEventListener('click', () => {
    device = b.dataset.device as Device;
    for (const o of document.querySelectorAll<HTMLButtonElement>('[data-device]')) o.setAttribute('aria-pressed', String(o === b));
    layout();
  });
}
markButton.addEventListener('click', () => {
  marks = !marks;
  markButton.setAttribute('aria-pressed', String(marks));
  markButton.textContent = marks ? '隱藏框與編號' : '顯示框與編號';
  load();
});
addEventListener('resize', layout);
layout();
load(false);
