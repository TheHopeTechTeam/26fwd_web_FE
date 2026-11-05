import { wrapText } from './wrapText';

import type { Declaration, DeclarationPalette } from '../data/content';

/**
 * Personal FORWARD 卡 image (US-09): native Canvas 2D, no html2canvas. Two sizes
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

export const PROMPTS = { gratitude: '2026 我感謝神…', anticipate: '2027 我和神一起期待…' } as const;

const BODY = '"Noto Serif TC", "Songti TC", "PMingLiU", serif';
const HEADING = '"FWD Heading TC", "Noto Serif TC", "Songti TC", "PingFang TC", "Microsoft JhengHei", serif';
/** Smallest body size on the image (px at 1080 wide). */
const MIN_SIZE = 20;
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

  // Layout (11/04): the visitor's own words come first and stand out — each prompt is a clear
  // accent heading over its answer, then the signature. The chosen style's fixed text (English
  // title, Chinese title, declaration) is grouped at the bottom. The footer is sized first, so
  // the answers get all the room left above it.
  const top = pad + (story ? 110 : 64);
  const bottom = h - pad;

  let enSize = story ? 64 : 52;
  ctx.font = `800 ${enSize}px ${DISPLAY}`;
  while (enSize > 32 && measure(declaration.en) > maxWidth) {
    enSize -= 2;
    ctx.font = `800 ${enSize}px ${DISPLAY}`;
  }
  const tagSize = story ? 24 : 20;
  const zhSize = story ? 36 : 30;
  const dSize = story ? 30 : 25;
  ctx.font = `700 ${dSize}px ${BODY}`;
  const d = wrapText(declaration.text, maxWidth, measure);
  const dLine = Math.round(dSize * 1.55);
  const ruleGap = story ? 40 : 30;
  const footer = 3 + ruleGap + tagSize * 1.9 + enSize + zhSize * 1.6 + d.length * dLine;
  const footerTop = bottom - footer;
  const answersBottom = footerTop - (story ? 72 : 44);

  const layoutAt = (size: number, gratitude: string, anticipate: string) => {
    ctx.font = `400 ${size}px ${BODY}`;
    const a = wrapText(gratitude, maxWidth, measure);
    const b = wrapText(anticipate, maxWidth, measure);
    // The prompt never shrinks below a clear heading size, even for long answers.
    const prompt = Math.max(Math.round(size * 1.1), story ? 36 : 30);
    const line = Math.round(size * 1.55);
    const gap = Math.round(size * 1.3);
    const sign = Math.round(size * 0.9);
    const total = prompt * 1.55 * 2 + (a.length + b.length) * line + gap + sign * 1.8;
    return { size, a, b, prompt, line, gap, sign, total };
  };
  // Shrink the type until both answers fit. A newline counts as one character (#16), so an
  // answer can be up to ~70 short lines; if even the smallest size cannot hold them, the
  // answers' line breaks become spaces on the image rather than spilling into the footer.
  const fit = (gratitude: string, anticipate: string) => {
    for (let size = story ? 46 : 38; size >= MIN_SIZE; size -= 2) {
      const candidate = layoutAt(size, gratitude, anticipate);
      if (candidate.total <= answersBottom - top) return candidate;
    }
    return null;
  };
  const flat = (text: string) => text.replace(/\s*\n\s*/g, ' ');
  const layout =
    fit(content.text_gratitude, content.text_anticipate) ??
    fit(flat(content.text_gratitude), flat(content.text_anticipate)) ??
    layoutAt(MIN_SIZE, flat(content.text_gratitude), flat(content.text_anticipate));

  // The answers start near the top on both sizes (11/04: not centred on the story either).
  let y = top;
  const block = (prompt: string, lines: string[]) => {
    ctx.fillStyle = theme.accent;
    ctx.font = `400 ${layout.prompt}px ${HEADING}`;
    ctx.fillText(prompt, pad, y);
    y += layout.prompt * 1.55;
    ctx.fillStyle = theme.text;
    ctx.font = `400 ${layout.size}px ${BODY}`;
    for (const line of lines) {
      ctx.fillText(line, pad, y);
      y += layout.line;
    }
  };
  block(PROMPTS.gratitude, layout.a);
  y += layout.gap;
  block(PROMPTS.anticipate, layout.b);
  y += layout.sign * 0.8;
  ctx.fillStyle = theme.text;
  ctx.font = `600 ${layout.sign}px ${BODY}`;
  ctx.textAlign = 'right';
  ctx.fillText(`— ${content.nickname}`, w - pad, y);
  ctx.textAlign = 'left';

  // The footer: the chosen style's fixed text.
  y = footerTop;
  ctx.fillStyle = theme.line;
  ctx.fillRect(pad, y, 120, 3);
  y += 3 + ruleGap;
  ctx.fillStyle = theme.muted;
  ctx.font = `700 ${tagSize}px ${BODY}`;
  ctx.fillText('信心宣告', pad, y);
  y += tagSize * 1.9;
  ctx.fillStyle = theme.accent;
  ctx.font = `800 ${enSize}px ${DISPLAY}`;
  ctx.fillText(declaration.en, pad, y);
  y += enSize;
  ctx.fillStyle = theme.text;
  ctx.font = `400 ${zhSize}px ${HEADING}`;
  ctx.fillText(declaration.title, pad, y);
  y += zhSize * 1.6;
  ctx.fillStyle = theme.muted;
  ctx.font = `700 ${dSize}px ${BODY}`;
  for (const line of d) {
    ctx.fillText(line, pad, y);
    y += dLine;
  }
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
