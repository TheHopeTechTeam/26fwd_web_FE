import { mulberry32 } from './random';

export interface FloatSlot {
  /** Centre position in px within the stage. */
  x: number;
  y: number;
  size: number;
  /** Drift waypoints (px) and timing for the CSS animation. */
  dx1: number;
  dy1: number;
  dx2: number;
  dy2: number;
  duration: number;
  delay: number;
}

export interface FloatLayout {
  height: number;
  slots: FloatSlot[];
}

/**
 * Lays portraits out on a loose, staggered grid with seeded jitter, so they read as
 * scattered and "floating" but never overlap or leave the stage, at any width.
 */
export function computeFloatLayout(count: number, width: number, seed = 7): FloatLayout {
  const cols = width < 420 ? 3 : width < 640 ? 4 : width < 900 ? 5 : width < 1100 ? 6 : 7;
  const rows = Math.ceil(count / cols);
  const cellW = width / cols;
  const cellH = cellW * (width < 640 ? 1.18 : 0.92);
  const size = Math.min(132, cellW * (width < 640 ? 0.74 : 0.62));
  const rand = mulberry32(seed);
  const slack = Math.max(0, (cellW - size) / 2 - 6);
  const slackY = Math.max(0, (cellH - size) / 2 - 6);
  const drift = Math.min(18, size * 0.16);

  const slots: FloatSlot[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    // Stagger odd rows by a quarter cell for a less grid-like rhythm.
    const offset = row % 2 ? cellW * 0.22 : -cellW * 0.08;
    const x = Math.min(width - size / 2 - 4, Math.max(size / 2 + 4, (col + 0.5) * cellW + offset + (rand() - 0.5) * slack));
    const y = (row + 0.5) * cellH + (rand() - 0.5) * 2 * slackY;
    slots.push({
      x,
      y,
      size: size * (0.86 + rand() * 0.22),
      dx1: (rand() - 0.5) * 2 * drift,
      dy1: (rand() - 0.5) * 2 * drift,
      dx2: (rand() - 0.5) * 2 * drift,
      dy2: (rand() - 0.5) * 2 * drift,
      duration: 14 + rand() * 12,
      delay: -rand() * 20,
    });
  }
  return { height: rows * cellH + 24, slots };
}
