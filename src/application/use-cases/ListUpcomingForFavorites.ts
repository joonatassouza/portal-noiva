import { ChurchRepository } from '@/application/ports/ChurchRepository';
import { FavoriteRepository } from '@/application/ports/FavoriteRepository';
import { ServiceRepository } from '@/application/ports/ServiceRepository';
import { Clock } from '@/application/ports/Clock';
import { Church } from '@/domain/entities/Church';
import { Service } from '@/domain/entities/Service';
import { addDays, toLocalDateKey, withLocalTime } from '@/shared/dates';
import { computeRuleCancelled, recurrenceDates } from '@/shared/recurrence';
import { UnauthorizedError } from '@/domain/errors/DomainError';

export interface FavoriteUpcomingItem {
  occursAt: string;
  service: Service;
  church: Pick<Church, 'id' | 'slug' | 'name' | 'city' | 'country'>;
}

/**
 * Personal feed for /meu-painel: chronological occurrences of services from
 * the user's favorited churches, projected over the next N weeks.
 *
 * Honors recurrence + manual exceptions + auto-cancel rules between services.
 */
export class ListUpcomingForFavorites {
  constructor(
    private readonly favorites: FavoriteRepository,
    private readonly churches: ChurchRepository,
    private readonly services: ServiceRepository,
    private readonly clock: Clock,
  ) {}

  async execute(opts: { userId: string | null; weeksAhead?: number; limit?: number }):
    Promise<FavoriteUpcomingItem[]> {
    if (!opts.userId) throw new UnauthorizedError('Login required.');

    const weeksAhead = opts.weeksAhead ?? 4;
    const limit = opts.limit ?? 25;
    const now = this.clock.now();
    const windowEnd = addDays(now, weeksAhead * 7);

    const favoriteIds = await this.favorites.listChurchIdsByUser(opts.userId);
    if (favoriteIds.length === 0) return [];

    const churches = (await Promise.all(favoriteIds.map((id) => this.churches.findById(id))))
      .filter((c): c is Church => Boolean(c));
    const churchById = new Map(churches.map((c) => [c.id, c]));

    const allServices = await this.services.listAll(5000);
    const serviceById = new Map(allServices.map((s) => [s.id, s]));
    const scoped = allServices.filter((s) => churchById.has(s.churchId));

    const items: FavoriteUpcomingItem[] = [];
    for (const svc of scoped) {
      if (!svc.recurrence) continue;
      const ruleCancel = computeRuleCancelled(svc, serviceById, now, windowEnd).byDate;
      for (const date of recurrenceDates(svc, now, windowEnd)) {
        const key = toLocalDateKey(date);
        const cancel = svc.exceptions?.find((e) => e.kind === 'CANCEL' && e.date === key);
        if (cancel) continue;
        if (ruleCancel.has(key)) continue;
        const override = svc.exceptions?.find((e) => e.kind === 'OVERRIDE' && e.date === key);
        const startTime = override?.override?.startTime ?? svc.startTime;
        const occursAt = withLocalTime(date, startTime);
        if (occursAt.getTime() < now.getTime()) continue;

        const c = churchById.get(svc.churchId)!;
        items.push({
          occursAt: occursAt.toISOString(),
          service: override
            ? {
                ...svc,
                startTime,
                endTime: override.override?.endTime ?? svc.endTime,
                label: override.override?.label ?? svc.label,
                hasLiveStream: override.override?.hasLiveStream ?? svc.hasLiveStream,
              }
            : svc,
          church: { id: c.id, slug: c.slug, name: c.name, city: c.city, country: c.country },
        });
      }
    }

    items.sort((a, b) => a.occursAt.localeCompare(b.occursAt));
    return items.slice(0, limit);
  }
}
