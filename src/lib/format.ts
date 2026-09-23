const numberFormat = new Intl.NumberFormat('en-US');

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

export function easeOutCubic(t: number): number {
  const p = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - p, 3);
}

/**
 * Parses API timestamps. New cards use ISO 8601 UTC; seeded rows may still carry
 * SQLite's "YYYY-MM-DD HH:MM:SS" (UTC, no zone), which Safari refuses to parse as-is.
 */
export function parseTimestamp(value: string): Date | null {
  const sqlite = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}(?:\.\d+)?)$/.exec(value);
  const date = new Date(sqlite ? `${sqlite[1]}T${sqlite[2]}Z` : value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const relative = new Intl.RelativeTimeFormat('zh-TW', { numeric: 'auto' });
const dateFormat = new Intl.DateTimeFormat('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });

/** "剛剛" / "5 分鐘前" / "2 小時前" / "昨天" / "3 天前", then a plain date after 30 days. */
export function relativeTime(value: string, now: number = Date.now()): string {
  const date = parseTimestamp(value);
  if (!date) return '';
  const seconds = Math.round((date.getTime() - now) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return '剛剛';
  if (abs < 3600) return relative.format(Math.round(seconds / 60), 'minute');
  if (abs < 86400) return relative.format(Math.round(seconds / 3600), 'hour');
  if (abs < 86400 * 30) return relative.format(Math.round(seconds / 86400), 'day');
  return dateFormat.format(date);
}

export function formatDateTime(value: string): string {
  const date = parseTimestamp(value);
  if (!date) return value;
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '--:--';
  const s = Math.round(totalSeconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
