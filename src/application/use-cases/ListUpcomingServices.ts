import { ChurchRepository } from '@/application/ports/ChurchRepository';
import { ServiceRepository } from '@/application/ports/ServiceRepository';
import { Clock } from '@/application/ports/Clock';
import { Church } from '@/domain/entities/Church';
import { Service, ServiceException } from '@/domain/entities/Service';
import { UpcomingPage } from '@/application/ports/EventRepository';
import { addDays, toLocalDateKey, withLocalTime } from '@/shared/dates';
import { computeRuleCancelled, recurrenceDates } from '@/shared/recurrence';

export interface UpcomingServiceItem {
  /** Concrete date+time of this occurrence (ISO string for transport). */
  occursAt: string;
  /**
   * The service this occurrence comes from, with `label`/`startTime`/`endTime`
   * already merged with any matching OVERRIDE exception for this date.
   */
  service: Service;
  church: Pick<Church, 'id' | 'slug' | 'name' | 'city' | 'country'>;
}

const DEFAULT_WEEKS_AHEAD = 8;

interface InternalCursor {
  occursMs: number;
  serviceId: string;
}

function encodeCursor(c: InternalCursor): string {
  return Buffer.from(`${c.occursMs}_${c.serviceId}`, 'utf8').toString('base64url');
}
function decodeCursor(raw: string): InternalCursor | null {
  try {
    const s = Buffer.from(raw, 'base64url').toString('utf8');
    const [ms, id] = s.split('_');
    if (!ms || !id) return null;
    return { occursMs: Number(ms), serviceId: id };
  } catch {
    return null;
  }
}

/**
 * Chronological feed of every service occurrence in the next N weeks.
 * Honors recurrence (WEEKLY, MONTHLY_NTH_WEEKDAY), one-off exceptions
 * (CANCEL/OVERRIDE) AND auto-cancel rules between services.
 */
export class ListUpcomingServices {
  constructor(
    private readonly churches: ChurchRepository,
    private readonly services: ServiceRepository,
    private readonly clock: Clock,
  ) {}

  async execute(
    opts: { cursor?: string; limit?: number; weeksAhead?: number } = {},
  ): Promise<UpcomingPage<UpcomingServiceItem>> {
    const limit = opts.limit ?? 10;
    const weeksAhead = opts.weeksAhead ?? DEFAULT_WEEKS_AHEAD;
    const now = this.clock.now();

    const [allChurches, allServices] = await Promise.all([
      this.churches.list({ limit: 5000 }),
      this.services.listAll(5000),
    ]);
    const churchById = new Map(allChurches.map((c) => [c.id, c]));
    const serviceById = new Map(allServices.map((s) => [s.id, s]));

    const windowEnd = addDays(now, weeksAhead * 7);
    const projected: ProjectedOccurrence[] = [];
    for (const svc of allServices) {
      if (!churchById.has(svc.churchId)) continue;
      if (!svc.recurrence || typeof svc.recurrence.kind !== 'string') continue;
      for (const occ of expandService(svc, serviceById, now, windowEnd)) {
        projected.push(occ);
      }
    }

    projected.sort(
      (a, b) =>
        a.occursAt.getTime() - b.occursAt.getTime() ||
        a.service.id.localeCompare(b.service.id),
    );

    const startIndex = opts.cursor ? findCursorIndex(projected, decodeCursor(opts.cursor)) : 0;
    const slice = projected.slice(startIndex, startIndex + limit);
    const nextIndex = startIndex + slice.length;
    const nextCursor =
      nextIndex < projected.length && slice.length > 0
        ? encodeCursor({
            occursMs: slice[slice.length - 1]!.occursAt.getTime(),
            serviceId: slice[slice.length - 1]!.service.id,
          })
        : null;

    const items: UpcomingServiceItem[] = slice.map((p) => {
      const c = churchById.get(p.service.churchId)!;
      return {
        occursAt: p.occursAt.toISOString(),
        service: p.service,
        church: { id: c.id, slug: c.slug, name: c.name, city: c.city, country: c.country },
      };
    });

    return { items, nextCursor };
  }
}

interface ProjectedOccurrence {
  occursAt: Date;
  /** Already merged with any OVERRIDE exception for this date. */
  service: Service;
}

function expandService(
  svc: Service,
  serviceById: Map<string, Service>,
  from: Date,
  until: Date,
): ProjectedOccurrence[] {
  const out: ProjectedOccurrence[] = [];
  const manualCancel = new Set<string>();
  const overridesByDate = new Map<string, ServiceException>();

  for (const ex of svc.exceptions ?? []) {
    if (ex.kind === 'CANCEL') manualCancel.add(ex.date);
    else if (ex.kind === 'OVERRIDE') overridesByDate.set(ex.date, ex);
  }

  const ruleCancel = computeRuleCancelled(svc, serviceById, from, until).byDate;

  for (const date of recurrenceDates(svc, from, until)) {
    const key = toLocalDateKey(date);
    if (manualCancel.has(key)) continue;
    if (ruleCancel.has(key)) continue;

    const override = overridesByDate.get(key);
    const startTime = override?.override?.startTime ?? svc.startTime;
    const occursAt = withLocalTime(date, startTime);
    if (occursAt.getTime() < from.getTime()) continue;

    const merged: Service = override
      ? {
          ...svc,
          startTime,
          endTime: override.override?.endTime ?? svc.endTime,
          label: override.override?.label ?? svc.label,
          hasLiveStream: override.override?.hasLiveStream ?? svc.hasLiveStream,
        }
      : svc;

    out.push({ occursAt, service: merged });
  }
  return out;
}

function findCursorIndex(
  list: ProjectedOccurrence[],
  cursor: InternalCursor | null,
): number {
  if (!cursor) return 0;
  for (let i = 0; i < list.length; i++) {
    const item = list[i]!;
    const ms = item.occursAt.getTime();
    if (ms > cursor.occursMs) return i;
    if (ms === cursor.occursMs && item.service.id > cursor.serviceId) return i;
  }
  return list.length;
}
