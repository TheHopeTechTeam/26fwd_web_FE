/**
 * The smallest ZIP writer the reviewers' Excel download needs (#76). Every entry is stored, not
 * compressed, which every unzip tool and spreadsheet app reads, so no compression library is
 * bundled into the admin page. No ZIP64: the archive must stay under 65,535 entries and 4 GiB,
 * which a workbook of a few thousand cards is far from.
 */

export interface ZipEntry {
  /** Path inside the archive, with forward slashes. */
  name: string;
  data: Uint8Array;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

/** CRC-32 as ZIP, gzip and PNG use it. */
export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) crc = (CRC_TABLE[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

// MS-DOS date and time, the only kind ZIP headers hold: local time, two-second steps, 1980–2107.
function dosDateTime(when: Date): { time: number; date: number } {
  const year = Math.min(Math.max(when.getFullYear(), 1980), 2107);
  return {
    time: (when.getHours() << 11) | (when.getMinutes() << 5) | (when.getSeconds() >> 1),
    date: ((year - 1980) << 9) | ((when.getMonth() + 1) << 5) | when.getDate(),
  };
}

const LOCAL_HEADER = 30;
const CENTRAL_HEADER = 46;
const END_RECORD = 22;

/** A ZIP archive of `entries`, in that order, each stamped with `modified`. */
export function createZip(entries: readonly ZipEntry[], modified: Date): Uint8Array<ArrayBuffer> {
  const encoder = new TextEncoder();
  const { time, date } = dosDateTime(modified);
  const files = entries.map((entry) => ({
    name: encoder.encode(entry.name),
    // Bit 11: the name is UTF-8. Only set when it has to be, as most tools write plain ASCII names.
    flags: /^[\x20-\x7e]*$/.test(entry.name) ? 0 : 0x0800,
    data: entry.data,
    crc: crc32(entry.data),
  }));
  const localSize = files.reduce((sum, f) => sum + LOCAL_HEADER + f.name.length + f.data.length, 0);
  const centralSize = files.reduce((sum, f) => sum + CENTRAL_HEADER + f.name.length, 0);
  if (files.length > 0xffff || localSize + centralSize + END_RECORD > 0xffffffff) {
    throw new RangeError('Too much data for a ZIP archive without ZIP64');
  }

  const out = new Uint8Array(localSize + centralSize + END_RECORD);
  const view = new DataView(out.buffer);
  const offsets: number[] = [];
  let at = 0;
  for (const f of files) {
    offsets.push(at);
    view.setUint32(at, 0x04034b50, true); // local file header
    view.setUint16(at + 4, 20, true); // version needed to extract: 2.0
    view.setUint16(at + 6, f.flags, true);
    view.setUint16(at + 8, 0, true); // stored
    view.setUint16(at + 10, time, true);
    view.setUint16(at + 12, date, true);
    view.setUint32(at + 14, f.crc, true);
    view.setUint32(at + 18, f.data.length, true); // compressed size
    view.setUint32(at + 22, f.data.length, true); // uncompressed size
    view.setUint16(at + 26, f.name.length, true);
    view.setUint16(at + 28, 0, true); // no extra field
    out.set(f.name, at + LOCAL_HEADER);
    out.set(f.data, at + LOCAL_HEADER + f.name.length);
    at += LOCAL_HEADER + f.name.length + f.data.length;
  }

  const centralStart = at;
  files.forEach((f, i) => {
    view.setUint32(at, 0x02014b50, true); // central directory header
    view.setUint16(at + 4, 20, true); // made by: version 2.0, MS-DOS
    view.setUint16(at + 6, 20, true);
    view.setUint16(at + 8, f.flags, true);
    view.setUint16(at + 10, 0, true);
    view.setUint16(at + 12, time, true);
    view.setUint16(at + 14, date, true);
    view.setUint32(at + 16, f.crc, true);
    view.setUint32(at + 20, f.data.length, true);
    view.setUint32(at + 24, f.data.length, true);
    view.setUint16(at + 28, f.name.length, true);
    // Bytes 30–41 (extra field and comment lengths, disk number, file attributes) stay 0.
    view.setUint32(at + 42, offsets[i] ?? 0, true);
    out.set(f.name, at + CENTRAL_HEADER);
    at += CENTRAL_HEADER + f.name.length;
  });

  view.setUint32(at, 0x06054b50, true); // end of central directory
  view.setUint16(at + 8, files.length, true); // entries on this disk
  view.setUint16(at + 10, files.length, true); // entries in total
  view.setUint32(at + 12, at - centralStart, true);
  view.setUint32(at + 16, centralStart, true);
  return out;
}
