import { describe, expect, it } from 'vitest';
import { createZip, crc32 } from './zip';
import { readZip } from './zip.inspect';

const bytes = (text: string) => new TextEncoder().encode(text);

describe('crc32', () => {
  // Published check values, so the table is tested against the standard rather than against itself.
  it.each([
    ['', 0x00000000],
    ['123456789', 0xcbf43926],
    ['The quick brown fox jumps over the lazy dog', 0x414fa339],
  ])('crc32(%j) is the standard value', (text, expected) => {
    expect(crc32(bytes(text))).toBe(expected);
  });
});

describe('createZip (#76)', () => {
  const modified = new Date(2026, 10, 30, 22, 15, 4); // local time, as ZIP stores it

  it('reads back every entry in order, stored, with its own CRC and the same headers twice', () => {
    const entries = [
      { name: '[Content_Types].xml', data: bytes('<Types/>') },
      { name: 'xl/worksheets/sheet1.xml', data: bytes('<worksheet>感謝</worksheet>') },
      { name: 'empty.txt', data: new Uint8Array(0) },
    ];
    const read = readZip(createZip(entries, modified));
    expect(read.map((e) => e.name)).toEqual(entries.map((e) => e.name));
    read.forEach((entry, i) => {
      expect(entry.method).toBe(0);
      expect(entry.data).toEqual(entries[i]?.data);
      expect(entry.crc).toBe(crc32(entries[i]?.data ?? new Uint8Array(0)));
    });
  });

  it('stamps the modification time in MS-DOS format (two-second steps)', () => {
    const [entry] = readZip(createZip([{ name: 'a.txt', data: bytes('a') }], modified));
    expect(entry?.date).toBe(((2026 - 1980) << 9) | (11 << 5) | 30);
    expect(entry?.time).toBe((22 << 11) | (15 << 5) | 2);
  });

  it('marks a name as UTF-8 only when it is not plain ASCII', () => {
    const read = readZip(createZip([{ name: 'a.txt', data: bytes('a') }, { name: '卡片.txt', data: bytes('b') }], modified));
    expect(read.map((e) => [e.name, e.flags])).toEqual([
      ['a.txt', 0],
      ['卡片.txt', 0x0800],
    ]);
  });

  it('writes an empty archive as just the end record', () => {
    const zip = createZip([], modified);
    expect(zip).toHaveLength(22);
    expect(readZip(zip)).toEqual([]);
  });
});
