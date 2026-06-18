const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const WEEKDAY_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

export function getDeviceTimezoneOffset(): number {
  return new Date().getTimezoneOffset();
}

export function todayLocalDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseLocalDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isTodayDateKey(dateKey: string): boolean {
  return dateKey === todayLocalDateKey();
}

export function weekdayShortFromDateKey(dateKey: string): string {
  return WEEKDAY_SHORT[parseLocalDateKey(dateKey).getDay()];
}

export function weekdayLetterFromDateKey(dateKey: string): string {
  return WEEKDAY_LETTER[parseLocalDateKey(dateKey).getDay()];
}

export function analyticsQuerySuffix(topicId?: string): string {
  const params = new URLSearchParams({ tzOffset: String(getDeviceTimezoneOffset()) });
  if (topicId) params.set('topicId', topicId);
  return `?${params.toString()}`;
}
