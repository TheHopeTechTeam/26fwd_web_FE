/**
 * Test-only readers for what src/lib/zip.ts and src/lib/xlsx.ts write (#76): unpack a stored ZIP
 * archive while checking every header, check that XML tags nest, and decode cell text. Nothing in
 * the site imports this file.
 */
import { crc32 } from './zip';

export interface ReadEntry {
  name: string;
  flags: number;
  method: number;
  crc: number;
  /** MS-DOS date and time fields as stored. */
  time: number;
  date: number;
  data: Uint8Array;
}

const decoder = new TextDecoder('utf-8', { fatal: true });

/** Every entry, in central directory order. Throws if any header disagrees with another. */
export function readZip(bytes: Uint8Array): ReadEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const fail = (what: string): never => {
    throw new Error(`Bad ZIP: ${what}`);
  };
  const end = bytes.length - 22;
  if (end < 0 || view.getUint32(end, true) !== 0x06054b50) fail('no end of central directory record');
  const count = view.getUint16(end + 10, true);
  if (view.getUint16(end + 8, true) !== count) fail('entry counts differ');
  const centralSize = view.getUint32(end + 12, true);
  let at = view.getUint32(end + 16, true);
  if (at + centralSize !== end) fail('central directory size or offset');

  const entries: ReadEntry[] = [];
  for (let i = 0; i < count; i++) {
    if (view.getUint32(at, true) !== 0x02014b50) fail(`central header ${i}`);
    const entry = {
      flags: view.getUint16(at + 8, true),
      method: view.getUint16(at + 10, true),
      time: view.getUint16(at + 12, true),
      date: view.getUint16(at + 14, true),
      crc: view.getUint32(at + 16, true),
      size: view.getUint32(at + 20, true),
    };
    if (view.getUint32(at + 24, true) !== entry.size) fail(`stored entry ${i} has different sizes`);
    const nameLength = view.getUint16(at + 28, true);
    const name = decoder.decode(bytes.subarray(at + 46, at + 46 + nameLength));
    const local = view.getUint32(at + 42, true);

    if (view.getUint32(local, true) !== 0x04034b50) fail(`local header of ${name}`);
    const same: Array<[number, number]> = [
      [view.getUint16(local + 6, true), entry.flags],
      [view.getUint16(local + 8, true), entry.method],
      [view.getUint16(local + 10, true), entry.time],
      [view.getUint16(local + 12, true), entry.date],
      [view.getUint32(local + 14, true), entry.crc],
      [view.getUint32(local + 18, true), entry.size],
      [view.getUint32(local + 22, true), entry.size],
      [view.getUint16(local + 26, true), nameLength],
    ];
    if (same.some(([a, b]) => a !== b)) fail(`local and central headers of ${name} differ`);
    const start = local + 30 + nameLength + view.getUint16(local + 28, true);
    const data = bytes.subarray(start, start + entry.size);
    if (data.length !== entry.size || crc32(data) !== entry.crc) fail(`data or CRC of ${name}`);

    entries.push({ name, flags: entry.flags, method: entry.method, crc: entry.crc, time: entry.time, date: entry.date, data });
    at += 46 + nameLength;
  }
  return entries;
}

/** The archive's text entries by name. */
export function readTextParts(bytes: Uint8Array): Map<string, string> {
  return new Map(readZip(bytes).map((entry) => [entry.name, decoder.decode(entry.data)]));
}

/**
 * Throws unless every tag is closed in order, the only entities are the five XML ones or numeric
 * ones, and no text or attribute holds a raw < or &. Enough to catch an unescaped value.
 */
export function assertWellFormed(xml: string): void {
  const body = xml.replace(/^<\?xml[^?]*\?>\s*/, '');
  const stack: string[] = [];
  const token = /<(\/?)([A-Za-z_][\w:.-]*)((?:\s+[\w:.-]+="[^"<]*")*)\s*(\/?)>|([^<]+)|(<)/g;
  let rootClosed = false;
  for (const m of body.matchAll(token)) {
    const [, closing, name, attributes, selfClosing, text, stray] = m;
    if (stray) throw new Error(`Raw < or broken tag at ${m.index}`);
    const checkEntities = (s: string) => {
      const bad = /&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9A-Fa-f]+);)/.exec(s);
      if (bad) throw new Error(`Raw & at ${m.index}`);
    };
    if (text !== undefined) {
      if (stack.length === 0 && text.trim()) throw new Error('Text outside the root element');
      checkEntities(text);
      continue;
    }
    if (rootClosed) throw new Error('More than one root element');
    checkEntities(attributes ?? '');
    if (closing) {
      if (stack.pop() !== name) throw new Error(`</${name}> does not close the open tag`);
      if (stack.length === 0) rootClosed = true;
    } else if (!selfClosing) stack.push(name ?? '');
    else if (stack.length === 0) rootClosed = true;
  }
  if (stack.length > 0) throw new Error(`Unclosed <${stack.at(-1)}>`);
  if (!rootClosed) throw new Error('No root element');
}

/** Cell text back to what the reviewer will see: XML entities, then Excel's _xHHHH_ escapes. */
export function decodeCellText(stored: string): string {
  return stored
    .replace(/&(lt|gt|quot|apos|amp);/g, (_, e: string) => ({ lt: '<', gt: '>', quot: '"', apos: "'", amp: '&' })[e] ?? '')
    .replace(/_x([0-9A-Fa-f]{4})_/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
}

/** The sheet's cells as rows of text, resolved through the shared strings, plus each cell's style. */
export function readSheet(parts: Map<string, string>): { rows: string[][]; styles: string[][] } {
  const strings = [...(parts.get('xl/sharedStrings.xml') ?? '').matchAll(/<si><t xml:space="preserve">([\s\S]*?)<\/t><\/si>/g)].map((m) =>
    decodeCellText(m[1] ?? ''),
  );
  const rows: string[][] = [];
  const styles: string[][] = [];
  for (const row of (parts.get('xl/worksheets/sheet1.xml') ?? '').matchAll(/<row r="(\d+)">([\s\S]*?)<\/row>/g)) {
    const cells = [...(row[2] ?? '').matchAll(/<c r="([A-Z]+)(\d+)" s="(\d+)" t="s"><v>(\d+)<\/v><\/c>/g)];
    if (cells.some((c) => c[2] !== row[1])) throw new Error(`Cell outside row ${row[1]}`);
    rows.push(cells.map((c) => strings[Number(c[4])] ?? 'MISSING'));
    styles.push(cells.map((c) => c[3] ?? ''));
  }
  return { rows, styles };
}
