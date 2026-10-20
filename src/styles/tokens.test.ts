import { describe, expect, it } from 'vitest';

/**
 * Guard for #22: brand colours live in tokens.css only, so a theme change is one edit.
 * Everything else must use the semantic tokens or rgb(var(--rgb-*) / alpha).
 */
const sources = import.meta.glob(['/src/**/*.{css,ts,tsx}', '!/src/**/*.test.ts'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// Deliberate exceptions, each with a reason.
const ALLOWED_FILES: Record<string, string> = {
  '/src/styles/tokens.css': 'the single source of theme colours',
  '/src/sections/Transition.css': 'painted mood scenes; chapter is removed by #17／#25',
};
// Neutral black for shadows, masks and the video letterbox is not a brand colour.
const NEUTRAL = /^(rgba\(0, 0, 0, [0-9.]+\)|#000)$/;
const LITERAL = /#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d[^)]*\)/g;

describe('theme tokens', () => {
  it('found the source files', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(20);
  });

  it('has no hard-coded colours outside tokens.css', () => {
    const offenders: string[] = [];
    for (const [file, text] of Object.entries(sources)) {
      if (file in ALLOWED_FILES) continue;
      for (const match of text.match(LITERAL) ?? []) {
        if (!NEUTRAL.test(match)) offenders.push(`${file}: ${match}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
