/**
 * Pure helpers for grouping a chronological list by local day.
 *
 * The feed groups items under "Hoje", "Amanhã" and weekday/date headings to
 * make scanning faster than a flat chronological grid.
 */

import { toLocalDateKey } from './dates';

export interface DayGroup<T> {
  /** YYYY-MM-DD in the viewer's local time, used as React key. */
  dayKey: string;
  /** Anchor date at local midnight, useful for formatting the heading. */
  date: Date;
  items: T[];
}

/**
 * Splits an already-sorted chronological list into day buckets while
 * preserving order. Stable: items in each bucket keep their incoming order.
 */
export function groupByDay<T>(items: T[], getDate: (item: T) => Date): DayGroup<T>[] {
  const buckets = new Map<string, DayGroup<T>>();
  const order: string[] = [];

  for (const item of items) {
    const date = getDate(item);
    const key = toLocalDateKey(date);
    let bucket = buckets.get(key);
    if (!bucket) {
      const anchor = new Date(date);
      anchor.setHours(0, 0, 0, 0);
      bucket = { dayKey: key, date: anchor, items: [] };
      buckets.set(key, bucket);
      order.push(key);
    }
    bucket.items.push(item);
  }

  return order.map((k) => buckets.get(k)!);
}

export interface DayHeadingLabels {
  today: string;
  tomorrow: string;
}

/**
 * Heading for a day bucket: "Hoje", "Amanhã" or a localized
 * "<Weekday>, <day> de <month>" style string.
 */
export function formatDayHeading(
  date: Date,
  locale: string,
  labels: DayHeadingLabels,
  now: Date = new Date(),
): string {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (toLocalDateKey(date) === toLocalDateKey(today)) return labels.today;
  if (toLocalDateKey(date) === toLocalDateKey(tomorrow)) return labels.tomorrow;

  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(date);
}

/** Time only, e.g. "19:30". */
export function formatTimeOnly(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
