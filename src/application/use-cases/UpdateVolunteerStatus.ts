import { ChurchRepository } from '@/application/ports/ChurchRepository';
import { VolunteerRepository } from '@/application/ports/VolunteerRepository';
import { RoleRepository } from '@/application/ports/RoleRepository';
import { NotificationRepository } from '@/application/ports/NotificationRepository';
import { Notification } from '@/domain/entities/Notification';
import {
  VolunteerApplication,
  VolunteerStatus,
} from '@/domain/entities/VolunteerApplication';
import { NotFoundError, UnauthorizedError } from '@/domain/errors/DomainError';
import { assertChurchAccess, Principal } from '@/domain/policies/access';
import { randomUUID } from '@/shared/uuid';

const STATUS_LABEL: Record<VolunteerStatus, string> = {
  SUBMITTED: 'Submetido',
  CONTACTED: 'Em contato',
  ACCEPTED: 'Aceito',
  REJECTED: 'Rejeitado',
  CANCELLED: 'Cancelado',
};

export class UpdateVolunteerStatus {
  constructor(
    private readonly volunteers: VolunteerRepository,
    private readonly roles: RoleRepository,
    private readonly notifications: NotificationRepository,
    private readonly churches: ChurchRepository,
  ) {}

  async execute(
    principal: Principal | null,
    args: { applicationId: string; status: VolunteerStatus; notes?: string },
  ): Promise<VolunteerApplication> {
    if (!principal) throw new UnauthorizedError('Login required.');

    const app = await this.volunteers.findById(args.applicationId);
    if (!app) throw new NotFoundError('VolunteerApplication', args.applicationId);

    const role = await this.roles.findByUserAndChurch(principal.userId, app.churchId);
    assertChurchAccess(principal, role, 'EDITOR_ADMIN');

    await this.volunteers.updateStatus(app.id, args.status, principal.userId, args.notes);

    const church = await this.churches.findById(app.churchId);
    const n: Notification = {
      id: randomUUID(),
      recipientUserId: app.applicantUserId,
      type: 'VOLUNTEER_STATUS_CHANGED',
      title: `Sua candidatura agora está: ${STATUS_LABEL[args.status]}`,
      body: args.notes,
      href: church ? `/igreja/${church.slug}` : undefined,
      createdAt: new Date(),
      payload: { applicationId: app.id, eventId: app.eventId, status: args.status },
    };
    await this.notifications.save(n);

    return { ...app, status: args.status };
  }
}
