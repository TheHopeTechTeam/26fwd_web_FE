import type { OverlayPage, SheetRow } from './rows';

export const SHEET_URL = 'https://docs.google.com/spreadsheets/d/190DLSZM6-pB_Tf6wCcfpR6J-bcd6lv8O/edit';
const CSV_URL = 'https://docs.google.com/spreadsheets/d/190DLSZM6-pB_Tf6wCcfpR6J-bcd6lv8O/export?format=csv';
const TIMEOUT_MS = 10_000;

const PAGES: Record<string, OverlayPage> = { 首頁: 'home', 全站: 'all', 卡片牆頁: 'cards', 隱私頁: 'privacy' };

/** Minimal RFC 4180 parser: quoted cells, doubled quotes, newlines inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/** Columns: 優先序 編號 頁面 區段 出現方式 位置 目前文字 想改成 填寫人 狀態 備註. */
export function rowsFromCsv(records: string[][]): SheetRow[] {
  const rows: SheetRow[] = [];
  for (const r of records) {
    const id = Number(r[1]);
    const page = PAGES[(r[2] ?? '').trim()];
    if (!Number.isInteger(id) || id <= 0 || !page) continue;
    rows.push({
      id,
      prio: Number(r[0]) || 2,
      page,
      section: r[3] ?? '',
      when: r[4] ?? '',
      pos: r[5] ?? '',
      text: r[6] ?? '',
      next: r[7] ?? '',
      who: (r[8] ?? '').trim(),
      status: (r[9] ?? '').trim(),
      note: r[10] ?? '',
    });
  }
  return rows.sort((a, b) => a.id - b.id);
}

/** Reads the sheet's current contents; throws if it is unreachable or not the expected sheet. */
export async function fetchSheetRows(): Promise<SheetRow[]> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(CSV_URL, { signal: ctl.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = rowsFromCsv(parseCsv(await res.text()));
    if (rows.length < 20) throw new Error('unexpected sheet contents');
    return rows;
  } finally {
    clearTimeout(timer);
  }
}
