import { describe, expect, it } from 'vitest';
import type { AdminExportCard } from '../../api';
import { readSheet, readTextParts } from '../../lib/zip.inspect';
import { cardWorkbook, EXPORT_COLUMNS, exportFileName, exportRows, taipeiTimestamp } from './exportCards';

const card = (created_at: string, nickname = 'n', text_gratitude = 'g', text_anticipate = 'a'): AdminExportCard => ({
  nickname,
  text_gratitude,
  text_anticipate,
  created_at,
});

describe('taipeiTimestamp (#76)', () => {
  it.each([
    ['an ISO time', '2026-11-30T14:15:03.120Z', '2026-11-30 22:15:03'],
    ['the last second before midnight in Taiwan', '2026-11-30T15:59:59.999Z', '2026-11-30 23:59:59'],
    ['midnight in Taiwan, the next day', '2026-11-30T16:00:00.000Z', '2026-12-01 00:00:00'],
    ['the new year in Taiwan', '2026-12-31T16:00:00.000Z', '2027-01-01 00:00:00'],
    ["SQLite's format, which is UTC too", '2026-11-10 22:58:32', '2026-11-11 06:58:32'],
  ])('%s', (_, stored, shown) => {
    expect(taipeiTimestamp(stored)).toBe(shown);
  });

  it('keeps text that is not a timestamp as it is, so nothing is lost', () => {
    expect(taipeiTimestamp('not a time')).toBe('not a time');
  });
});

describe('exportRows (#76)', () => {
  it('is one row per card: time in Taiwan, name, 題目一 (gratitude), 題目二 (anticipation)', () => {
    expect(exportRows([card('2026-11-15T02:22:10.000Z', '小羊', '感謝', '期待')])).toEqual([['2026-11-15 10:22:10', '小羊', '感謝', '期待']]);
    expect(EXPORT_COLUMNS.map((c) => c.header)).toEqual(['送出時間', '名字', '題目一內容', '題目二內容']);
  });

  it('puts the oldest card first, also across timestamp formats, and keeps the order of cards sent at the same moment', () => {
    const rows = exportRows([
      card('2026-11-15T05:00:00.000Z', 'third'),
      card('2026-11-11 00:00:00', 'first'),
      card('2026-11-15T05:00:00.000Z', 'fourth'),
      card('2026-11-13T00:00:00.000Z', 'second'),
    ]);
    expect(rows.map((r) => r[1])).toEqual(['first', 'second', 'third', 'fourth']);
  });

  it('puts a card whose time cannot be read last instead of dropping it', () => {
    const rows = exportRows([card('???', 'odd'), card('2026-11-15T05:00:00.000Z', 'normal')]);
    expect(rows.map((r) => r[1])).toEqual(['normal', 'odd']);
    expect(rows[1]?.[0]).toBe('???');
  });
});

describe('exportFileName (#76)', () => {
  it('names the file after the download time in Taiwan', () => {
    expect(exportFileName(new Date('2026-11-30T14:15:59Z'))).toBe('forward-cards-2026-11-30-2215.xlsx');
    expect(exportFileName(new Date('2026-11-30T16:05:00Z'))).toBe('forward-cards-2026-12-01-0005.xlsx');
  });
});

describe('cardWorkbook (#76)', () => {
  it('has a header row and one row per card, with every answer exactly as stored', () => {
    const cards = [
      card('2026-11-15T04:58:00.000Z', '=cmd|"/c calc"!A0', '第一行\n第二行', '+1 期待'),
      card('2026-11-11T13:46:50.555Z', '@小羊', '-感謝 🙏🏻', '<期待> & "更多"'),
    ];
    const { rows } = readSheet(readTextParts(cardWorkbook(cards, new Date(2026, 10, 30, 22, 15))));
    expect(rows).toEqual([
      ['送出時間', '名字', '題目一內容', '題目二內容'],
      ['2026-11-11 21:46:50', '@小羊', '-感謝 🙏🏻', '<期待> & "更多"'],
      ['2026-11-15 12:58:00', '=cmd|"/c calc"!A0', '第一行\n第二行', '+1 期待'],
    ]);
  });

  it('is just the header row when there are no cards', () => {
    expect(readSheet(readTextParts(cardWorkbook([], new Date(2026, 10, 30)))).rows).toEqual([['送出時間', '名字', '題目一內容', '題目二內容']]);
  });
});
