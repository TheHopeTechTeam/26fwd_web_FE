const BREAK_AFTER = new Set(Array.from('，、：；。！？'));
/** A zero-width space in the copy marks one more place a long clause may break (11/06). */
const SOFT_BREAK = '\u200b';

/** Splits after CJK punctuation (no regex lookbehind, which older iOS Safari rejects). A space
 *  also separates clauses (quotes such as 「在改變的路上 不想再討厭自己」 use one instead of a
 *  comma); it comes back as its own ' ' part, so the line can break there (11/08). */
export function splitPhrases(text: string): string[] {
  const parts: string[] = [];
  let current = '';
  for (const ch of text) {
    if (ch === SOFT_BREAK) {
      if (current) parts.push(current);
      current = '';
      continue;
    }
    if (ch === ' ') {
      if (current) parts.push(current);
      current = '';
      if (parts.length && parts[parts.length - 1] !== ' ' && parts[parts.length - 1] !== '\n') parts.push(' ');
      continue;
    }
    // A line break in the copy (the polaroid titles carry one) stays a line break.
    if (ch === '\n') {
      if (current) parts.push(current);
      current = '';
      if (parts[parts.length - 1] === ' ') parts.pop();
      if (parts.length) parts.push('\n');
      continue;
    }
    current += ch;
    if (BREAK_AFTER.has(ch)) {
      parts.push(current);
      current = '';
    }
  }
  if (current) parts.push(current);
  return parts;
}

/**
 * Keeps each clause of a Chinese heading together, so lines break at punctuation or a space
 * ("神的信實，/ 寫在每一張臉上") rather than mid-phrase. A clause wider than the
 * line still wraps inside itself.
 */
export function Phrases({ text }: { text: string }) {
  return (
    <>
      {splitPhrases(text).map((part, i) =>
        part === ' ' ? (
          ' '
        ) : part === '\n' ? (
          <br key={i} />
        ) : (
          <span key={i} className="phrase">
            {part}
          </span>
        ),
      )}
    </>
  );
}
