// Characters that should not start a line (CJK closing punctuation and friends).
const NO_LINE_START = new Set(Array.from('，。、！？；：」』）》〉】〕…—,.!?;:)]}%'));

const CJK = /[\u2E80-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF\uFF00-\uFFEF\u3000-\u303F]/;

/**
 * Splits text into breakable units: each CJK character on its own, Latin words kept
 * together with their trailing space, so both scripts wrap naturally.
 */
export function tokenize(text: string): string[] {
  const tokens: string[] = [];
  let word = '';
  for (const ch of text) {
    if (CJK.test(ch)) {
      if (word) tokens.push(word);
      word = '';
      tokens.push(ch);
    } else if (ch === ' ') {
      tokens.push(word + ch);
      word = '';
    } else {
      word += ch;
    }
  }
  if (word) tokens.push(word);
  return tokens;
}

/**
 * Greedy line wrapping for canvas text. Honours explicit newlines, hard-breaks words
 * wider than the line, and pulls closing punctuation back onto the previous line.
 */
export function wrapText(text: string, maxWidth: number, measure: (s: string) => number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const token of tokenize(paragraph)) {
      const candidate = line + token;
      if (measure(candidate.trimEnd()) <= maxWidth || line === '') {
        if (line === '' && measure(token.trimEnd()) > maxWidth) {
          // A single word longer than the line: break it by character.
          for (const ch of token) {
            if (line && measure(line + ch) > maxWidth) {
              lines.push(line);
              line = '';
            }
            line += ch;
          }
        } else {
          line = candidate;
        }
      } else if (NO_LINE_START.has(token[0] ?? '') && token.length === 1) {
        line = candidate;
      } else {
        lines.push(line.trimEnd());
        line = token.trimStart();
      }
    }
    lines.push(line.trimEnd());
  }
  return lines;
}
