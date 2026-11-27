import { describe, expect, it } from 'vitest';
import { buildXlsx, cellText, columnName, type SheetSpec } from './xlsx';
import { assertWellFormed, decodeCellText, readSheet, readTextParts, readZip } from './zip.inspect';

const MODIFIED = new Date(2026, 10, 30, 22, 15, 0);

// Answers a person could type that a spreadsheet might treat as something other than text (#76).
const TRICKY = [
  '=1+1',
  '=HYPERLINK("https://example.invalid","點我")',
  '+886 912 345 678',
  '-2',
  '@SUM(A1:A2)',
  '第一行\n第二行\n第三行',
  'tab\there',
  '<b>粗體</b> & "引號" \'單引號\'',
  '_x0041_ 看起來像 Excel 的跳脫',
  '感謝神 🙏🏻 期待更多 ✨',
  '  前後有空白  ',
  '',
];

const spec = (rows: string[][]): SheetSpec => ({
  name: 'FORWARD 卡',
  columns: [
    { header: '送出時間', width: 20 },
    { header: '名字', width: 16 },
    { header: '題目一內容', width: 60 },
    { header: '題目二內容', width: 60 },
  ],
  rows,
});

describe('cellText', () => {
  it.each([
    ['&, < and >', 'a & b < c > d', 'a &amp; b &lt; c &gt; d'],
    ['quotes, which need no escaping in text', `"'`, `"'`],
    ['tab and newline', 'a\tb\nc', 'a\tb\nc'],
    ['a carriage return, which XML would turn into a newline', 'a\rb', 'a_x000D_b'],
    ['other control characters', 'a\u0001b\u001Fc', 'a_x0001_b_x001F_c'],
    ['U+FFFE and U+FFFF', '￾￿', '_xFFFE__xFFFF_'],
    ['text that already looks like an Excel escape', '_x0041_', '_x005F_x0041_'],
    ['formula-like text, unchanged', '=1+1', '=1+1'],
    ['emoji and Chinese, unchanged', '感謝 🙏🏻', '感謝 🙏🏻'],
  ])('%s', (_, input, stored) => {
    expect(cellText(input)).toBe(stored);
    expect(decodeCellText(stored)).toBe(input);
  });
});

describe('columnName', () => {
  it.each([
    [0, 'A'],
    [3, 'D'],
    [25, 'Z'],
    [26, 'AA'],
    [701, 'ZZ'],
    [702, 'AAA'],
  ])('%i → %s', (index, name) => {
    expect(columnName(index)).toBe(name);
  });
});

describe('buildXlsx (#76)', () => {
  const rows = TRICKY.map((text, i) => [`2026-11-${String(10 + i).padStart(2, '0')} 08:00:00`, `名字${i}`, text, TRICKY[TRICKY.length - 1 - i] ?? '']);
  const file = buildXlsx(spec(rows), MODIFIED);
  const parts = readTextParts(file);

  it('holds exactly the parts a workbook needs, in a valid ZIP', () => {
    expect(readZip(file).map((e) => e.name)).toEqual([
      '[Content_Types].xml',
      '_rels/.rels',
      'xl/workbook.xml',
      'xl/_rels/workbook.xml.rels',
      'xl/styles.xml',
      'xl/sharedStrings.xml',
      'xl/worksheets/sheet1.xml',
    ]);
  });

  it('every part is well-formed XML', () => {
    for (const [name, xml] of parts) expect(() => assertWellFormed(xml), name).not.toThrow();
  });

  it('every part the content types or relationships name is in the archive', () => {
    const overrides = [...(parts.get('[Content_Types].xml') ?? '').matchAll(/PartName="\/([^"]+)"/g)].map((m) => m[1]);
    expect(overrides.every((name) => parts.has(name ?? ''))).toBe(true);
    const targets = [...(parts.get('xl/_rels/workbook.xml.rels') ?? '').matchAll(/Target="([^"]+)"/g)].map((m) => `xl/${m[1]}`);
    expect(targets.every((name) => parts.has(name))).toBe(true);
    expect(parts.get('_rels/.rels')).toContain('Target="xl/workbook.xml"');
  });

  it('reads back a header row, then every value exactly as given', () => {
    const { rows: read } = readSheet(parts);
    expect(read[0]).toEqual(['送出時間', '名字', '題目一內容', '題目二內容']);
    expect(read.slice(1)).toEqual(rows);
  });

  it('writes every cell as a shared string and no formula at all', () => {
    const sheet = parts.get('xl/worksheets/sheet1.xml') ?? '';
    const cells = sheet.match(/<c /g) ?? [];
    expect(cells).toHaveLength((rows.length + 1) * 4);
    expect(sheet.match(/<c [^>]*t="s"/g)).toHaveLength(cells.length);
    expect(sheet).not.toMatch(/<f[ >]/);
    expect(parts.get('xl/sharedStrings.xml')).not.toMatch(/<f[ >]/);
  });

  it('styles the header bold and every answer as wrapped text that stays text when edited', () => {
    const { styles } = readSheet(parts);
    expect(styles[0]).toEqual(['1', '1', '1', '1']);
    expect(styles.slice(1).flat().every((s) => s === '2')).toBe(true);
    const xfs = [...(parts.get('xl/styles.xml') ?? '').matchAll(/<xf [^>]*>/g)].map((m) => m[0]);
    // cellStyleXfs has one xf, so cellXfs index 1 and 2 are entries 2 and 3.
    expect(xfs[2]).toMatch(/numFmtId="49".*fontId="1"/);
    expect(xfs[3]).toMatch(/numFmtId="49"/);
    expect(xfs[3]).toMatch(/quotePrefix="1"/);
    expect(parts.get('xl/styles.xml')).toContain('<alignment vertical="top" wrapText="1"/>');
  });

  it('stores each distinct text once and counts every use', () => {
    const sst = parts.get('xl/sharedStrings.xml') ?? '';
    const unique = new Set([['送出時間', '名字', '題目一內容', '題目二內容'], ...rows].flat());
    expect(sst).toContain(`count="${(rows.length + 1) * 4}"`);
    expect(sst).toContain(`uniqueCount="${unique.size}"`);
    expect(sst.match(/<si>/g)).toHaveLength(unique.size);
  });

  it('declares the used range, freezes the header row and sets the column widths', () => {
    const sheet = parts.get('xl/worksheets/sheet1.xml') ?? '';
    expect(sheet).toContain(`<dimension ref="A1:D${rows.length + 1}"/>`);
    expect(sheet).toContain('<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>');
    expect(sheet).toContain('<col min="3" max="3" width="60" customWidth="1"/>');
  });

  it('escapes the sheet name and writes an empty sheet as just the header', () => {
    const empty = readTextParts(buildXlsx({ ...spec([]), name: 'A & B "卡"' }, MODIFIED));
    expect(empty.get('xl/workbook.xml')).toContain('name="A &amp; B &quot;卡&quot;"');
    expect(readSheet(empty).rows).toEqual([['送出時間', '名字', '題目一內容', '題目二內容']]);
    expect(empty.get('xl/worksheets/sheet1.xml')).toContain('<dimension ref="A1:D1"/>');
  });

  it('refuses a sheet without columns', () => {
    expect(() => buildXlsx({ name: 'x', columns: [], rows: [] }, MODIFIED)).toThrow(RangeError);
  });
});
