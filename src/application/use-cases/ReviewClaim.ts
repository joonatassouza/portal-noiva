import { ChurchRepository } from '@/application/ports/ChurchRepository';
import { ClaimRepository } from '@/application/ports/ClaimRepository';
import { NotificationRepository } from '@/application/ports/NotificationRepository';
import { RoleRepository } from '@/application/ports/RoleRepository';
import { Notification } from '@/domain/entities/Notification';
import { NotFoundError, ValidationError } from '@/domain/errors/DomainError';
import { assertMasterAdmin, Principal } from '@/domain/policies/access';
import { randomUUID } from '@/shared/uuid';

export class ReviewClaim {
  constructor(
    private readonly claims: ClaimRepository,
    private readonly churches: ChurchRepository,
    private readonly roles: RoleRepository,
    private readonly notifications: NotificationRepository,
  ) {}

  async execute(
    principal: Principal | null,
    args: { claimId: string; approve: boolean; notes?: string },
  ): Promise<void> {
    assertMasterAdmin(principal);

    const claim = await this.claims.findById(args.claimId);
    if (!claim) throw new NotFoundError('Claim', args.claimId);
    if (claim.status !== 'PENDING') {
      throw new ValidationError('This claim has already been reviewed.');
    }

    if (args.approve) {
      const church = await this.churches.findById(claim.churchId);
      if (!church) throw new NotFoundError('Church', claim.churchId);

      await this.roles.upsert({
        churchId: claim.churchId,
        userId: claim.claimantUserId,
        roleType: 'OWNER',
      });
      await this.churches.save({
        ...church,
        ownershipStatus: 'CLAIMED',
        updatedAt: new Date(),
      });
      await this.claims.updateStatus(claim.id, 'APPROVED', principal.userId, args.notes);

      const n: Notification = {
        id: randomUUID(),
        recipientUserId: claim.claimantUserId,
        type: 'OWNERSHIP_CLAIM_APPROVED',
        title: `Reivindicação aprovada para ${church.name}`,
        body: args.notes,
        href: `/painel/${church.slug}`,
        createdAt: new Date(),
        payload: { churchId: church.id, churchSlug: church.slug },
      };
      await this.notifications.save(n);
    } else {
      await this.claims.updateStatus(claim.id, 'REJECTED', principal.userId, args.notes);
      const stillPending = await this.claims.hasPendingForChurch(claim.churchId);
      const church = await this.churches.findById(claim.churchId);
      if (!stillPending && church && church.ownershipStatus === 'PENDING_REVIEW') {
        await this.churches.save({
          ...church,
          ownershipStatus: 'UNCLAIMED',
          updatedAt: new Date(),
        });
      }

      const n: Notification = {
        id: randomUUID(),
        recipientUserId: claim.claimantUserId,
        type: 'OWNERSHIP_CLAIM_REJECTED',
        title: church ? `Reivindicação não aprovada — ${church.name}` : 'Reivindicação não aprovada',
        body: args.notes,
        href: church ? `/igreja/${church.slug}` : '/igrejas',
        createdAt: new Date(),
        payload: { churchId: claim.churchId, churchSlug: church?.slug },
      };
      await this.notifications.save(n);
    }
  }
}
