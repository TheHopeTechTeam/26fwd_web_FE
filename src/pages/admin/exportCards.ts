import type { AdminExportCard } from '../../api';
import { parseTimestamp } from '../../lib/format';
import { buildXlsx, type SheetColumn } from '../../lib/xlsx';

// Fixed by #76: one row per card, these four columns in this order. 題目一 is the gratitude
// prompt and 題目二 the anticipation prompt, in the order the form and the card show them.
export const EXPORT_COLUMNS: readonly SheetColumn[] = [
  { header: '送出時間', width: 20 },
  { header: '名字', width: 16 },
  { header: '題目一內容', width: 60 },
  { header: '題目二內容', width: 60 },
];

export const EXPORT_SHEET_NAME = 'FORWARD 卡';

// Taiwan has kept UTC+8 without daylight saving since 1979, so a fixed offset gives the same
// answer on every device, whatever its own time zone.
const TAIPEI_OFFSET_MS = 8 * 3_600_000;
const pad = (n: number) => String(n).padStart(2, '0');

/** "2026-11-30 22:15:03" in Taiwan time; the stored text unchanged if it is not a timestamp. */
export function taipeiTimestamp(value: string): string {
  const date = parseTimestamp(value);
  if (!date) return value;
  const t = new Date(date.getTime() + TAIPEI_OFFSET_MS);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())} ${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}:${pad(t.getUTCSeconds())}`;
}

/**
 * The file's rows, oldest card first. The API already sends them in that order; sorting by the
 * parsed time again keeps it so even if old rows carry SQLite's timestamp format. Cards sent at the
 * same moment keep the API's order, and a timestamp that cannot be read goes last.
 */
export function exportRows(cards: readonly AdminExportCard[]): string[][] {
  const time = (card: AdminExportCard) => parseTimestamp(card.created_at)?.getTime() ?? Number.POSITIVE_INFINITY;
  return [...cards]
    .sort((a, b) => {
      const ta = time(a);
      const tb = time(b);
      return ta < tb ? -1 : ta > tb ? 1 : 0;
    })
    .map((card) => [taipeiTimestamp(card.created_at), card.nickname, card.text_gratitude, card.text_anticipate]);
}

/** forward-cards-2026-11-30-2215.xlsx, from the download time in Taiwan. */
export function exportFileName(now: Date): string {
  const stamp = taipeiTimestamp(now.toISOString());
  return `forward-cards-${stamp.slice(0, 10)}-${stamp.slice(11, 13)}${stamp.slice(14, 16)}.xlsx`;
}

/** The .xlsx bytes for these cards: a header row, then one row per card. */
export function cardWorkbook(cards: readonly AdminExportCard[], now: Date): Uint8Array<ArrayBuffer> {
  return buildXlsx({ name: EXPORT_SHEET_NAME, columns: EXPORT_COLUMNS, rows: exportRows(cards) }, now);
}
