import { describe, expect, it } from 'vitest';
import { splitPhrases } from './Phrases';

describe('splitPhrases', () => {
  it('splits after CJK punctuation', () => {
    expect(splitPhrases('神的信實，寫在每一張臉上')).toEqual(['神的信實，', '寫在每一張臉上']);
  });

  it('also splits at a zero-width space, which is dropped', () => {
    expect(splitPhrases('教會，就是一張張​尋求神的臉。')).toEqual(['教會，', '就是一張張', '尋求神的臉。']);
  });

  it('also breaks at a space, kept as its own part', () => {
    expect(splitPhrases('在改變的路上 不想再討厭自己')).toEqual(['在改變的路上', ' ', '不想再討厭自己']);
    expect(splitPhrases('FORWARD 是十一之外的慷慨奉獻。')).toEqual(['FORWARD', ' ', '是十一之外的慷慨奉獻。']);
  });

  it('keeps a line break from the copy as its own part', () => {
    expect(splitPhrases('在改變的路上\n不想再討厭自己')).toEqual(['在改變的路上', '\n', '不想再討厭自己']);
  });
});
