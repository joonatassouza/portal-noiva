import { InvitationRepository } from '@/application/ports/InvitationRepository';
import { RoleRepository } from '@/application/ports/RoleRepository';
import { Invitation } from '@/domain/entities/Invitation';
import { ChurchRoleType } from '@/domain/entities/ChurchRole';
import { ValidationError } from '@/domain/errors/DomainError';
import { assertChurchAccess, Principal } from '@/domain/policies/access';
import { randomToken, randomUUID } from '@/shared/uuid';

const TTL_DAYS = 7;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class CreateInvitation {
  constructor(
    private readonly invitations: InvitationRepository,
    private readonly roles: RoleRepository,
  ) {}

  async execute(
    principal: Principal | null,
    args: { churchId: string; email: string; roleType: ChurchRoleType },
  ): Promise<Invitation> {
    if (!principal) throw new Error('Login required.');
    const role = await this.roles.findByUserAndChurch(principal.userId, args.churchId);
    // Only OWNERs (or master admin) can invite.
    assertChurchAccess(principal, role, 'OWNER');

    const email = args.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) throw new ValidationError('Invalid email.');
    if (args.roleType === 'OWNER') {
      throw new ValidationError('Use ownership transfer for OWNER role, not invitation.');
    }

    const now = new Date();
    const inv: Invitation = {
      id: randomUUID(),
      token: randomToken(),
      churchId: args.churchId,
      email,
      roleType: args.roleType,
      invitedByUserId: principal.userId,
      status: 'PENDING',
      expiresAt: new Date(now.getTime() + TTL_DAYS * 24 * 60 * 60 * 1000),
      createdAt: now,
    };
    await this.invitations.save(inv);
    return inv;
  }
}
