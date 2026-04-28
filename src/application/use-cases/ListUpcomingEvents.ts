import { ChurchRepository } from '@/application/ports/ChurchRepository';
import { EventRepository, UpcomingPage } from '@/application/ports/EventRepository';
import { Clock } from '@/application/ports/Clock';
import { Church } from '@/domain/entities/Church';
import { Event } from '@/domain/entities/Event';

export interface UpcomingEventItem {
  event: Event;
  church: Pick<Church, 'id' | 'slug' | 'name' | 'city' | 'country'> & {
    /** For "Assistir ao vivo" link from feed cards. */
    youtubeUrl?: string;
  };
}

export class ListUpcomingEvents {
  constructor(
    private readonly churches: ChurchRepository,
    private readonly events: EventRepository,
    private readonly clock: Clock,
  ) {}

  async execute(opts: { cursor?: string; limit?: number } = {}): Promise<UpcomingPage<UpcomingEventItem>> {
    const page = await this.events.listUpcoming({
      from: this.clock.now(),
      cursor: opts.cursor,
      limit: opts.limit ?? 10,
    });

    if (page.items.length === 0) return { items: [], nextCursor: page.nextCursor };

    const churchIds = Array.from(new Set(page.items.map((e) => e.churchId)));
    const churches = await Promise.all(churchIds.map((id) => this.churches.findById(id)));
    const byId = new Map(churches.filter((c): c is Church => Boolean(c)).map((c) => [c.id, c]));

    const items: UpcomingEventItem[] = [];
    for (const event of page.items) {
      const c = byId.get(event.churchId);
      if (!c) continue;
      items.push({
        event,
        church: {
          id: c.id,
          slug: c.slug,
          name: c.name,
          city: c.city,
          country: c.country,
          youtubeUrl: c.social?.youtubeUrl,
        },
      });
    }
    return { items, nextCursor: page.nextCursor };
  }
}
