/**
 * Forward Card text rules (US-07, DATA-01～03). Lengths count Unicode code points after
 * trim, matching what the backend enforces, so an emoji counts the same on both sides.
 */
export const LIMITS = {
  nickname: 20,
  text_gratitude: 140,
  text_anticipate: 140,
} as const;

export type CardField = keyof typeof LIMITS;

export function codePointLength(value: string): number {
  let n = 0;
  for (const _ of value) n++;
  return n;
}

export function truncateCodePoints(value: string, max: number): string {
  if (codePointLength(value) <= max) return value;
  return Array.from(value).slice(0, max).join('');
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
  if (codePointLength(value) > LIMITS[field]) return 'too_long';
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
