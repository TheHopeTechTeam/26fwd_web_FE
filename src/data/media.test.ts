import { describe, expect, it } from 'vitest';
import { MINISTRIES, OUTREACH_PARTNERS } from './content';

/**
 * Every ministry and partner photo must ship with the site (11/06): they live in public/, which
 * the build copies as is, so a missing or misnamed file here would be a blank slide or tab.
 */
const PUBLIC_FILES = new Set(Object.keys(import.meta.glob('/public/**/*.webp')).map((p) => p.replace('/public/', '')));

describe('ministry and partner photos', () => {
  it('points every carousel photo at a file in public/, with a description', () => {
    const missing = MINISTRIES.flatMap((m) => (m.photos ?? []).filter((p) => !PUBLIC_FILES.has(p.src)).map((p) => `${m.id} ${p.src}`));
    expect(missing).toEqual([]);
    for (const m of MINISTRIES) for (const p of m.photos ?? []) expect(p.alt.trim(), p.src).not.toBe('');
  });

  it('points every partner photo at a file in public/', () => {
    const missing = OUTREACH_PARTNERS.flatMap((p) => (p.photos ?? []).filter((ph) => !PUBLIC_FILES.has(ph.src)).map((ph) => `${p.id} ${ph.src}`));
    expect(missing).toEqual([]);
  });
});
