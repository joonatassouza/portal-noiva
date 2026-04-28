/**
 * Tiny date utilities. All operate on the LOCAL timezone of the runtime —
 * good enough for MVP. Real per-church timezone support comes later.
 */

/** "YYYY-MM-DD" key for a Date in local time — used as exception keys. */
export function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Returns a new Date set to local midnight on the same calendar day as `d`. */
export function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

/** Apply "HH:mm" on a copy of `d` (local time). */
export function withLocalTime(d: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map((s) => Number(s));
  const out = new Date(d);
  out.setHours(h ?? 0, m ?? 0, 0, 0);
  return out;
}

/**
 * Date of the n-th occurrence of `dayOfWeek` in the given (year, monthIndex).
 * `n` is 1..4 for first..fourth; -1 for last.
 * Returns null if `n` is 1..4 but the month has fewer occurrences.
 */
export function nthWeekdayOfMonth(
  year: number,
  monthIndex: number,
  dayOfWeek: number,
  n: 1 | 2 | 3 | 4 | -1,
): Date | null {
  if (n === -1) {
    // Last occurrence: walk back from the last day of the month.
    const last = new Date(year, monthIndex + 1, 0);
    const offset = (last.getDay() - dayOfWeek + 7) % 7;
    return new Date(year, monthIndex, last.getDate() - offset);
  }
  const first = new Date(year, monthIndex, 1);
  const offset = (dayOfWeek - first.getDay() + 7) % 7;
  const day = 1 + offset + (n - 1) * 7;
  // Day must still belong to the same month.
  const candidate = new Date(year, monthIndex, day);
  if (candidate.getMonth() !== monthIndex) return null;
  return candidate;
}

/** Add `days` calendar days to a copy of `d`. */
export function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}
