/**
 * Decides whether the wording BB wrote in the sheet's 「想改成」 column is already on the page.
 * Whitespace and punctuation are ignored (the page and the sheet punctuate differently), and the
 * text is checked clause by clause so a half-applied edit shows exactly what is missing.
 */

const PUNCT = /[\s\u00a0，。！？；：、,.!?;:·…「」『』“”‘’"'()（）《》〈〉\-—–+｜|]+/g;

export const stripKey = (s: string): string => s.replace(PUNCT, '');

export type NextKind = 'none' | 'keep' | 'remove' | 'waiting' | 'change';

/** What the 「想改成」 cell asks for. */
export function classifyNext(next: string): NextKind {
  const t = next.trim();
  if (!t) return 'none';
  if (/^(ok|okay|確認|沿用)[.。!！]?$/i.test(t)) return 'keep';
  if (t === '刪除' || t === '不需要分類') return 'remove';
  if (t.length < 120 && /comms|input/i.test(t)) return 'waiting';
  return 'change';
}

/** Clauses worth checking: split on line breaks, " / " and sentence punctuation. */
export function clausesOf(text: string): string[] {
  return text
    .replace(/[ \t]*[（(][^）)\n]*[）)][ \t]*$/gm, '') // a trailing 「（送出中：…）」 note, not page wording
    .split(/\n+|\s\/\s/)
    .flatMap((part) => part.split(/[，。！？；：、,.!?;:]/))
    .map((c) => c.trim())
    .filter((c) => stripKey(c).length >= 3);
}

function bigrams(s: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length - 1; i += 1) out.push(s.slice(i, i + 2));
  return out;
}

export type VerdictState = 'applied' | 'likely' | 'partial' | 'missing' | 'removed' | 'still-there';

export interface Verdict {
  state: VerdictState;
  found: number;
  total: number;
  /** Clauses of the new text that cannot be found on the page. */
  missing: string[];
}

/**
 * Short clauses (labels, figures) are often laid out in another order on the page, e.g. the
 * number before its label; count them as "likely" when most character pairs are still there.
 */
const LIKELY_MAX_LEN = 16;
const LIKELY_RATIO = 0.8;

export function compareChange(next: string, region: string): Verdict {
  const hay = stripKey(region);
  const clauses = clausesOf(next);
  const missing: string[] = [];
  let found = 0;
  let likely = 0;
  for (const clause of clauses) {
    const key = stripKey(clause);
    if (hay.includes(key)) {
      found += 1;
      continue;
    }
    if (key.length <= LIKELY_MAX_LEN) {
      const pairs = bigrams(key);
      const hit = pairs.filter((p) => hay.includes(p)).length;
      if (pairs.length > 0 && hit / pairs.length >= LIKELY_RATIO) {
        found += 1;
        likely += 1;
        continue;
      }
    }
    missing.push(clause);
  }
  const total = clauses.length;
  let state: VerdictState;
  if (total === 0 || missing.length === 0) state = likely > 0 ? 'likely' : 'applied';
  else if (found === 0) state = 'missing';
  else state = 'partial';
  return { state, found, total, missing };
}

/** 「刪除」: the old wording must be gone from the page. */
export function compareRemoval(old: string, page: string): Verdict {
  const hay = stripKey(page);
  const clauses = clausesOf(old).filter((c) => stripKey(c).length >= 6);
  const present = clauses.filter((c) => hay.includes(stripKey(c)));
  return { state: present.length > 0 ? 'still-there' : 'removed', found: clauses.length - present.length, total: clauses.length, missing: present };
}
