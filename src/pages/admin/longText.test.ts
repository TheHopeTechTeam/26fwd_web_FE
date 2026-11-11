import { describe, expect, it } from 'vitest';
import { createSeedCards } from '../../api/mock/seed';
import { validateField } from '../../lib/text';
import { LONG_TEXT_OVER, longParts, longTextNote } from './longText';

const card = (text_gratitude: string, text_anticipate = '期待明年。') => ({ text_gratitude, text_anticipate });

describe('the 長文 mark: either answer over 100, as the form counter counts (Ian, 11/11)', () => {
  it('leaves exactly 100 unmarked and marks 101', () => {
    expect(LONG_TEXT_OVER).toBe(100);
    expect(longTextNote(card('謝'.repeat(100)))).toBeNull();
    expect(longTextNote(card('謝'.repeat(101)))).toBe('長文：感謝 101 字');
  });

  it('counts half-width characters as 0.5 and rounds up like the counter', () => {
    // 200 half-width characters are 100; 99 CJK + 3 half-width are 100.5, which the counter shows as 101.
    expect(longTextNote(card('a'.repeat(200)))).toBeNull();
    expect(longTextNote(card(`${'謝'.repeat(99)}abc`))).toBe('長文：感謝 101 字');
  });

  it('counts a whole emoji and a line break as 1, and ignores the whitespace around the answer', () => {
    expect(longParts(card('👨‍👩‍👧'.repeat(101)))).toEqual([{ label: '感謝', length: 101 }]);
    expect(longTextNote(card(`  ${'謝'.repeat(50)}\r\n${'謝'.repeat(49)}\n  `))).toBeNull();
    expect(longTextNote(card(`${'謝'.repeat(50)}\n${'謝'.repeat(50)}`))).toBe('長文：感謝 101 字');
  });

  it('names only the long answers, gratitude first', () => {
    expect(longTextNote(card('感謝神！', '期'.repeat(150)))).toBe('長文：期待 150 字');
    expect(longTextNote(card('謝'.repeat(120), '期'.repeat(250)))).toBe('長文：感謝 120 字、期待 250 字');
    expect(longParts(card('感謝神！'))).toEqual([]);
  });

  it('the mock data has one long pending card, valid as a submission, so mock mode shows the mark', () => {
    const long = createSeedCards(Date.parse('2026-11-11T12:00:00Z')).filter((c) => longParts(c).length > 0);
    expect(long.map((c) => [c.id, c.status])).toEqual([['seed_p07', 'pending']]);
    const [seed] = long;
    expect(validateField('text_gratitude', seed!.text_gratitude)).toBeNull();
    expect(validateField('text_anticipate', seed!.text_anticipate)).toBeNull();
    expect(longTextNote(seed!)).toMatch(/^長文：感謝 \d+ 字$/);
  });
});
