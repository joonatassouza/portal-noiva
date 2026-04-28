import { ChurchProposalRepository } from '@/application/ports/ChurchProposalRepository';
import { ChurchProposal } from '@/domain/entities/ChurchProposal';
import { UnauthorizedError, ValidationError } from '@/domain/errors/DomainError';
import { Principal } from '@/domain/policies/access';
import { randomUUID } from '@/shared/uuid';
import { NotifyMasterAdmin } from './NotifyMasterAdmin';

export interface SubmitChurchProposalInput {
  name: string;
  description?: string;
  physicalAddress: string;
  city: string;
  country: string;
  coords?: { lat: number; lng: number };
  social?: {
    youtubeUrl?: string;
    instagramUrl?: string;
    facebookUrl?: string;
    websiteUrl?: string;
  };
  evidence: string;
  evidenceLinks?: string[];
  proposerName?: string;
}

/**
 * Logged-in users propose a NEW church to the catalog. Master admin reviews.
 * The proposal does not appear publicly until approved.
 */
export class SubmitChurchProposal {
  constructor(
    private readonly proposals: ChurchProposalRepository,
    private readonly notifyMasterAdmin: NotifyMasterAdmin,
  ) {}

  async execute(
    principal: Principal | null,
    input: SubmitChurchProposalInput,
  ): Promise<ChurchProposal> {
    if (!principal) throw new UnauthorizedError('Login required to propose a church.');
    if (!input.name.trim()) throw new ValidationError('Name is required.');
    if (!input.city.trim()) throw new ValidationError('City is required.');
    if (!input.country.trim()) throw new ValidationError('Country is required.');
    if (input.evidence.trim().length < 20) {
      throw new ValidationError('Please describe your relationship with the church (≥ 20 chars).');
    }

    if (
      await this.proposals.hasPendingDuplicate({
        proposerUserId: principal.userId,
        name: input.name.trim(),
        city: input.city.trim(),
      })
    ) {
      throw new ValidationError('You already have a pending proposal for this church.');
    }

    const proposal: ChurchProposal = {
      id: randomUUID(),
      proposerUserId: principal.userId,
      proposerEmail: principal.email,
      proposerName: input.proposerName?.trim() || undefined,
      evidence: input.evidence.trim(),
      evidenceLinks: (input.evidenceLinks ?? []).map((s) => s.trim()).filter(Boolean),
      church: {
        name: input.name.trim(),
        description: input.description?.trim() || undefined,
        physicalAddress: input.physicalAddress.trim(),
        city: input.city.trim(),
        country: input.country.trim(),
        coords: input.coords,
        social: {
          youtubeUrl: input.social?.youtubeUrl?.trim() || undefined,
          instagramUrl: input.social?.instagramUrl?.trim() || undefined,
          facebookUrl: input.social?.facebookUrl?.trim() || undefined,
          websiteUrl: input.social?.websiteUrl?.trim() || undefined,
        },
      },
      status: 'PENDING',
      createdAt: new Date(),
    };

    await this.proposals.save(proposal);

    await this.notifyMasterAdmin.execute({
      type: 'OWNERSHIP_CLAIM_SUBMITTED',
      title: `Nova proposta de igreja: ${proposal.church.name}`,
      body: `${proposal.church.city} · ${proposal.proposerEmail}`,
      payload: { proposalId: proposal.id, kind: 'CHURCH_PROPOSAL' },
    });

    return proposal;
  }
}
