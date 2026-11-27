/**
 * A one-sheet .xlsx workbook of plain text, built in the browser for the reviewers' download (#76).
 *
 * Every cell is a shared string, so Excel, Numbers, LibreOffice and Google Sheets show it as text
 * and never evaluate it: an answer that starts with =, +, - or @ cannot run as a formula. The cell
 * style also carries the Text number format ("@") and quotePrefix, so the cell stays text even
 * when someone edits it in Excel later. No formula element is ever written.
 */
import { createZip } from './zip';

export interface SheetColumn {
  header: string;
  /** Column width in characters. */
  width: number;
}

export interface SheetSpec {
  /** Up to 31 characters, none of : \ / ? * [ ] */
  name: string;
  columns: readonly SheetColumn[];
  /** One array per row, one string per column; the header row is added from `columns`. */
  rows: ReadonlyArray<readonly string[]>;
}

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const PACKAGE_RELS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const OFFICE_RELS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml';

// Indexes into cellXfs in styles.xml below.
const HEADER_STYLE = 1;
const TEXT_STYLE = 2;

const escapeXml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttribute = (value: string) => escapeXml(value).replace(/"/g, '&quot;');

/**
 * Cell text the way SpreadsheetML stores it. Characters XML 1.0 cannot carry (control characters
 * other than tab and newline, U+FFFE, U+FFFF) become Excel's _xHHHH_ escape, and text that already
 * looks like such an escape gets its underscore escaped (_x005F_), so every character reads back
 * exactly as it was typed. Tab and newline stay as they are.
 */
export function cellText(value: string): string {
  return escapeXml(
    value
      .replace(/_(x[0-9A-Fa-f]{4}_)/g, '_x005F_$1')
      .replace(/[\u0000-\u0008\u000B-\u001F￾￿]/g, (c) => `_x${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}_`),
  );
}

/** A, B, … Z, AA, AB, … for a zero-based column index. */
export function columnName(index: number): string {
  let name = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  return name;
}

const STYLES = `${XML_HEAD}<styleSheet xmlns="${MAIN}">\
<fonts count="2"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font>\
<font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font></fonts>\
<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>\
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>\
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>\
<cellXfs count="3">\
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>\
<xf numFmtId="49" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>\
<xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1" quotePrefix="1">\
<alignment vertical="top" wrapText="1"/></xf>\
</cellXfs>\
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>\
</styleSheet>`;

const CONTENT_TYPES = `${XML_HEAD}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\
<Default Extension="xml" ContentType="application/xml"/>\
<Override PartName="/xl/workbook.xml" ContentType="${CONTENT_TYPE}.sheet.main+xml"/>\
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="${CONTENT_TYPE}.worksheet+xml"/>\
<Override PartName="/xl/styles.xml" ContentType="${CONTENT_TYPE}.styles+xml"/>\
<Override PartName="/xl/sharedStrings.xml" ContentType="${CONTENT_TYPE}.sharedStrings+xml"/>\
</Types>`;

const ROOT_RELS = `${XML_HEAD}<Relationships xmlns="${PACKAGE_RELS}">\
<Relationship Id="rId1" Type="${OFFICE_RELS}/officeDocument" Target="xl/workbook.xml"/>\
</Relationships>`;

const WORKBOOK_RELS = `${XML_HEAD}<Relationships xmlns="${PACKAGE_RELS}">\
<Relationship Id="rId1" Type="${OFFICE_RELS}/worksheet" Target="worksheets/sheet1.xml"/>\
<Relationship Id="rId2" Type="${OFFICE_RELS}/styles" Target="styles.xml"/>\
<Relationship Id="rId3" Type="${OFFICE_RELS}/sharedStrings" Target="sharedStrings.xml"/>\
</Relationships>`;

/** The workbook as .xlsx bytes. The header row is bold and stays in view while scrolling. */
export function buildXlsx(sheet: SheetSpec, modified: Date): Uint8Array<ArrayBuffer> {
  if (sheet.columns.length === 0) throw new RangeError('A sheet needs at least one column');
  const lastColumn = columnName(sheet.columns.length - 1);

  // Shared strings: each distinct text is stored once and cells point at it by index.
  const strings = new Map<string, number>();
  let references = 0;
  const cell = (ref: string, value: string, style: number) => {
    let index = strings.get(value);
    if (index === undefined) {
      index = strings.size;
      strings.set(value, index);
    }
    references++;
    return `<c r="${ref}" s="${style}" t="s"><v>${index}</v></c>`;
  };

  const rows = [sheet.columns.map((column) => column.header), ...sheet.rows];
  const sheetRows = rows.map((values, r) => {
    const n = r + 1;
    const style = r === 0 ? HEADER_STYLE : TEXT_STYLE;
    const cells = sheet.columns.map((_, c) => cell(`${columnName(c)}${n}`, values[c] ?? '', style));
    return `<row r="${n}">${cells.join('')}</row>`;
  });

  const worksheet = `${XML_HEAD}<worksheet xmlns="${MAIN}">\
<dimension ref="A1:${lastColumn}${rows.length}"/>\
<sheetViews><sheetView workbookViewId="0">\
<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>\
<selection pane="bottomLeft" activeCell="A2" sqref="A2"/>\
</sheetView></sheetViews>\
<cols>${sheet.columns.map((column, i) => `<col min="${i + 1}" max="${i + 1}" width="${column.width}" customWidth="1"/>`).join('')}</cols>\
<sheetData>${sheetRows.join('')}</sheetData>\
</worksheet>`;

  const sharedStrings = `${XML_HEAD}<sst xmlns="${MAIN}" count="${references}" uniqueCount="${strings.size}">\
${[...strings.keys()].map((text) => `<si><t xml:space="preserve">${cellText(text)}</t></si>`).join('')}\
</sst>`;

  const workbook = `${XML_HEAD}<workbook xmlns="${MAIN}" xmlns:r="${OFFICE_RELS}">\
<bookViews><workbookView/></bookViews>\
<sheets><sheet name="${escapeAttribute(sheet.name)}" sheetId="1" r:id="rId1"/></sheets>\
</workbook>`;

  const encoder = new TextEncoder();
  return createZip(
    [
      { name: '[Content_Types].xml', data: encoder.encode(CONTENT_TYPES) },
      { name: '_rels/.rels', data: encoder.encode(ROOT_RELS) },
      { name: 'xl/workbook.xml', data: encoder.encode(workbook) },
      { name: 'xl/_rels/workbook.xml.rels', data: encoder.encode(WORKBOOK_RELS) },
      { name: 'xl/styles.xml', data: encoder.encode(STYLES) },
      { name: 'xl/sharedStrings.xml', data: encoder.encode(sharedStrings) },
      { name: 'xl/worksheets/sheet1.xml', data: encoder.encode(worksheet) },
    ],
    modified,
  );
}
