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

const CJK_139 = '謝'.repeat(139);

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
  { name: '140 CJK fits', text: '謝'.repeat(140), weighted: 140, shown: 140, fits: true },
  { name: '141 CJK is over', text: '謝'.repeat(141), weighted: 141, shown: 141, fits: false },
  { name: '139 CJK + 2 half-width fits exactly', text: `${CJK_139}ab`, weighted: 140, shown: 140, fits: true },
  { name: '139 CJK + 3 half-width is 140.5: shown 141, over', text: `${CJK_139}abc`, weighted: 140.5, shown: 141, fits: false },
  { name: '280 half-width fits (140 weighted, 280 code points)', text: 'a'.repeat(280), weighted: 140, shown: 140, fits: true },
  { name: '281 half-width is over', text: 'a'.repeat(281), weighted: 140.5, shown: 141, fits: false },
  // 56 family emoji: 56 weighted but 56 × 5 = 280 code points, right at the raw cap.
  { name: '56 family emoji hit the 280 code-point cap exactly', text: '👨‍👩‍👧'.repeat(56), weighted: 56, shown: 56, fits: true },
  { name: '57 family emoji pass the 280 code-point cap', text: '👨‍👩‍👧'.repeat(57), weighted: 57, shown: 57, fits: false },
  // Line breaks: each counts 1, and at most 10 per prompt.
  { name: '10 line breaks fit', text: `${'a\n'.repeat(10)}a`, weighted: 15.5, shown: 16, fits: true },
  { name: '11 line breaks are over, though only 17 weighted', text: `${'a\n'.repeat(11)}a`, weighted: 17, shown: 17, fits: false },
];
