/**
 * Forward Card text rules (US-07, DATA-01～03). The form, the mock API and the backend
 * (functions/_lib/cards.ts) all import this file, so the count on screen is the count the
 * server enforces. Every length is measured after trim.
 *
 * The two prompts use the weighted count Ian approved in #16 (10/23), per grapheme (what a
 * reader sees as one character): half-width letters, digits, symbols and spaces 0.5;
 * everything else 1 (CJK, full-width characters and punctuation, a whole emoji such as 👨‍👩‍👧
 * or 🇹🇼, accented letters, a newline). At most 140 weighted, at most 280 code points so
 * long runs of half-width characters cannot flood the card, and at most 10 line breaks so one
 * answer cannot become a 70-line card on the wall (Jessie, per Alvis's #16 proposal, point 3).
 * The nickname stays 1–20 code points.
 */
export const LIMITS = {
  nickname: 20,
  text_gratitude: 140,
  text_anticipate: 140,
} as const;

/** Hard cap on the prompts' raw length, in code points (#16). */
export const PROMPT_MAX_CODE_POINTS = 280;

/** Most line breaks one prompt may contain (#16). */
export const PROMPT_MAX_LINE_BREAKS = 10;

export type CardField = keyof typeof LIMITS;

const isPrompt = (field: CardField) => field !== 'nickname';

export function codePointLength(value: string): number {
  let n = 0;
  for (const _ of value) n++;
  return n;
}

// Intl.Segmenter is in every current browser and in Workers; code points are the fallback,
// which can only over-count a multi-part emoji, never let text past the limit.
const segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;

export function graphemes(value: string): string[] {
  return segmenter ? Array.from(segmenter.segment(value), (s) => s.segment) : Array.from(value);
}

/** 0.5 for one printable ASCII character or a tab, 1 for any other grapheme. */
export function graphemeWeight(grapheme: string): number {
  return /^[\t\x20-\x7E]$/.test(grapheme) ? 0.5 : 1;
}

export function weightedLength(value: string): number {
  let total = 0;
  for (const g of graphemes(value)) total += graphemeWeight(g);
  return total;
}

/** The length a field is limited by: weighted for the prompts, code points for the nickname. */
export function fieldLength(field: CardField, value: string): number {
  return isPrompt(field) ? weightedLength(value) : codePointLength(value);
}

/** What the counter shows: whole numbers, rounded up (#16), so "140.5" never reads as fitting. */
export function displayLength(field: CardField, value: string): number {
  return Math.ceil(fieldLength(field, normalizeNewlines(value).trim()));
}

export function lineBreakCount(value: string): number {
  return value.split('\n').length - 1;
}

function overLimit(field: CardField, value: string): boolean {
  if (fieldLength(field, value) > LIMITS[field]) return true;
  if (!isPrompt(field)) return false;
  return codePointLength(value) > PROMPT_MAX_CODE_POINTS || lineBreakCount(value) > PROMPT_MAX_LINE_BREAKS;
}

/**
 * Cuts a typed or pasted value down to the field's limits, only ever between graphemes, so a
 * composed emoji is kept whole or dropped whole. Line breaks past the tenth are dropped but
 * the text after them is kept, so a pasted poem loses its extra breaks, not its words.
 * Leading whitespace is free, as in validateField, which trims; a single pass keeps a very
 * long paste cheap.
 */
export function truncateToLimit(field: CardField, value: string): string {
  if (!overLimit(field, value.trim())) return value;
  const lead = value.length - value.trimStart().length;
  const prompt = isPrompt(field);
  let kept = value.slice(0, lead);
  let length = 0;
  let points = 0;
  let breaks = 0;
  for (const g of graphemes(value.slice(lead))) {
    if (prompt && g === '\n') {
      if (breaks === PROMPT_MAX_LINE_BREAKS) continue;
      breaks++;
    }
    const p = codePointLength(g);
    const w = prompt ? graphemeWeight(g) : p;
    if (length + w > LIMITS[field] || (prompt && points + p > PROMPT_MAX_CODE_POINTS)) break;
    length += w;
    points += p;
    kept += g;
  }
  return kept;
}

/** Browsers may hand back \r\n from textareas; the API stores bare \n. */
export function normalizeNewlines(value: string): string {
  return value.replace(/\r\n?/g, '\n');
}

// C0/C1 control characters plus bidi override/isolate marks (which can visually spoof
// text on a public wall). Multi-line fields allow tab and newline only.
const SINGLE_LINE_BLOCKED = /[\u0000-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/;
const MULTI_LINE_BLOCKED = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/;

export type FieldError = 'required' | 'too_long' | 'invalid_chars';

export function validateField(field: CardField, raw: string): FieldError | null {
  const value = normalizeNewlines(raw).trim();
  if (!value) return 'required';
  if (overLimit(field, value)) return 'too_long';
  const blocked = field === 'nickname' ? SINGLE_LINE_BLOCKED : MULTI_LINE_BLOCKED;
  if (blocked.test(value)) return 'invalid_chars';
  return null;
}

export interface CardDraft {
  nickname: string;
  text_gratitude: string;
  text_anticipate: string;
  agreed_to_publish: boolean;
}

export type DraftErrors = Partial<Record<CardField, FieldError>> & { agreed_to_publish?: 'required' };

export function validateDraft(draft: CardDraft): DraftErrors {
  const errors: DraftErrors = {};
  for (const field of Object.keys(LIMITS) as CardField[]) {
    const error = validateField(field, draft[field]);
    if (error) errors[field] = error;
  }
  if (draft.agreed_to_publish !== true) errors.agreed_to_publish = 'required';
  return errors;
}

export const FIELD_ERROR_TEXT: Record<FieldError, string> = {
  required: '這一欄還沒填寫',
  too_long: '超過字數上限',
  invalid_chars: '含有無法使用的特殊字元',
};
