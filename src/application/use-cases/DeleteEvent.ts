import { EventRepository } from '@/application/ports/EventRepository';
import { RoleRepository } from '@/application/ports/RoleRepository';
import { NotFoundError } from '@/domain/errors/DomainError';
import { assertChurchAccess, Principal } from '@/domain/policies/access';

export class DeleteEvent {
  constructor(
    private readonly events: EventRepository,
    private readonly roles: RoleRepository,
  ) {}

  async execute(principal: Principal | null, eventId: string): Promise<void> {
    if (!principal) throw new Error('Login required.');
    const ev = await this.events.findById(eventId);
    if (!ev) throw new NotFoundError('Event', eventId);

    const role = await this.roles.findByUserAndChurch(principal.userId, ev.churchId);
    assertChurchAccess(principal, role, 'EDITOR_ADMIN');

    await this.events.deleteById(eventId);
  }
}
