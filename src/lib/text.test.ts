import { describe, expect, it } from 'vitest';
import { WEIGHTED_CASES } from './text.cases';
import { codePointLength, displayLength, normalizeNewlines, truncateToLimit, validateDraft, validateField, weightedLength } from './text';

describe('codePointLength', () => {
  it('counts CJK and emoji as one code point each', () => {
    expect(codePointLength('感謝神')).toBe(3);
    expect(codePointLength('🙏')).toBe(1);
    expect('🙏'.length).toBe(2);
  });
});

describe('weighted count (#16, shared cases)', () => {
  for (const c of WEIGHTED_CASES) {
    it(c.name, () => {
      expect(weightedLength(c.text)).toBe(c.weighted);
      expect(displayLength('text_gratitude', c.text)).toBe(c.shown);
      expect(validateField('text_gratitude', c.text)).toBe(c.fits ? null : 'too_long');
      expect(validateField('text_anticipate', c.text)).toBe(c.fits ? null : 'too_long');
    });
  }

  it('counts after trim, like the server', () => {
    expect(displayLength('text_gratitude', '  感謝  \n')).toBe(2);
    expect(validateField('text_gratitude', `   ${'謝'.repeat(140)}   `)).toBeNull();
  });

  it('leaves the nickname on code points', () => {
    expect(displayLength('nickname', 'abc')).toBe(3);
    expect(validateField('nickname', 'a'.repeat(20))).toBeNull();
    expect(validateField('nickname', 'a'.repeat(21))).toBe('too_long');
  });
});

describe('truncateToLimit', () => {
  it('cuts the prompts at the weighted limit', () => {
    expect(truncateToLimit('text_gratitude', '謝'.repeat(150))).toBe('謝'.repeat(140));
    expect(truncateToLimit('text_gratitude', `${'謝'.repeat(139)}abc`)).toBe(`${'謝'.repeat(139)}ab`);
  });

  it('cuts at the 280 code-point cap even under 140 weighted', () => {
    expect(truncateToLimit('text_gratitude', 'a'.repeat(300))).toBe('a'.repeat(280));
    expect(truncateToLimit('text_gratitude', '👨‍👩‍👧'.repeat(60))).toBe('👨‍👩‍👧'.repeat(56));
  });

  it('never splits a composed emoji', () => {
    // 139 CJK leaves room for one more grapheme: the whole family, not half of it.
    expect(truncateToLimit('text_gratitude', `${'謝'.repeat(139)}👨‍👩‍👧x`)).toBe(`${'謝'.repeat(139)}👨‍👩‍👧`);
    // Nickname: 19 letters + a 5-code-point emoji would be 24, so the emoji goes whole.
    expect(truncateToLimit('nickname', `${'a'.repeat(19)}👨‍👩‍👧`)).toBe('a'.repeat(19));
    expect(truncateToLimit('nickname', 'ab🙏c')).toBe('ab🙏c');
  });

  it('drops line breaks past the tenth but keeps the words after them', () => {
    expect(truncateToLimit('text_gratitude', `${'a\n'.repeat(15)}end`)).toBe(`${'a\n'.repeat(10)}aaaaaend`);
    expect(truncateToLimit('nickname', 'ab')).toBe('ab');
  });

  it('keeps text that already fits, untouched', () => {
    expect(truncateToLimit('text_gratitude', '  感謝  ')).toBe('  感謝  ');
    expect(truncateToLimit('nickname', '短')).toBe('短');
  });

  it('handles a very long paste in one pass', () => {
    const start = performance.now();
    const kept = truncateToLimit('text_gratitude', 'Wow！好棒 '.repeat(20000));
    expect(performance.now() - start).toBeLessThan(1000);
    expect(weightedLength(kept)).toBeLessThanOrEqual(140);
    expect(validateField('text_gratitude', kept)).toBeNull();
  });
});

describe('validateField', () => {
  it('trims before checking length', () => {
    expect(validateField('nickname', '   ')).toBe('required');
    expect(validateField('nickname', `  ${'a'.repeat(20)}  `)).toBeNull();
    expect(validateField('nickname', 'a'.repeat(21))).toBe('too_long');
  });

  it('enforces 140 weighted characters for both prompts', () => {
    expect(validateField('text_gratitude', '謝'.repeat(140))).toBeNull();
    expect(validateField('text_anticipate', '盼'.repeat(141))).toBe('too_long');
  });

  it('allows newline and tab in the prompts but not in the nickname', () => {
    expect(validateField('text_gratitude', '第一行\n第二行\t結尾')).toBeNull();
    expect(validateField('nickname', '小\n恩')).toBe('invalid_chars');
  });

  it('rejects other control and bidi override characters', () => {
    expect(validateField('text_gratitude', 'bad\u0007bell')).toBe('invalid_chars');
    expect(validateField('text_anticipate', 'spoof\u202Etxt')).toBe('invalid_chars');
  });

  it('treats \\r\\n as a single newline', () => {
    expect(normalizeNewlines('a\r\nb\rc')).toBe('a\nb\nc');
    expect(validateField('text_gratitude', 'a\r\nb')).toBeNull();
  });
});

describe('validateDraft', () => {
  it('requires consent', () => {
    const errors = validateDraft({ nickname: '小恩', text_gratitude: '感謝', text_anticipate: '期待', agreed_to_publish: false });
    expect(errors).toEqual({ agreed_to_publish: 'required' });
  });
});
