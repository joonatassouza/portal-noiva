import { EventRepository } from '@/application/ports/EventRepository';
import { RoleRepository } from '@/application/ports/RoleRepository';
import { Event } from '@/domain/entities/Event';
import { ValidationError } from '@/domain/errors/DomainError';
import { assertChurchAccess, Principal } from '@/domain/policies/access';
import { isValidSlug, slugify } from '@/shared/slug';
import { randomUUID } from '@/shared/uuid';

export interface UpsertEventInput {
  id?: string;
  churchId: string;
  slug?: string;
  title: string;
  description?: string;
  startDatetime: Date;
  endDatetime?: Date;
  eventLocation?: string;
  acceptingVolunteers: boolean;
}

export class UpsertEvent {
  constructor(
    private readonly events: EventRepository,
    private readonly roles: RoleRepository,
  ) {}

  async execute(principal: Principal | null, input: UpsertEventInput): Promise<Event> {
    if (!principal) throw new Error('Login required.');
    const role = await this.roles.findByUserAndChurch(principal.userId, input.churchId);
    assertChurchAccess(principal, role, 'EDITOR_ADMIN');

    if (!input.title.trim()) throw new ValidationError('Title is required.');
    if (!(input.startDatetime instanceof Date)) throw new ValidationError('Invalid start datetime.');

    const slug = input.slug?.trim() || slugify(input.title);
    if (!isValidSlug(slug)) throw new ValidationError(`Invalid slug: ${slug}`);

    const now = new Date();
    const existing = input.id ? await this.events.findById(input.id) : null;

    const event: Event = {
      id: input.id ?? existing?.id ?? randomUUID(),
      churchId: input.churchId,
      slug,
      title: input.title.trim(),
      description: input.description?.trim() || undefined,
      startDatetime: input.startDatetime,
      endDatetime: input.endDatetime,
      eventLocation: input.eventLocation?.trim() || undefined,
      acceptingVolunteers: input.acceptingVolunteers,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await this.events.save(event);
    return event;
  }
}
