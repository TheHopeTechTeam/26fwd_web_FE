import { wrapText } from './wrapText';
import paperBgUrl from '../assets/card/forward-card-bg.webp';

import type { Declaration } from '../data/content';

/**
 * Personal FORWARD 卡 image (US-09): native Canvas 2D, no html2canvas. Since 11/06 one design,
 * 1:1: the printed FORWARD 卡's look with the declaration of faith the visitor picks (#23) in a
 * 金黃 band. The 9:16 size is kept in the drawing code but no longer offered.
 */
export type CardFormat = 'square' | 'story';

export const CARD_FORMATS: Record<CardFormat, { width: number; height: number; label: string }> = {
  square: { width: 1080, height: 1080, label: '貼文 1:1' },
  story: { width: 1080, height: 1920, label: '限時動態 9:16' },
};

type Channel = 'base' | 'navy' | 'accent' | 'earth' | 'light' | 'white' | 'card-brown';

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
 * With a declaration (11/06, team choice): its sentence 「我參與 FORWARD，…」 large — the line the
 * visitor takes away — under the title, behind a 金黃 rule, with its English title small above it.
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
  const pad = story ? 96 : 80;
  const gold = color('accent');
  const ink = color('base');

  ctx.fillStyle = color('card-brown');
  ctx.fillRect(0, 0, w, h);
  if (bg) {
    const iw = (bg as HTMLImageElement).naturalWidth || w;
    const ih = (bg as HTMLImageElement).naturalHeight || h;
    const scale = Math.max(w / iw, h / ih);
    ctx.drawImage(bg, (w - iw * scale) / 2, (h - ih * scale) / 2, iw * scale, ih * scale);
  }

  ctx.textBaseline = 'top';
  const maxWidth = w - pad * 2;
  const measure = (s: string) => ctx.measureText(s).width;

  let y = pad;
  const kicker = story ? 28 : 22;

  // Title, stacked on the story like the paper card.
  const titleSize = story ? 150 : declaration ? 84 : 96;
  ctx.fillStyle = gold;
  ctx.font = `800 ${titleSize}px ${DISPLAY}`;
  for (const line of story ? ['FORWARD', 'CARD'] : ['FORWARD CARD']) {
    ctx.fillText(line, pad, y);
    y += titleSize * 0.9;
  }
  y += story ? 80 : declaration ? 34 : 44;

  // The declaration: its English title as a small label right above the sentence (11/06, the
  // user's choice over heading the card), then the sentence, large, behind one 金黃 rule.
  if (declaration) {
    const indent = 30;
    const column = maxWidth - indent;
    // wrapText lets a 「，」 or 「。」 hang past the line it ends rather than start the next one, so the
    // sentence steps down a pixel at a time (at most 6) until every line, mark included, fits (11/06).
    let hero = story ? 54 : 40;
    let lines: string[] = [];
    for (const min = hero - 6; ; hero -= 1) {
      ctx.font = `700 ${hero}px ${BODY}`;
      lines = wrapText(declaration.text, column, measure);
      if (hero <= min || lines.every((line) => measure(line) <= column)) break;
    }
    const heroLine = Math.round(hero * 1.45);
    const start = y;
    ctx.fillStyle = gold;
    ctx.font = `700 ${kicker}px ${DISPLAY}`;
    spaced(ctx, declaration.en, pad + indent, y, 5);
    y += kicker + (story ? 18 : 12);
    ctx.font = `700 ${hero}px ${BODY}`;
    ctx.fillStyle = color('white');
    lines.forEach((line, i) => ctx.fillText(line, pad + indent, y + i * heroLine + (heroLine - hero) / 2));
    y += lines.length * heroLine;
    ctx.fillStyle = gold;
    ctx.fillRect(pad, start + 2, 6, y - start - 6);
    y += story ? 64 : 40;
  }

  const top = y;
  const bottom = h - pad;
  const layoutAt = (size: number, gratitude: string, anticipate: string) => {
    const boxPad = Math.round(size * 0.85);
    ctx.font = `400 ${size}px ${BODY}`;
    const a = wrapText(gratitude, maxWidth - boxPad * 2, measure);
    const b = wrapText(anticipate, maxWidth - boxPad * 2, measure);
    const prompt = Math.max(Math.round(size * 1.05), story ? 36 : 30);
    const en = Math.round(prompt * 0.62);
    const line = Math.round(size * 1.55);
    // Boxes keep a few lines' height even for a short answer, like the large boxes on paper.
    const minLines = story ? 4 : 3;
    const boxA = boxPad * 2 + Math.max(a.length, minLines) * line;
    const boxB = boxPad * 2 + Math.max(b.length, minLines) * line;
    const head = prompt * 1.3 + en * 1.4 + 14;
    const gap = Math.round(size * 1.2);
    // The signature a little larger (11/06), never below 30px even when the answers are long.
    const sign = Math.max(Math.round(size * 1.2), story ? 36 : 30);
    const total = head * 2 + boxA + boxB + gap + sign * 2.2;
    return { size, a, b, boxPad, prompt, en, line, boxA, boxB, head, gap, sign, total };
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
    y += layout.prompt * 1.3;
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
  y += layout.sign;

  ctx.fillStyle = gold;
  ctx.font = `600 ${layout.sign}px ${BODY}`;
  ctx.textAlign = 'right';
  ctx.fillText(`— ${content.nickname}`, w - pad, y);
  ctx.textAlign = 'left';

  // Small sign-off in the bottom corner.
  ctx.fillStyle = color('accent', 0.72);
  ctx.font = `700 ${story ? 26 : 22}px ${DISPLAY}`;
  spaced(ctx, 'THE HOPE · FORWARD 2026', pad, h - pad * 0.62 - (story ? 26 : 22), 4);
}

/** The downloadable FORWARD 卡 (11/06, team choice): one 1:1 design, the paper card, with the
 *  chosen declaration under its title (the paper style alone has none). */
export function drawCard(
  ctx: CanvasRenderingContext2D,
  content: CardContent,
  format: CardFormat,
  declaration: Declaration,
  paperBg?: CanvasImageSource,
): void {
  drawPaperCard(ctx, content, format, paperBg, declaration.palette === 'paper' ? null : declaration);
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
