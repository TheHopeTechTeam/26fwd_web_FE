import { describe, expect, it } from 'vitest';
import { isIllustration, TESTIMONIES } from './testimonies';

/**
 * Every testimony's picture must ship with the site (11/05): the photos live in public/, which
 * the build copies as is, so a missing or misnamed file here would be a broken image on the
 * deployed wall.
 */
const PUBLIC_FILES = new Set(Object.keys(import.meta.glob('/public/**/*.{webp,svg}')).map((p) => p.replace('/public/', '')));

describe('testimonies', () => {
  it('points every polaroid at a picture that exists in public/', () => {
    const missing = TESTIMONIES.filter((t) => !PUBLIC_FILES.has(t.avatar_url)).map((t) => `${t.id} ${t.avatar_url}`);
    expect(missing).toEqual([]);
  });

  it('names real photos after the sheet row, in lower case (the host is case-sensitive)', () => {
    for (const t of TESTIMONIES.filter((x) => !isIllustration(x))) {
      expect(t.avatar_url).toBe(`testimonies/${t.id}.webp`);
    }
  });

  it('has unique ids, a name, a title and a story for everyone', () => {
    expect(new Set(TESTIMONIES.map((t) => t.id)).size).toBe(TESTIMONIES.length);
    for (const t of TESTIMONIES) {
      expect(t.name.trim(), t.id).not.toBe('');
      expect(t.quote.trim(), t.id).not.toBe('');
      expect(t.story_full.trim(), t.id).not.toBe('');
    }
  });
});
