const BREAK_AFTER = new Set(Array.from('，、：；。！？'));

/** Splits after CJK punctuation (no regex lookbehind, which older iOS Safari rejects). */
export function splitPhrases(text: string): string[] {
  const parts: string[] = [];
  let current = '';
  for (const ch of text) {
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
 * Keeps each clause of a Chinese heading together, so lines break at punctuation
 * ("神的信實，/ 寫在每一張臉上") rather than mid-phrase. A clause wider than the
 * line still wraps inside itself.
 */
export function Phrases({ text }: { text: string }) {
  return (
    <>
      {splitPhrases(text).map((part, i) => (
        <span key={i} className="phrase">
          {part}
        </span>
      ))}
    </>
  );
}
