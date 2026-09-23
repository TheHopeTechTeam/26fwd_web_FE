import { describe, expect, it } from 'vitest';
import { easeOutCubic, formatDuration, formatNumber, parseTimestamp, relativeTime } from './format';

describe('formatNumber', () => {
  it('adds thousands separators', () => {
    expect(formatNumber(1800)).toBe('1,800');
    expect(formatNumber(12)).toBe('12');
  });
});

describe('easeOutCubic', () => {
  it('clamps to [0, 1]', () => {
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeOutCubic(2)).toBe(1);
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875);
  });
});

describe('parseTimestamp', () => {
  it('reads ISO and SQLite datetime strings as UTC', () => {
    expect(parseTimestamp('2026-11-14T10:00:00Z')?.toISOString()).toBe('2026-11-14T10:00:00.000Z');
    expect(parseTimestamp('2026-11-14 10:00:00')?.toISOString()).toBe('2026-11-14T10:00:00.000Z');
    expect(parseTimestamp('not a date')).toBeNull();
  });
});

describe('relativeTime', () => {
  const now = Date.parse('2026-11-14T12:00:00Z');
  it('describes recent times in Traditional Chinese', () => {
    expect(relativeTime('2026-11-14T11:59:30Z', now)).toBe('剛剛');
    expect(relativeTime('2026-11-14T10:00:00Z', now)).toBe('2 小時前');
    expect(relativeTime('2026-11-13T12:00:00Z', now)).toBe('昨天');
  });
  it('falls back to a date after 30 days and to "" for garbage', () => {
    expect(relativeTime('2026-09-01T00:00:00Z', now)).toMatch(/2026/);
    expect(relativeTime('???', now)).toBe('');
  });
});

describe('formatDuration', () => {
  it('formats m:ss', () => {
    expect(formatDuration(83)).toBe('1:23');
    expect(formatDuration(Number.NaN)).toBe('--:--');
  });
});
