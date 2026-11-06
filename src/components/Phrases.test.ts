import { describe, expect, it } from 'vitest';
import { splitPhrases } from './Phrases';

describe('splitPhrases', () => {
  it('splits after CJK punctuation', () => {
    expect(splitPhrases('神的信實，寫在每一張臉上')).toEqual(['神的信實，', '寫在每一張臉上']);
  });

  it('also splits at a zero-width space, which is dropped', () => {
    expect(splitPhrases('教會，就是一張張​尋求神的臉。')).toEqual(['教會，', '就是一張張', '尋求神的臉。']);
  });
});
