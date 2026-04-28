import { ChurchRepository } from '@/application/ports/ChurchRepository';
import { ClaimRepository } from '@/application/ports/ClaimRepository';
import { OwnershipClaim } from '@/domain/entities/OwnershipClaim';
import { NotFoundError, UnauthorizedError, ValidationError } from '@/domain/errors/DomainError';
import { Principal } from '@/domain/policies/access';
import { randomUUID } from '@/shared/uuid';
import { NotifyMasterAdmin } from './NotifyMasterAdmin';

export interface SubmitClaimInput {
  churchId: string;
  evidence: string;
  evidenceLinks?: string[];
}

export class SubmitClaim {
  constructor(
    private readonly claims: ClaimRepository,
    private readonly churches: ChurchRepository,
    private readonly notifyMasterAdmin: NotifyMasterAdmin,
  ) {}

  async execute(principal: Principal | null, input: SubmitClaimInput): Promise<OwnershipClaim> {
    if (!principal) throw new UnauthorizedError('Login required to claim a church.');
    if (input.evidence.trim().length < 20) {
      throw new ValidationError('Please describe your relationship with the church (≥ 20 chars).');
    }

    const church = await this.churches.findById(input.churchId);
    if (!church) throw new NotFoundError('Church', input.churchId);
    if (church.ownershipStatus === 'CLAIMED') {
      throw new ValidationError('This church already has an owner.');
    }
    if (await this.claims.hasPendingForChurch(church.id)) {
      throw new ValidationError('A claim is already pending for this church.');
    }

    const claim: OwnershipClaim = {
      id: randomUUID(),
      churchId: church.id,
      claimantUserId: principal.userId,
      claimantEmail: principal.email,
      evidence: input.evidence.trim(),
      evidenceLinks: (input.evidenceLinks ?? []).map((s) => s.trim()).filter(Boolean),
      status: 'PENDING',
      createdAt: new Date(),
    };

    await this.claims.save(claim);

    if (church.ownershipStatus === 'UNCLAIMED') {
      await this.churches.save({
        ...church,
        ownershipStatus: 'PENDING_REVIEW',
        updatedAt: new Date(),
      });
    }

    await this.notifyMasterAdmin.execute({
      type: 'OWNERSHIP_CLAIM_SUBMITTED',
      title: `Novo claim para ${church.name}`,
      body: `${claim.claimantEmail}`,
      href: '/admin/claims',
      payload: { claimId: claim.id, churchId: church.id, churchSlug: church.slug },
    });

    return claim;
  }
}
