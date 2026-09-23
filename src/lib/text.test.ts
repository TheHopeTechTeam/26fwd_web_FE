import { describe, expect, it } from 'vitest';
import { codePointLength, normalizeNewlines, truncateCodePoints, validateDraft, validateField } from './text';

describe('codePointLength', () => {
  it('counts CJK and emoji as one code point each', () => {
    expect(codePointLength('感謝神')).toBe(3);
    expect(codePointLength('🙏')).toBe(1);
    expect('🙏'.length).toBe(2);
  });
});

describe('truncateCodePoints', () => {
  it('never splits a surrogate pair', () => {
    expect(truncateCodePoints('ab🙏c', 3)).toBe('ab🙏');
    expect(truncateCodePoints('短', 20)).toBe('短');
  });
});

describe('validateField', () => {
  it('trims before checking length', () => {
    expect(validateField('nickname', '   ')).toBe('required');
    expect(validateField('nickname', `  ${'a'.repeat(20)}  `)).toBeNull();
    expect(validateField('nickname', 'a'.repeat(21))).toBe('too_long');
  });

  it('enforces 140 code points for both prompts', () => {
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
