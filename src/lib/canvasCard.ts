import { wrapText } from './wrapText';

/**
 * Personal Forward Card image (US-09): native Canvas 2D, no html2canvas. Two sizes
 * (square post / 9:16 story) and three neutral placeholder themes to swap once the
 * official KV and palette are signed off.
 */
export type CardFormat = 'square' | 'story';
export type CardTheme = 'gold' | 'night' | 'paper';

export const CARD_FORMATS: Record<CardFormat, { width: number; height: number; label: string }> = {
  square: { width: 1080, height: 1080, label: '貼文 1:1' },
  story: { width: 1080, height: 1920, label: '限時動態 9:16' },
};

interface Theme {
  label: string;
  swatch: string;
  background: [string, string];
  text: string;
  accent: string;
  muted: string;
  line: string;
}

export const CARD_THEMES: Record<CardTheme, Theme> = {
  gold: {
    label: '金色',
    swatch: '#ffc946',
    background: ['#ffd873', '#ffc233'],
    text: '#1c272b',
    accent: '#1c272b',
    muted: 'rgba(28, 39, 43, 0.62)',
    line: 'rgba(28, 39, 43, 0.22)',
  },
  night: {
    label: '深藍',
    swatch: '#1c272b',
    background: ['#2a3c44', '#141c1f'],
    text: '#ffffff',
    accent: '#ffc946',
    muted: 'rgba(255, 255, 255, 0.62)',
    line: 'rgba(255, 255, 255, 0.18)',
  },
  paper: {
    label: '米白',
    swatch: '#f4efe4',
    background: ['#faf6ee', '#ebe3d2'],
    text: '#1c272b',
    accent: '#9a6b12',
    muted: 'rgba(28, 39, 43, 0.58)',
    line: 'rgba(28, 39, 43, 0.16)',
  },
};

export interface CardContent {
  nickname: string;
  text_gratitude: string;
  text_anticipate: string;
}

export const PROMPTS = { gratitude: '我感謝神…', anticipate: '跟神一起期待…' } as const;

const BODY = '"Noto Sans", "PingFang TC", "Hiragino Sans TC", "Noto Sans TC", "Noto Sans CJK TC", "Microsoft JhengHei", sans-serif';
const HEADING = '"FWD Heading TC", "PingFang TC", "Noto Sans TC", "Noto Sans CJK TC", "Microsoft JhengHei", sans-serif';
const DISPLAY = 'Montserrat, "Noto Sans", sans-serif';

/** Canvas can't wait for web fonts by itself, so load the ones it uses first. */
export async function ensureCardFonts(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  await Promise.allSettled([
    document.fonts.load(`800 40px Montserrat`, 'FORWARD'),
    document.fonts.load(`700 40px Montserrat`, 'There is more'),
    document.fonts.load(`40px "FWD Heading TC"`, `${PROMPTS.gratitude}${PROMPTS.anticipate}`),
    document.fonts.load(`40px "Noto Sans"`, 'Aa'),
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

export function drawCard(ctx: CanvasRenderingContext2D, content: CardContent, format: CardFormat, themeId: CardTheme): void {
  const { width: w, height: h } = CARD_FORMATS[format];
  const theme = CARD_THEMES[themeId];
  const story = format === 'story';
  const pad = story ? 104 : 88;

  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, theme.background[0]);
  bg.addColorStop(1, theme.background[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Quiet arch motif in the corner (the "door" of There is more). No people.
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 3;
  const archW = story ? 420 : 300;
  const archX = w - pad - archW + (story ? 60 : 40);
  const archTop = story ? h * 0.08 : h * 0.06;
  ctx.beginPath();
  ctx.moveTo(archX, h);
  ctx.lineTo(archX, archTop + archW / 2);
  ctx.arc(archX + archW / 2, archTop + archW / 2, archW / 2, Math.PI, 0);
  ctx.lineTo(archX + archW, h);
  ctx.stroke();
  ctx.restore();

  ctx.textBaseline = 'top';

  // Header
  ctx.fillStyle = theme.muted;
  ctx.font = `700 26px ${DISPLAY}`;
  spaced(ctx, 'FORWARD CARD', pad, pad, 7);
  spaced(ctx, '2026', w - pad, pad, 7, 'right');

  // Footer
  const footerTop = h - pad - 58;
  ctx.fillStyle = theme.line;
  ctx.fillRect(pad, footerTop - 36, w - pad * 2, 2);
  ctx.fillStyle = theme.text;
  ctx.font = `800 46px ${DISPLAY}`;
  ctx.fillText('FORWARD', pad, footerTop);
  const fw = ctx.measureText('FORWARD').width;
  ctx.fillStyle = theme.accent;
  ctx.font = `700 30px ${DISPLAY}`;
  ctx.fillText('There is more', pad + fw + 22, footerTop + 12);
  ctx.fillStyle = theme.muted;
  ctx.font = `600 22px ${DISPLAY}`;
  spaced(ctx, 'THE HOPE', w - pad, footerTop + 16, 5, 'right');

  // Body: shrink the type until both answers and the signature fit.
  const top = pad + 26 + (story ? 120 : 64);
  const bottom = footerTop - 36 - (story ? 90 : 48);
  const maxWidth = w - pad * 2;
  const measure = (s: string) => ctx.measureText(s).width;

  let size = story ? 52 : 44;
  let layout: { a: string[]; b: string[]; label: number; line: number; gap: number; sign: number; total: number } | null = null;
  for (; size >= 22; size -= 2) {
    ctx.font = `400 ${size}px ${BODY}`;
    const a = wrapText(content.text_gratitude, maxWidth, measure);
    const b = wrapText(content.text_anticipate, maxWidth, measure);
    const label = Math.round(size * 0.78);
    const line = Math.round(size * 1.6);
    const gap = Math.round(size * 1.3);
    const sign = Math.round(size * 0.9);
    const total = label * 1.9 * 2 + (a.length + b.length) * line + gap * 2 + sign * 1.4;
    layout = { a, b, label, line, gap, sign, total };
    if (total <= bottom - top) break;
  }
  if (!layout) return;

  let y = story ? top + Math.max(0, (bottom - top - layout.total) / 2) : top;
  const block = (prompt: string, lines: string[]) => {
    ctx.fillStyle = theme.accent;
    ctx.font = `400 ${layout.label}px ${HEADING}`;
    ctx.fillText(prompt, pad, y);
    y += layout.label * 1.9;
    ctx.fillStyle = theme.text;
    ctx.font = `400 ${size}px ${BODY}`;
    for (const line of lines) {
      ctx.fillText(line, pad, y);
      y += layout.line;
    }
  };

  block(PROMPTS.gratitude, layout.a);
  y += layout.gap / 2;
  ctx.fillStyle = theme.line;
  ctx.fillRect(pad, y, 120, 3);
  y += layout.gap / 2;
  block(PROMPTS.anticipate, layout.b);
  y += layout.gap * 0.6;

  ctx.fillStyle = theme.text;
  ctx.font = `600 ${layout.sign}px ${BODY}`;
  ctx.textAlign = 'right';
  ctx.fillText(`— ${content.nickname}`, w - pad, y);
  ctx.textAlign = 'left';
}

export async function renderCardBlob(content: CardContent, format: CardFormat, theme: CardTheme): Promise<Blob> {
  await ensureCardFonts();
  const { width, height } = CARD_FORMATS[format];
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not available');
  drawCard(ctx, content, format, theme);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode PNG'))), 'image/png');
  });
}
