import { wrapText } from './wrapText';

import type { Declaration, DeclarationPalette } from '../data/content';

/**
 * Personal Forward Card image (US-09): native Canvas 2D, no html2canvas. Two sizes
 * (square post / 9:16 story); colours, header and frame come from the declaration of faith
 * the visitor picks (#23).
 */
export type CardFormat = 'square' | 'story';

export const CARD_FORMATS: Record<CardFormat, { width: number; height: number; label: string }> = {
  square: { width: 1080, height: 1080, label: '貼文 1:1' },
  story: { width: 1080, height: 1920, label: '限時動態 9:16' },
};

interface Theme {
  background: string;
  text: string;
  accent: string;
  muted: string;
  line: string;
}

/** Swatch shown in the declaration picker, per palette. */
export const PALETTE_SWATCH: Record<DeclarationPalette, string> = {
  navy: 'var(--bg)',
  gold: 'var(--accent)',
  earth: 'var(--on-accent)',
};

type Channel = 'base' | 'accent' | 'earth' | 'light';

/**
 * Canvas cannot resolve CSS var(), so card colours are read from the theme channels in
 * tokens.css at draw time (#22). The card therefore always matches the site theme.
 */
export function readChannel(name: Channel, root?: Element): [number, number, number] {
  const el = root ?? (typeof document === 'undefined' ? null : document.documentElement);
  const raw = el ? getComputedStyle(el).getPropertyValue(`--rgb-${name}`) : '';
  const parts = raw.trim().split(/\s+/).map(Number);
  return parts.length === 3 && parts.every(Number.isFinite) ? [parts[0]!, parts[1]!, parts[2]!] : [0, 0, 0];
}

function color(name: Channel, alpha = 1): string {
  const [r, g, b] = readChannel(name);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function resolveTheme(palette: DeclarationPalette): Theme {
  switch (palette) {
    case 'gold':
      return {
        background: color('accent'),
        text: color('earth'),
        accent: color('earth'),
        muted: color('earth', 0.66),
        line: color('earth', 0.5),
      };
    case 'earth':
      return {
        background: color('earth'),
        text: color('light'),
        accent: color('accent'),
        muted: color('light', 0.62),
        line: color('accent', 0.55),
      };
    case 'navy':
    default:
      return {
        background: color('base'),
        text: color('light'),
        accent: color('accent'),
        muted: color('light', 0.62),
        line: color('accent', 0.55),
      };
  }
}

export interface CardContent {
  nickname: string;
  text_gratitude: string;
  text_anticipate: string;
}

export const PROMPTS = { gratitude: '我感謝神…', anticipate: '跟神一起期待…' } as const;

const BODY = '"Noto Serif TC", "Songti TC", "PMingLiU", serif';
const HEADING = '"FWD Heading TC", "Noto Serif TC", "Songti TC", "PingFang TC", "Microsoft JhengHei", serif';
const DISPLAY = '"Recia Serif Display", "Noto Serif TC", serif';

/** Canvas can't wait for web fonts by itself, so load the ones (and the slices) it uses first. */
export async function ensureCardFonts(content: CardContent, declaration: Declaration): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  const written = `${content.text_gratitude}${content.text_anticipate}${content.nickname}`;
  await Promise.allSettled([
    document.fonts.load(`800 40px "Recia Serif Display"`, `FORWARD 2026 THE HOPE ${declaration.en}`),
    document.fonts.load(`40px "FWD Heading TC"`, `${PROMPTS.gratitude}${PROMPTS.anticipate}${declaration.title}`),
    document.fonts.load(`400 40px "Noto Serif TC"`, written || 'A'),
    document.fonts.load(`700 40px "Noto Serif TC"`, `信心宣告${declaration.text}`),
  ]);
}

function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number, align: 'left' | 'right' = 'left') {
  const chars = Array.from(text);
  const width = chars.reduce((sum, ch) => sum + ctx.measureText(ch).width + spacing, -spacing);
  let cursor = align === 'right' ? x - width : x;
  for (const ch of chars) {
    ctx.fillText(ch, cursor, y);
    cursor += ctx.measureText(ch).width + spacing;
  }
}

/** Each declaration's frame (#23): one line with crop marks, two lines, or an arched top. */
function drawFrame(ctx: CanvasRenderingContext2D, declaration: Declaration, theme: Theme, w: number, h: number, inset: number) {
  ctx.save();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 3;
  if (declaration.frame === 'arch') {
    // The "door" of There is more: the frame's top corners curve into an arch. No people.
    const r = Math.round((w - inset * 2) * (h > w ? 0.18 : 0.14));
    ctx.beginPath();
    ctx.moveTo(inset, h - inset);
    ctx.lineTo(inset, inset + r);
    ctx.arc(inset + r, inset + r, r, Math.PI, Math.PI * 1.5);
    ctx.lineTo(w - inset - r, inset);
    ctx.arc(w - inset - r, inset + r, r, Math.PI * 1.5, 0);
    ctx.lineTo(w - inset, h - inset);
    ctx.closePath();
    ctx.stroke();
  } else {
    ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
  }
  if (declaration.frame === 'double') {
    ctx.lineWidth = 1.5;
    ctx.strokeRect(inset + 14, inset + 14, w - (inset + 14) * 2, h - (inset + 14) * 2);
  }
  if (declaration.frame === 'line') {
    // Crop-mark ticks carrying each edge past the corners.
    const t = 22;
    ctx.lineWidth = 3;
    for (const [x, y, dx, dy] of [
      [inset, inset, -1, -1],
      [w - inset, inset, 1, -1],
      [inset, h - inset, -1, 1],
      [w - inset, h - inset, 1, 1],
    ] as const) {
      ctx.beginPath();
      ctx.moveTo(x + dx * t, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + dy * t);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawCard(ctx: CanvasRenderingContext2D, content: CardContent, format: CardFormat, declaration: Declaration): void {
  const { width: w, height: h } = CARD_FORMATS[format];
  const theme = resolveTheme(declaration.palette);
  const story = format === 'story';
  const inset = story ? 44 : 36;
  const pad = story ? 108 : 92;

  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, w, h);
  drawFrame(ctx, declaration, theme, w, h, inset);

  ctx.textBaseline = 'top';
  const maxWidth = w - pad * 2;
  const measure = (s: string) => ctx.measureText(s).width;

  // Top line
  ctx.fillStyle = theme.muted;
  ctx.font = `700 24px ${DISPLAY}`;
  spaced(ctx, 'FORWARD 2026', pad, pad, 6);
  spaced(ctx, 'THE HOPE', w - pad, pad, 6, 'right');

  // Header: the declaration's English title, sized to the width, then its Chinese title.
  let y = pad + (story ? 150 : 70);
  let enSize = story ? 112 : 88;
  ctx.font = `800 ${enSize}px ${DISPLAY}`;
  while (enSize > 40 && measure(declaration.en) > maxWidth) {
    enSize -= 4;
    ctx.font = `800 ${enSize}px ${DISPLAY}`;
  }
  ctx.fillStyle = theme.accent;
  ctx.fillText(declaration.en, pad, y);
  y += enSize * 0.98;
  ctx.fillStyle = theme.text;
  ctx.font = `400 ${story ? 44 : 36}px ${HEADING}`;
  ctx.fillText(declaration.title, pad, y);
  y += (story ? 44 : 36) * 1.3 + (story ? 72 : 44);

  // Body: shrink the type until both answers, the declaration and the signature fit.
  const top = y;
  const bottom = h - pad;
  let size = story ? 46 : 36;
  let layout: { a: string[]; b: string[]; d: string[]; label: number; line: number; gap: number; dSize: number; dLine: number; sign: number; total: number } | null = null;
  for (; size >= 20; size -= 2) {
    ctx.font = `400 ${size}px ${BODY}`;
    const a = wrapText(content.text_gratitude, maxWidth, measure);
    const b = wrapText(content.text_anticipate, maxWidth, measure);
    const dSize = Math.round(size * 1.12);
    ctx.font = `700 ${dSize}px ${BODY}`;
    const d = wrapText(declaration.text, maxWidth, measure);
    const label = Math.round(size * 0.74);
    const line = Math.round(size * 1.58);
    const dLine = Math.round(dSize * 1.5);
    const gap = Math.round(size * 1.15);
    const sign = Math.round(size * 0.86);
    const total = label * 1.8 * 3 + (a.length + b.length) * line + d.length * dLine + gap * 3 + sign * 1.4;
    layout = { a, b, d, label, line, gap, dSize, dLine, sign, total };
    if (total <= bottom - top) break;
  }
  if (!layout) return;

  y = story ? top + Math.max(0, (bottom - top - layout.total) / 2) : top;
  const label = (text: string) => {
    ctx.fillStyle = theme.muted;
    ctx.font = `400 ${layout.label}px ${HEADING}`;
    ctx.fillText(text, pad, y);
    y += layout.label * 1.8;
  };
  const block = (prompt: string, lines: string[]) => {
    label(prompt);
    ctx.fillStyle = theme.text;
    ctx.font = `400 ${size}px ${BODY}`;
    for (const line of lines) {
      ctx.fillText(line, pad, y);
      y += layout.line;
    }
  };

  block(PROMPTS.gratitude, layout.a);
  y += layout.gap * 0.6;
  block(PROMPTS.anticipate, layout.b);
  y += layout.gap / 2;
  // On the square card a short answer leaves room, so the declaration sits at the bottom.
  const declarationBlock = layout.gap * 1.4 + layout.label * 1.8 + layout.d.length * layout.dLine + layout.sign * 1.4;
  if (!story) y = Math.max(y, bottom - declarationBlock);
  ctx.fillStyle = theme.line;
  ctx.fillRect(pad, y, 120, 3);
  y += layout.gap;

  ctx.fillStyle = theme.muted;
  ctx.font = `700 ${layout.label}px ${BODY}`;
  ctx.fillText('信心宣告', pad, y);
  y += layout.label * 1.8;
  ctx.fillStyle = theme.accent;
  ctx.font = `700 ${layout.dSize}px ${BODY}`;
  for (const line of layout.d) {
    ctx.fillText(line, pad, y);
    y += layout.dLine;
  }
  y += layout.gap * 0.4;

  ctx.fillStyle = theme.text;
  ctx.font = `600 ${layout.sign}px ${BODY}`;
  ctx.textAlign = 'right';
  ctx.fillText(`— ${content.nickname}`, w - pad, y);
  ctx.textAlign = 'left';
}

export async function renderCardBlob(content: CardContent, format: CardFormat, declaration: Declaration): Promise<Blob> {
  await ensureCardFonts(content, declaration);
  const { width, height } = CARD_FORMATS[format];
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not available');
  drawCard(ctx, content, format, declaration);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode PNG'))), 'image/png');
  });
}
