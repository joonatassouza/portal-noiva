import { ChurchRepository } from '@/application/ports/ChurchRepository';
import { InvitationRepository } from '@/application/ports/InvitationRepository';
import { NotificationRepository } from '@/application/ports/NotificationRepository';
import { RoleRepository } from '@/application/ports/RoleRepository';
import { Invitation } from '@/domain/entities/Invitation';
import { Notification } from '@/domain/entities/Notification';
import { NotFoundError, UnauthorizedError, ValidationError } from '@/domain/errors/DomainError';
import { Principal } from '@/domain/policies/access';
import { randomUUID } from '@/shared/uuid';

export interface AcceptInvitationResult {
  status: 'ACCEPTED' | 'INVALID' | 'EXPIRED' | 'EMAIL_MISMATCH';
  invitation?: Invitation;
}

export class AcceptInvitation {
  constructor(
    private readonly invitations: InvitationRepository,
    private readonly roles: RoleRepository,
    private readonly notifications: NotificationRepository,
    private readonly churches: ChurchRepository,
  ) {}

  async execute(principal: Principal | null, token: string): Promise<AcceptInvitationResult> {
    if (!principal) throw new UnauthorizedError('Login required to accept an invitation.');

    const inv = await this.invitations.findByToken(token);
    if (!inv) throw new NotFoundError('Invitation');

    if (inv.status === 'EXPIRED' || inv.expiresAt.getTime() < Date.now()) {
      if (inv.status !== 'EXPIRED') {
        await this.invitations.updateStatus(inv.id, 'EXPIRED');
      }
      return { status: 'EXPIRED', invitation: inv };
    }
    if (inv.status !== 'PENDING') {
      return { status: 'INVALID', invitation: inv };
    }
    if (inv.email.toLowerCase() !== principal.email.toLowerCase()) {
      return { status: 'EMAIL_MISMATCH', invitation: inv };
    }

    await this.roles.upsert({
      churchId: inv.churchId,
      userId: principal.userId,
      roleType: inv.roleType,
    });
    await this.invitations.updateStatus(inv.id, 'ACCEPTED', principal.userId);

    // Notify the inviter that their invitation was accepted.
    const church = await this.churches.findById(inv.churchId);
    const n: Notification = {
      id: randomUUID(),
      recipientUserId: inv.invitedByUserId,
      type: 'INVITATION_ACCEPTED',
      title: `${principal.email} aceitou seu convite`,
      href: church ? `/painel/${church.slug}/equipe` : undefined,
      payload: { churchId: inv.churchId, roleType: inv.roleType },
      createdAt: new Date(),
    };
    await this.notifications.save(n);

    return { status: 'ACCEPTED', invitation: inv };
  }
}

// Re-export for convenience.
export { ValidationError };
