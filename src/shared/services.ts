import { Service, DayOfWeek } from '@/domain/entities/Service';

/** Day-of-week for sorting/displaying, regardless of recurrence kind. */
export function getServiceDayOfWeek(s: Service): DayOfWeek {
  return s.recurrence.dayOfWeek;
}

/** Returns the nth (1..4 or -1) for monthly rules; null for weekly. */
export function getServiceNth(s: Service): 1 | 2 | 3 | 4 | -1 | null {
  return s.recurrence.kind === 'MONTHLY_NTH_WEEKDAY' ? s.recurrence.nth : null;
}

/**
 * Stable ordering for the church page schedule list:
 *   1) WEEKLY before MONTHLY
 *   2) by day of week (0..6)
 *   3) by start time
 */
export function compareServicesForDisplay(a: Service, b: Service): number {
  const ak = a.recurrence.kind === 'WEEKLY' ? 0 : 1;
  const bk = b.recurrence.kind === 'WEEKLY' ? 0 : 1;
  if (ak !== bk) return ak - bk;
  if (a.recurrence.dayOfWeek !== b.recurrence.dayOfWeek) {
    return a.recurrence.dayOfWeek - b.recurrence.dayOfWeek;
  }
  return a.startTime.localeCompare(b.startTime);
}
