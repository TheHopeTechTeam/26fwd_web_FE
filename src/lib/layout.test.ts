import { describe, expect, it } from 'vitest';
import { assignColumns, columnsForWidth } from './masonry';
import { tokenize, wrapText } from './wrapText';

describe('assignColumns', () => {
  const heights = [300, 100, 100, 100, 250, 80];

  it('places each item in the currently shortest column', () => {
    const cols = assignColumns(heights, 2, (h) => h);
    expect(cols).toEqual([[300, 250], [100, 100, 100, 80]]);
  });

  it('never moves existing items when more are appended', () => {
    const before = assignColumns(heights.slice(0, 4), 3, (h) => h);
    const after = assignColumns([...heights.slice(0, 4), 500, 40], 3, (h) => h);
    before.forEach((col, i) => expect(after[i]?.slice(0, col.length)).toEqual(col));
  });

  it('picks a column count from the container width', () => {
    expect(columnsForWidth(320)).toBe(1);
    expect(columnsForWidth(700)).toBe(2);
    expect(columnsForWidth(5000)).toBe(4);
  });
});

describe('wrapText', () => {
  // Monospace stand-in: every character is 1 unit wide.
  const measure = (s: string) => Array.from(s).length;

  it('breaks CJK text at any character', () => {
    expect(wrapText('感謝神過去七年的信實', 4, measure)).toEqual(['感謝神過', '去七年的', '信實']);
  });

  it('keeps Latin words whole', () => {
    expect(tokenize('There is more')).toEqual(['There ', 'is ', 'more']);
    expect(wrapText('There is more', 8, measure)).toEqual(['There is', 'more']);
  });

  it('keeps closing punctuation off the start of a line', () => {
    expect(wrapText('感謝神。期待', 3, measure)).toEqual(['感謝神。', '期待']);
  });

  it('respects explicit newlines and hard-breaks very long words', () => {
    expect(wrapText('第一行\n第二行', 10, measure)).toEqual(['第一行', '第二行']);
    expect(wrapText('abcdefghij', 4, measure)).toEqual(['abcd', 'efgh', 'ij']);
  });
});
