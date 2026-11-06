/**
 * Random batches for the testimony wall (#26): each page load shows a fresh random batch, and
 * 「看其他故事」 shows people not seen yet before anyone repeats.
 */

export type Random = () => number;

/** Fisher–Yates shuffle into a new array. */
export function shuffle<T>(items: readonly T[], random: Random = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export interface BatchState<T> {
  /** On the wall now. */
  shown: T[];
  /** Up next, in order: everyone not shown yet comes before anyone shown again. */
  queue: T[];
}

/** The first batch of a page load. */
export function firstBatch<T>(all: readonly T[], count: number, random: Random = Math.random): BatchState<T> {
  const order = shuffle(all, random);
  return { shown: order.slice(0, count), queue: order.slice(count) };
}

/** 「看其他故事」: the next `count` from the queue, refilled with the ones just shown going last. */
export function nextBatch<T>(state: BatchState<T>, count: number, random: Random = Math.random): BatchState<T> {
  let queue = state.queue;
  if (queue.length < count) {
    const recent = shuffle(
      state.shown.filter((item) => !queue.includes(item)),
      random,
    );
    queue = [...queue, ...recent];
  }
  return { shown: queue.slice(0, count), queue: queue.slice(count) };
}

/** The wall size changed with the screen: keep who is shown, top up or hand back to the queue. */
export function resizeBatch<T>(state: BatchState<T>, count: number): BatchState<T> {
  const pool = [...state.shown, ...state.queue];
  return { shown: pool.slice(0, count), queue: pool.slice(count) };
}
