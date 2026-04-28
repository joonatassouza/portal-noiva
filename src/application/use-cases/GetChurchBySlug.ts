import { ChurchRepository } from '@/application/ports/ChurchRepository';
import { EventRepository } from '@/application/ports/EventRepository';
import { ServiceRepository } from '@/application/ports/ServiceRepository';
import { Clock } from '@/application/ports/Clock';
import { Church } from '@/domain/entities/Church';
import { Event } from '@/domain/entities/Event';
import { Service } from '@/domain/entities/Service';
import { NotFoundError } from '@/domain/errors/DomainError';
import { compareServicesForDisplay } from '@/shared/services';

export interface ChurchPageData {
  church: Church;
  services: Service[];
  upcomingEvents: Event[];
}

export class GetChurchBySlug {
  constructor(
    private readonly churches: ChurchRepository,
    private readonly services: ServiceRepository,
    private readonly events: EventRepository,
    private readonly clock: Clock,
  ) {}

  async execute(slug: string): Promise<ChurchPageData> {
    const church = await this.churches.findBySlug(slug);
    if (!church) throw new NotFoundError('Church', slug);

    const [services, eventsPage] = await Promise.all([
      this.services.listByChurch(church.id),
      this.events.listUpcoming({
        churchId: church.id,
        from: this.clock.now(),
        limit: 10,
      }),
    ]);

    services.sort(compareServicesForDisplay);
    return { church, services, upcomingEvents: eventsPage.items };
  }
}
