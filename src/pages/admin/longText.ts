import type { AdminCard } from '../../api';
import { displayLength } from '../../lib/text';

/**
 * Cards worth reading first (Ian, 11/11, after #69 raised each answer to 250): the review console
 * marks a card when either answer is over 100, counted the way the form's counter counts
 * (src/lib/text.ts: half-width characters 0.5, anything else 1, rounded up). The mark is a reading
 * aid only; it changes nothing about the AI judgment or auto-publish.
 */
export const LONG_TEXT_OVER = 100;

export interface LongPart {
  label: '感謝' | '期待';
  length: number;
}

/** The answers over LONG_TEXT_OVER, gratitude first; empty when the card is not long. */
export function longParts(card: Pick<AdminCard, 'text_gratitude' | 'text_anticipate'>): LongPart[] {
  const parts: LongPart[] = [
    { label: '感謝', length: displayLength('text_gratitude', card.text_gratitude) },
    { label: '期待', length: displayLength('text_anticipate', card.text_anticipate) },
  ];
  return parts.filter((part) => part.length > LONG_TEXT_OVER);
}

/** 「長文：感謝 180 字、期待 120 字」 with only the long answers, or null for a card that is not long. */
export function longTextNote(card: Pick<AdminCard, 'text_gratitude' | 'text_anticipate'>): string | null {
  const parts = longParts(card);
  return parts.length ? `長文：${parts.map((part) => `${part.label} ${part.length} 字`).join('、')}` : null;
}
