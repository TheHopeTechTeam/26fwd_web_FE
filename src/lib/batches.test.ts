import { describe, expect, it } from 'vitest';
import { firstBatch, nextBatch, resizeBatch, shuffle } from './batches';

const ids = Array.from({ length: 20 }, (_, i) => `t${i + 1}`);

/** Repeatable "random" numbers for the tests. */
function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

describe('testimony batches', () => {
  it('shuffles without losing or duplicating anyone', () => {
    const out = shuffle(ids, seeded(7));
    expect([...out].sort()).toEqual([...ids].sort());
  });

  it('starts with a full batch and queues the rest', () => {
    const state = firstBatch(ids, 12, seeded(3));
    expect(state.shown).toHaveLength(12);
    expect(state.queue).toHaveLength(8);
    expect(new Set([...state.shown, ...state.queue]).size).toBe(20);
  });

  it('shows everyone not seen yet before repeating anyone', () => {
    const random = seeded(5);
    const first = firstBatch(ids, 12, random);
    const second = nextBatch(first, 12, random);
    expect(second.shown).toHaveLength(12);
    // The 8 unseen come first, then 4 of the previous batch.
    expect(second.shown.slice(0, 8)).toEqual(first.queue);
    expect(second.shown.slice(8).every((id) => first.shown.includes(id))).toBe(true);
    expect(new Set(second.shown).size).toBe(12);
  });

  it('cycles through everyone over repeated clicks', () => {
    const random = seeded(9);
    let state = firstBatch(ids, 8, random);
    const seen = new Set(state.shown);
    for (let i = 0; i < 2; i += 1) {
      state = nextBatch(state, 8, random);
      state.shown.forEach((id) => seen.add(id));
    }
    expect(seen.size).toBe(20);
  });

  it('keeps bringing everyone back after the first round', () => {
    const random = seeded(11);
    let state = firstBatch(ids, 8, random);
    for (let i = 0; i < 10; i += 1) state = nextBatch(state, 8, random);
    // Later clicks: within a few rounds every testimony shows up again, nobody drops out.
    const later = new Set<string>();
    for (let i = 0; i < 6; i += 1) {
      state = nextBatch(state, 8, random);
      expect(new Set(state.shown).size).toBe(8);
      state.shown.forEach((id) => later.add(id));
    }
    expect(later.size).toBe(20);
  });

  it('keeps the wall when the screen size changes', () => {
    const state = firstBatch(ids, 10, seeded(2));
    const smaller = resizeBatch(state, 8);
    expect(smaller.shown).toEqual(state.shown.slice(0, 8));
    expect(resizeBatch(smaller, 10).shown).toEqual(state.shown);
  });

  it('copes with fewer testimonies than a batch', () => {
    const state = firstBatch(['a', 'b', 'c'], 8, seeded(4));
    expect(state.shown).toHaveLength(3);
    expect(nextBatch(state, 8, seeded(4)).shown).toHaveLength(3);
  });
});
