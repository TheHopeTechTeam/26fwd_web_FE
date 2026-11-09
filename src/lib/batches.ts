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
  /** Everyone, so a new round can bring back the people shown in earlier rounds. */
  all: readonly T[];
}

/** The first batch of a page load. */
export function firstBatch<T>(all: readonly T[], count: number, random: Random = Math.random): BatchState<T> {
  const order = shuffle(all, random);
  return { shown: order.slice(0, count), queue: order.slice(count), all };
}

/**
 * 「看其他故事」: the next `count` from the queue. When the queue runs short a new round starts:
 * everyone not queued joins it in a fresh random order, the people on the wall right now last, so
 * every testimony keeps coming back (11/09: refilling with only the current wall left the people
 * of earlier rounds out for good, and the same dozen or so kept rotating).
 */
export function nextBatch<T>(state: BatchState<T>, count: number, random: Random = Math.random): BatchState<T> {
  let queue = state.queue;
  if (queue.length < count) {
    const waiting = new Set(queue);
    const onWall = new Set(state.shown);
    const fresh = shuffle(
      state.all.filter((item) => !waiting.has(item) && !onWall.has(item)),
      random,
    );
    const recent = shuffle(
      state.shown.filter((item) => !waiting.has(item)),
      random,
    );
    queue = [...queue, ...fresh, ...recent];
  }
  return { shown: queue.slice(0, count), queue: queue.slice(count), all: state.all };
}

/** The wall size changed with the screen: keep who is shown, top up or hand back to the queue. */
export function resizeBatch<T>(state: BatchState<T>, count: number): BatchState<T> {
  const listed = new Set([...state.shown, ...state.queue]);
  const pool = [...state.shown, ...state.queue, ...state.all.filter((item) => !listed.has(item))];
  return { shown: pool.slice(0, count), queue: pool.slice(count), all: state.all };
}
