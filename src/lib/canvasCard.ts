import { wrapText } from './wrapText';
import paperBgUrl from '../assets/card/forward-card-bg.webp';

import type { Declaration } from '../data/content';

/**
 * Personal FORWARD 卡 image (US-09): native Canvas 2D, no html2canvas. Since 11/06 one design,
 * 1:1: the printed FORWARD 卡's look with the declaration of faith the visitor picks (#23) closing
 * the card, on that declaration's ground (11/08). The 9:16 size is kept in the drawing code but
 * no longer offered.
 */
export type CardFormat = 'square' | 'story';

export const CARD_FORMATS: Record<CardFormat, { width: number; height: number; label: string }> = {
  square: { width: 1080, height: 1080, label: '貼文 1:1' },
  story: { width: 1080, height: 1920, label: '限時動態 9:16' },
};

type Channel = 'base' | 'navy' | 'accent' | 'earth' | 'light' | 'white' | 'card-brown' | 'card-slate' | 'print-gold';

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

export interface CardContent {
  nickname: string;
  text_gratitude: string;
  text_anticipate: string;
}

/** The two prompts, worded as on the printed FORWARD 卡 (11/04). */
export const PROMPTS = { gratitude: '2026, 我感謝神...', anticipate: '2027, 跟神一起期待...' } as const;
/** The English lines under the prompts, as on the printed FORWARD 卡. */
export const PROMPTS_EN = { gratitude: 'I APPRECIATE GOD FOR…', anticipate: "I'M BELIEVING IN GOD FOR…" } as const;

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
    document.fonts.load(`800 40px "Recia Serif Display"`, `FORWARD 2026 THE HOPE CARD ${declaration.en} ${PROMPTS_EN.gratitude} ${PROMPTS_EN.anticipate}`),
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

/** Draws an image to cover the whole card, centred (like CSS background-size: cover). */
function drawCover(ctx: CanvasRenderingContext2D, img: CanvasImageSource, w: number, h: number) {
  const iw = (img as HTMLImageElement).naturalWidth || w;
  const ih = (img as HTMLImageElement).naturalHeight || h;
  const scale = Math.max(w / iw, h / ih);
  ctx.drawImage(img, (w - iw * scale) / 2, (h - ih * scale) / 2, iw * scale, ih * scale);
}

let linesCache: { src: CanvasImageSource; w: number; h: number; canvas: HTMLCanvasElement } | null = null;

/**
 * The paper's line drawing and grain on their own, centred on mid grey, so a light ground can
 * carry them (blended soft-light) without being darkened by the brown they were printed on.
 * Built once per background and size.
 */
function paperLines(bg: CanvasImageSource, w: number, h: number): HTMLCanvasElement | null {
  if (linesCache && linesCache.src === bg && linesCache.w === w && linesCache.h === h) return linesCache.canvas;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const c = canvas.getContext('2d');
  if (!c) return null;
  drawCover(c, bg, w, h);
  const image = c.getImageData(0, 0, w, h);
  const px = image.data;
  let sum = 0;
  for (let i = 0; i < px.length; i += 4) sum += 0.3 * px[i]! + 0.59 * px[i + 1]! + 0.11 * px[i + 2]!;
  const mean = sum / (px.length / 4);
  for (let i = 0; i < px.length; i += 4) {
    const lum = 0.3 * px[i]! + 0.59 * px[i + 1]! + 0.11 * px[i + 2]!;
    const v = Math.max(0, Math.min(255, 128 + (lum - mean) * 3));
    px[i] = px[i + 1] = px[i + 2] = v;
  }
  c.putImageData(image, 0, 0);
  linesCache = { src: bg, w, h, canvas };
  return canvas;
}

/** Rounded rectangle path (ctx.roundRect is missing in older Safari). */
function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * The paper style (11/04): the printed FORWARD 卡 — brown with its line drawing, a large FORWARD
 * CARD title, each prompt with its English line over a white answer box, then the signature.
 * With a declaration: its sentence 「我參與 FORWARD，…」 behind a 金黃 rule, its English title small
 * above it, closing the card (11/08, the user's pick B; it sat under the title from 11/06), so
 * the top reads like the printed card; the visitor's name signs it at the bottom right. Each declaration has its ground
 * (11/08): the card's grey-brown, 灰藍 (the same paper re-hued), or 印刷金 with dark text.
 */
function drawPaperCard(
  ctx: CanvasRenderingContext2D,
  content: CardContent,
  format: CardFormat,
  bg?: CanvasImageSource,
  declaration?: Declaration | null,
) {
  const { width: w, height: h } = CARD_FORMATS[format];
  const story = format === 'story';
  // Only /design-trial/ sets this class: the declaration sentence leads, the title and the labels
  // step back (設計強化規格, 成果卡圖片).
  const trial = typeof document !== 'undefined' && document.documentElement.classList.contains('trial');
  const pad = story ? 96 : 80;
  const ground = declaration?.ground ?? 'card';
  // 印刷金 is light: the 金黃 and white text turn dark brown on it, like the site's 金黃 panels.
  const light = ground === 'gold';
  const gold = light ? color('base') : color('accent');
  const onGround = light ? color('base') : color('white');
  const ink = color('base');

  ctx.fillStyle = color(light ? 'print-gold' : ground === 'slate' ? 'card-slate' : 'card-brown');
  ctx.fillRect(0, 0, w, h);
  if (bg && light) {
    const lines = paperLines(bg, w, h);
    if (lines) {
      ctx.globalCompositeOperation = 'soft-light';
      ctx.drawImage(lines, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
    }
  } else if (bg) {
    drawCover(ctx, bg, w, h);
    // 灰藍: the same paper with its hue changed; its lightness, lines and grain stay.
    if (ground === 'slate') {
      ctx.globalCompositeOperation = 'color';
      ctx.fillStyle = color('card-slate');
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  ctx.textBaseline = 'top';
  const maxWidth = w - pad * 2;
  const measure = (s: string) => ctx.measureText(s).width;

  let y = pad;
  const kicker = story ? 28 : trial ? 18 : 22;
  const footer = story ? 26 : trial ? 18 : 22;

  // Title, stacked on the story like the paper card.
  const titleSize = story ? 150 : trial && declaration ? 72 : 96;
  ctx.fillStyle = gold;
  ctx.font = `800 ${titleSize}px ${DISPLAY}`;
  for (const line of story ? ['FORWARD', 'CARD'] : ['FORWARD CARD']) {
    ctx.fillText(line, pad, y);
    y += titleSize * 0.9;
  }
  y += story ? 80 : 44;

  // The declaration, measured now and drawn last: its English title as a small label right above
  // the sentence (32px, 11/08: a size down), behind one 金黃 rule, near the bottom of the card.
  // wrapText lets a 「，」 or 「。」 hang past the line it ends rather than start the next one, so the
  // sentence steps down a pixel at a time (at most 6) until every line, mark included, fits (11/06).
  const indent = 30;
  const column = maxWidth - indent;
  let hero = story ? 44 : trial ? 36 : 32;
  let declLines: string[] = [];
  if (declaration) {
    for (const min = hero - 6; ; hero -= 1) {
      ctx.font = `700 ${hero}px ${BODY}`;
      declLines = wrapText(declaration.text, column, measure);
      if (hero <= min || declLines.every((line) => measure(line) <= column)) break;
    }
  }
  const heroLine = Math.round(hero * 1.45);
  const labelGap = story ? 18 : 12;
  const declHeight = declaration ? kicker + labelGap + declLines.length * heroLine : 0;

  const top = y;
  const bottom = h - pad;
  const layoutAt = (size: number, gratitude: string, anticipate: string) => {
    const boxPad = Math.round(size * 0.85);
    ctx.font = `400 ${size}px ${BODY}`;
    const a = wrapText(gratitude, maxWidth - boxPad * 2, measure);
    const b = wrapText(anticipate, maxWidth - boxPad * 2, measure);
    const prompt = Math.max(Math.round(size * 1.05), story ? 36 : 30);
    // The English line under each prompt, larger since 11/08 (it was 62% and hard to read).
    const en = Math.round(prompt * 0.8);
    const line = Math.round(size * 1.55);
    // Boxes keep a few lines' height even for a short answer, like the large boxes on paper.
    const minLines = story ? 4 : 3;
    const boxA = boxPad * 2 + Math.max(a.length, minLines) * line;
    const boxB = boxPad * 2 + Math.max(b.length, minLines) * line;
    // A little more room between each prompt and its English line (11/08).
    const promptGap = Math.round(prompt * 0.3);
    const head = prompt * 1.3 + promptGap + en * 1.4 + 14;
    const gap = Math.round(size * 1.2);
    // The signature a little larger (11/06), never below 30px even when the answers are long.
    const sign = Math.max(Math.round(size * 1.2), story ? 36 : 30);
    // Under the boxes: the declaration, the signature under it, then clear space above the
    // sign-off (11/08); without a declaration, just the signature.
    const tail = declaration ? Math.round(size * 0.8) + declHeight + sign * 1.6 + footer + 18 : sign * 2;
    const total = head * 2 + boxA + boxB + gap + tail;
    return { size, a, b, boxPad, prompt, promptGap, en, line, boxA, boxB, head, gap, sign, total };
  };
  // Shrink until both boxes fit; very long answers lose their line breaks before overflowing.
  const fit = (gratitude: string, anticipate: string) => {
    for (let size = story ? 44 : 34; size >= MIN_SIZE; size -= 2) {
      const candidate = layoutAt(size, gratitude, anticipate);
      if (candidate.total <= bottom - top) return candidate;
    }
    return null;
  };
  const flat = (text: string) => text.replace(/\s*\n\s*/g, ' ');
  const layout =
    fit(content.text_gratitude, content.text_anticipate) ??
    fit(flat(content.text_gratitude), flat(content.text_anticipate)) ??
    layoutAt(MIN_SIZE, flat(content.text_gratitude), flat(content.text_anticipate));

  const block = (prompt: string, promptEn: string, lines: string[], box: number) => {
    ctx.fillStyle = gold;
    ctx.font = `400 ${layout.prompt}px ${HEADING}`;
    ctx.fillText(prompt, pad, y);
    y += layout.prompt * 1.3 + layout.promptGap;
    ctx.font = `700 ${layout.en}px ${DISPLAY}`;
    ctx.fillText(promptEn, pad, y);
    y += layout.en * 1.4 + 14;
    ctx.fillStyle = color('white');
    roundedRect(ctx, pad, y, maxWidth, box, story ? 32 : 26);
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.font = `400 ${layout.size}px ${BODY}`;
    let ty = y + layout.boxPad + (layout.line - layout.size) / 2;
    for (const line of lines) {
      ctx.fillText(line, pad + layout.boxPad, ty);
      ty += layout.line;
    }
    y += box;
  };
  block(PROMPTS.gratitude, PROMPTS_EN.gratitude, layout.a, layout.boxA);
  y += layout.gap;
  block(PROMPTS.anticipate, PROMPTS_EN.anticipate, layout.b, layout.boxB);

  const signature = (top: number) => {
    ctx.fillStyle = gold;
    ctx.font = `600 ${layout.sign}px ${BODY}`;
    ctx.textAlign = 'right';
    ctx.fillText(`— ${content.nickname}`, w - pad, top);
    ctx.textAlign = 'left';
  };

  // The declaration closes the card, near the bottom (or right under the boxes when the answers
  // are long), and the visitor's name signs it at the bottom right (11/08).
  if (!declaration) signature(y + layout.sign * 0.8);
  if (declaration) {
    const start = Math.max(y + Math.round(layout.size * 0.8), bottom - footer - 18 - layout.sign * 1.6 - declHeight);
    ctx.fillStyle = gold;
    ctx.font = `700 ${kicker}px ${DISPLAY}`;
    spaced(ctx, declaration.en, pad + indent, start, 5);
    const textTop = start + kicker + labelGap;
    ctx.font = `700 ${hero}px ${BODY}`;
    ctx.fillStyle = onGround;
    declLines.forEach((line, i) => ctx.fillText(line, pad + indent, textTop + i * heroLine + (heroLine - hero) / 2));
    ctx.fillStyle = gold;
    ctx.fillRect(pad, start + 2, 6, declHeight - 6);
    signature(start + declHeight + layout.sign * 0.5);
  }

  // Small sign-off in the bottom corner.
  ctx.fillStyle = light ? color('base', 0.7) : color('accent', 0.72);
  ctx.font = `700 ${footer}px ${DISPLAY}`;
  spaced(ctx, 'THE HOPE · FORWARD 2026', pad, h - pad * 0.62 - footer, 4);
}

/** The downloadable FORWARD 卡 (11/06, team choice): one 1:1 design, the paper card, with the
 *  chosen declaration closing it (the paper style alone has none). */
export function drawCard(
  ctx: CanvasRenderingContext2D,
  content: CardContent,
  format: CardFormat,
  declaration: Declaration,
  paperBg?: CanvasImageSource,
): void {
  drawPaperCard(ctx, content, format, paperBg, declaration);
}

let paperBg: Promise<HTMLImageElement | undefined> | null = null;

/** The paper style's background image, loaded once; the card still draws (plain brown) without it. */
function loadPaperBg(): Promise<HTMLImageElement | undefined> {
  paperBg ??= new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(undefined);
    img.src = paperBgUrl;
  });
  return paperBg;
}

export async function renderCardBlob(
  content: CardContent,
  format: CardFormat,
  declaration: Declaration,
): Promise<Blob> {
  await ensureCardFonts(content, declaration);
  const bg = await loadPaperBg();
  const { width, height } = CARD_FORMATS[format];
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not available');
  drawCard(ctx, content, format, declaration, bg);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode PNG'))), 'image/png');
  });
}
