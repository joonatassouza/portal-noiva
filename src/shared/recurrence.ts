import { Service } from '@/domain/entities/Service';
import {
  addDays,
  nthWeekdayOfMonth,
  startOfDay,
  toLocalDateKey,
} from '@/shared/dates';

/**
 * Yields every base date the recurrence falls on, between `from` (inclusive,
 * day-aligned) and `until` (inclusive). Note: this only returns the *date* —
 * the caller is responsible for combining it with `service.startTime`.
 */
export function* recurrenceDates(
  service: Service,
  from: Date,
  until: Date,
): Generator<Date> {
  const startDay = startOfDay(from);
  if (service.recurrence.kind === 'WEEKLY') {
    const target = service.recurrence.dayOfWeek;
    const offset = (target - startDay.getDay() + 7) % 7;
    let date = addDays(startDay, offset);
    while (date.getTime() <= until.getTime()) {
      yield date;
      date = addDays(date, 7);
    }
    return;
  }
  // MONTHLY_NTH_WEEKDAY: walk month-by-month.
  let cursor = new Date(startDay.getFullYear(), startDay.getMonth(), 1);
  while (cursor.getTime() <= until.getTime()) {
    const date = nthWeekdayOfMonth(
      cursor.getFullYear(),
      cursor.getMonth(),
      service.recurrence.dayOfWeek,
      service.recurrence.nth,
    );
    if (date && date.getTime() >= startDay.getTime() && date.getTime() <= until.getTime()) {
      yield date;
    }
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
}

export interface RuleCancelledMap {
  /** date key (YYYY-MM-DD) -> reason for cancellation */
  byDate: Map<string, string | undefined>;
}

/**
 * For a given service, expands all of its `cancelRules` against the catalog
 * of every other service (passed in `byId`) and returns a map of date keys
 * that are auto-cancelled in the [from, until] window.
 *
 * Self-references and cross-church references are silently ignored.
 */
export function computeRuleCancelled(
  service: Service,
  byId: Map<string, Service>,
  from: Date,
  until: Date,
): RuleCancelledMap {
  const byDate = new Map<string, string | undefined>();
  if (!service.cancelRules || service.cancelRules.length === 0) return { byDate };

  // Expand rules over a slightly wider window to catch triggers whose offset
  // pushes the cancel date into the [from, until] range.
  const maxOffset = service.cancelRules.reduce((m, r) => Math.max(m, Math.abs(r.daysOffset)), 0);
  const triggerFrom = addDays(from, -maxOffset);
  const triggerUntil = addDays(until, maxOffset);

  for (const rule of service.cancelRules) {
    if (rule.triggerServiceId === service.id) continue; // never self-cancel
    const trigger = byId.get(rule.triggerServiceId);
    if (!trigger) continue;
    if (trigger.churchId !== service.churchId) continue;
    for (const triggerDate of recurrenceDates(trigger, triggerFrom, triggerUntil)) {
      const cancelDate = addDays(triggerDate, rule.daysOffset);
      if (cancelDate < from || cancelDate > until) continue;
      const key = toLocalDateKey(cancelDate);
      // Earlier rule wins on reason text — first-write semantics.
      if (!byDate.has(key)) byDate.set(key, rule.reason);
    }
  }
  return { byDate };
}
