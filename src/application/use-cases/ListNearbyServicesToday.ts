import { ChurchRepository } from '@/application/ports/ChurchRepository';
import { ServiceRepository } from '@/application/ports/ServiceRepository';
import { Clock } from '@/application/ports/Clock';
import { Coordinates } from '@/domain/value-objects/Coordinates';
import { Church } from '@/domain/entities/Church';
import { Service } from '@/domain/entities/Service';
import {
  addDays,
  nthWeekdayOfMonth,
  startOfDay,
  toLocalDateKey,
} from '@/shared/dates';
import { computeRuleCancelled } from '@/shared/recurrence';

export interface NearbyServiceToday {
  church: Church;
  service: Service;
  distanceKm: number;
}

/**
 * Services occurring today, near a given location.
 *
 * Honors recurrence (WEEKLY + MONTHLY_NTH_WEEKDAY) and CANCEL exceptions
 * — but does not apply OVERRIDE merging since callers normally just want
 * the original Service entity to render.
 */
export class ListNearbyServicesToday {
  constructor(
    private readonly churches: ChurchRepository,
    private readonly services: ServiceRepository,
    private readonly clock: Clock,
  ) {}

  async execute(
    coords: Coordinates,
    radiusKm = 50,
    limit = 10,
  ): Promise<NearbyServiceToday[]> {
    const now = this.clock.now();
    const today = startOfDay(now);
    const todayKey = toLocalDateKey(today);
    const dayOfWeek = today.getDay();

    const [nearbyChurches, allServices] = await Promise.all([
      this.churches.findNearby(coords, radiusKm, 100),
      this.services.listAll(5000),
    ]);

    const byChurch = new Map(nearbyChurches.map((c) => [c.id, c]));
    const serviceById = new Map(allServices.map((s) => [s.id, s]));
    const result: NearbyServiceToday[] = [];

    for (const svc of allServices) {
      const church = byChurch.get(svc.churchId);
      if (!church) continue;
      if (!occursToday(svc, today, dayOfWeek)) continue;
      // Skip if explicitly cancelled today (manual exception).
      if (svc.exceptions?.some((e) => e.kind === 'CANCEL' && e.date === todayKey)) continue;
      // Skip if a dependent rule cancels today.
      const ruleCancel = computeRuleCancelled(svc, serviceById, today, addDays(today, 1)).byDate;
      if (ruleCancel.has(todayKey)) continue;
      result.push({ church, service: svc, distanceKm: church.distanceKm });
    }

    result.sort(
      (a, b) =>
        a.service.startTime.localeCompare(b.service.startTime) ||
        a.distanceKm - b.distanceKm,
    );

    return result.slice(0, limit);
  }
}

function occursToday(svc: Service, today: Date, dayOfWeek: number): boolean {
  if (svc.recurrence.dayOfWeek !== dayOfWeek) return false;
  if (svc.recurrence.kind === 'WEEKLY') return true;
  // MONTHLY_NTH_WEEKDAY: only when today equals the nth weekday of the month.
  const target = nthWeekdayOfMonth(
    today.getFullYear(),
    today.getMonth(),
    svc.recurrence.dayOfWeek,
    svc.recurrence.nth,
  );
  return Boolean(target && toLocalDateKey(target) === toLocalDateKey(today));
}
