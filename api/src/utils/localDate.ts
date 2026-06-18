import type { Request } from 'express';

/** `Date.getTimezoneOffset()` from the client (minutes). */
export function getTimezoneOffsetFromQuery(req: Request): number {
  const raw = req.query.tzOffset;
  if (raw === undefined || raw === '') return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

/** Calendar date `YYYY-MM-DD` in the client's local timezone. */
export function toLocalDateKey(date: Date, tzOffsetMinutes: number): string {
  const localMs = date.getTime() - tzOffsetMinutes * 60_000;
  const d = new Date(localMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** Last N calendar days ending today (inclusive), oldest first. */
export function lastNDaysIncludingToday(n: number, tzOffsetMinutes: number): string[] {
  const today = toLocalDateKey(new Date(), tzOffsetMinutes);
  return Array.from({ length: n }, (_, i) => addDaysToDateKey(today, i - (n - 1)));
}

/** Next N calendar days starting today (inclusive). */
export function nextNDaysIncludingToday(n: number, tzOffsetMinutes: number): string[] {
  const today = toLocalDateKey(new Date(), tzOffsetMinutes);
  return Array.from({ length: n }, (_, i) => addDaysToDateKey(today, i));
}

export function localDayBounds(dateKey: string, tzOffsetMinutes: number): { start: Date; end: Date } {
  const [y, m, d] = dateKey.split('-').map(Number);
  const startMs = Date.UTC(y, m - 1, d) + tzOffsetMinutes * 60_000;
  return { start: new Date(startMs), end: new Date(startMs + 86_400_000 - 1) };
}

/**
 * Count consecutive study days ending today, or yesterday if nothing logged yet today.
 */
export function computeStudyStreak(sessionDates: Date[], tzOffsetMinutes: number): number {
  const dayKeys = new Set(sessionDates.map((d) => toLocalDateKey(d, tzOffsetMinutes)));
  if (dayKeys.size === 0) return 0;

  const today = toLocalDateKey(new Date(), tzOffsetMinutes);
  let cursor = dayKeys.has(today) ? today : addDaysToDateKey(today, -1);
  if (!dayKeys.has(cursor)) return 0;

  let streak = 0;
  while (dayKeys.has(cursor)) {
    streak++;
    cursor = addDaysToDateKey(cursor, -1);
  }
  return streak;
}
