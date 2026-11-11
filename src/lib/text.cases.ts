/**
 * Shared edge cases for the #16 weighted count. The form, the mock API and the backend all
 * use src/lib/text.ts, and their tests read these same cases, so a change of rule shows up
 * everywhere at once. `weighted` is the exact value, `shown` what the counter displays.
 */
export interface WeightedCase {
  name: string;
  text: string;
  weighted: number;
  shown: number;
  /** Whether a prompt with exactly this text (after trim) may be sent. */
  fits: boolean;
}

const CJK_249 = '謝'.repeat(249);

export const WEIGHTED_CASES: WeightedCase[] = [
  { name: 'Ian 10/20 example, full-width ！', text: 'Wow！好棒', weighted: 4.5, shown: 5, fits: true },
  { name: 'Ian 10/20 example, half-width !', text: 'Wow!好棒', weighted: 4, shown: 4, fits: true },
  { name: 'space between words is half', text: 'a b', weighted: 1.5, shown: 2, fits: true },
  { name: 'full-width space counts 1', text: '感　謝', weighted: 3, shown: 3, fits: true },
  { name: 'newline counts 1', text: '感謝\n期待', weighted: 5, shown: 5, fits: true },
  { name: 'tab is half-width blank', text: '感\t謝', weighted: 2.5, shown: 3, fits: true },
  { name: 'emoji is 1', text: '🙏', weighted: 1, shown: 1, fits: true },
  { name: 'family emoji is one grapheme', text: '👨‍👩‍👧', weighted: 1, shown: 1, fits: true },
  { name: 'flag is one grapheme', text: '🇹🇼', weighted: 1, shown: 1, fits: true },
  { name: 'skin-tone emoji is one grapheme', text: '👍🏽', weighted: 1, shown: 1, fits: true },
  { name: 'combining accent is one grapheme of "other text"', text: 'é', weighted: 1, shown: 1, fits: true },
  { name: 'kana and hangul count 1', text: 'ありがとう감사', weighted: 7, shown: 7, fits: true },
  { name: '250 CJK fits', text: '謝'.repeat(250), weighted: 250, shown: 250, fits: true },
  { name: '251 CJK is over', text: '謝'.repeat(251), weighted: 251, shown: 251, fits: false },
  { name: '249 CJK + 2 half-width fits exactly', text: `${CJK_249}ab`, weighted: 250, shown: 250, fits: true },
  { name: '249 CJK + 3 half-width is 250.5: shown 251, over', text: `${CJK_249}abc`, weighted: 250.5, shown: 251, fits: false },
  { name: '500 half-width fits (250 weighted, 500 code points)', text: 'a'.repeat(500), weighted: 250, shown: 250, fits: true },
  { name: '501 half-width is over', text: 'a'.repeat(501), weighted: 250.5, shown: 251, fits: false },
  // 100 family emoji: 100 weighted but 100 × 5 = 500 code points, right at the raw cap.
  { name: '100 family emoji hit the 500 code-point cap exactly', text: '👨‍👩‍👧'.repeat(100), weighted: 100, shown: 100, fits: true },
  { name: '101 family emoji pass the 500 code-point cap', text: '👨‍👩‍👧'.repeat(101), weighted: 101, shown: 101, fits: false },
  // Line breaks: each counts 1, and at most 2 per prompt (11/10).
  { name: '2 line breaks fit', text: `${'a\n'.repeat(2)}a`, weighted: 3.5, shown: 4, fits: true },
  { name: '3 line breaks are over, though only 5 weighted', text: `${'a\n'.repeat(3)}a`, weighted: 5, shown: 5, fits: false },
];
