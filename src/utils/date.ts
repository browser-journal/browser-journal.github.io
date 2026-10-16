/**
 * Timezone-safe local calendar date utilities.
 * Avoids UTC skew bugs caused by mixing Date.toISOString() with local time.
 */

/**
 * Returns today's date formatted as YYYY-MM-DD in the user's local timezone.
 */
export function getLocalTodayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Shifts a YYYY-MM-DD date string by a given number of days (+1 for forward, -1 for backward).
 * Guaranteed immune to timezone offsets and daylight saving transitions.
 */
export function shiftDateStr(dateStr: string, deltaDays: number): string {
  const parts = dateStr.split('-').map(Number);
  const year = parts[0] || new Date().getFullYear();
  const month = (parts[1] || 1) - 1;
  const day = parts[2] || 1;

  const d = new Date(year, month, day + deltaDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dayNum = String(d.getDate()).padStart(2, '0');

  return `${y}-${m}-${dayNum}`;
}

/**
 * Formats a YYYY-MM-DD string for display using the specified locale.
 */
export function formatDisplayDate(
  dateStr: string,
  locale = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  const parts = dateStr.split('-').map(Number);
  const year = parts[0] || new Date().getFullYear();
  const month = (parts[1] || 1) - 1;
  const day = parts[2] || 1;

  const d = new Date(year, month, day);
  return d.toLocaleDateString(
    locale,
    options || {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  );
}

/**
 * Checks if a given YYYY-MM-DD string represents today in the local timezone.
 */
export function isTodayStr(dateStr: string): boolean {
  return dateStr === getLocalTodayStr();
}
