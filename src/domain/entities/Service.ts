/**
 * Recurring church service (culto).
 *
 * Recurrence is a discriminated union so simple weekly cultos and "second
 * Saturday of the month" (Santa Ceia) share the same shape.
 *
 * `exceptions` covers one-off changes; `cancelRules` declares permanent
 * dependencies on other services (e.g. "no Sunday culto on the week of
 * Santa Ceia" — instead of having to manually cancel each Sunday).
 *
 * dayOfWeek follows the JS convention: 0 = Sunday, 6 = Saturday.
 * Times are local strings "HH:mm" in the church's local timezone.
 */

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ServiceRecurrence =
  | { kind: 'WEEKLY'; dayOfWeek: DayOfWeek }
  | {
      kind: 'MONTHLY_NTH_WEEKDAY';
      /** 1..4 = first..fourth occurrence in the month; -1 = last. */
      nth: 1 | 2 | 3 | 4 | -1;
      dayOfWeek: DayOfWeek;
    };

export interface ServiceException {
  /** Local date being modified, ISO `YYYY-MM-DD`. */
  date: string;
  kind: 'CANCEL' | 'OVERRIDE';
  /** Free text shown to visitors (e.g. "Sem culto — Santa Ceia no sábado"). */
  reason?: string;
  /** When kind === 'OVERRIDE', the replacement details for this single date. */
  override?: {
    startTime?: string;
    endTime?: string;
    label?: string;
    hasLiveStream?: boolean;
  };
}

/**
 * Auto-cancel rule.
 *
 * Whenever the referenced trigger service occurs on date D, THIS service is
 * treated as cancelled on date D + daysOffset.
 *
 * Example: Curitiba's Sunday culto declares
 *   { triggerServiceId: santaCeiaId, daysOffset: 1, reason: "Santa Ceia ontem" }
 * — and every Sunday following a 2nd-Saturday Santa Ceia automatically
 * disappears from the feed and the church page.
 *
 * Rules are evaluated at projection time, so editing or removing the trigger
 * service updates dependents instantly with no state to keep in sync.
 */
export interface ServiceCancelRule {
  triggerServiceId: string;
  /** May be negative (e.g. -1 to cancel the day before the trigger). */
  daysOffset: number;
  reason?: string;
}

export interface Service {
  id: string;
  churchId: string;
  label: string;
  startTime: string;
  endTime?: string;
  hasLiveStream: boolean;
  recurrence: ServiceRecurrence;
  exceptions: ServiceException[];
  cancelRules: ServiceCancelRule[];
}
