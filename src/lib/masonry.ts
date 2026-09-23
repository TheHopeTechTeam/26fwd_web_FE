/**
 * Greedy shortest-column placement. Item i's column depends only on items before it,
 * so appending a "Load More" batch never moves cards that are already on screen.
 */
export function assignColumns<T>(items: readonly T[], columns: number, estimateHeight: (item: T) => number): T[][] {
  const count = Math.max(1, Math.floor(columns));
  const result: T[][] = Array.from({ length: count }, () => []);
  const heights = new Array<number>(count).fill(0);
  for (const item of items) {
    let target = 0;
    for (let c = 1; c < count; c++) {
      if ((heights[c] ?? 0) < (heights[target] ?? 0)) target = c;
    }
    result[target]?.push(item);
    heights[target] = (heights[target] ?? 0) + estimateHeight(item);
  }
  return result;
}

export function columnsForWidth(width: number, minColumnWidth = 280, max = 4): number {
  return Math.min(max, Math.max(1, Math.floor(width / minColumnWidth)));
}
