import { ChurchRepository } from '@/application/ports/ChurchRepository';
import { ChurchProposalRepository } from '@/application/ports/ChurchProposalRepository';
import { Geocoder } from '@/application/ports/Geocoder';
import { NotificationRepository } from '@/application/ports/NotificationRepository';
import { RoleRepository } from '@/application/ports/RoleRepository';

import { Church } from '@/domain/entities/Church';
import { Notification } from '@/domain/entities/Notification';
import {
  NotFoundError,
  ValidationError,
} from '@/domain/errors/DomainError';
import { assertMasterAdmin, Principal } from '@/domain/policies/access';
import { makeCoordinates } from '@/domain/value-objects/Coordinates';
import { randomUUID } from '@/shared/uuid';
import { slugify } from '@/shared/slug';

export class ReviewChurchProposal {
  constructor(
    private readonly proposals: ChurchProposalRepository,
    private readonly churches: ChurchRepository,
    private readonly roles: RoleRepository,
    private readonly notifications: NotificationRepository,
    private readonly geocoder: Geocoder,
  ) {}

  async execute(
    principal: Principal | null,
    args: { proposalId: string; approve: boolean; notes?: string },
  ): Promise<void> {
    assertMasterAdmin(principal);

    const proposal = await this.proposals.findById(args.proposalId);
    if (!proposal) throw new NotFoundError('ChurchProposal', args.proposalId);
    if (proposal.status !== 'PENDING') {
      throw new ValidationError('This proposal has already been reviewed.');
    }

    if (args.approve) {
      // Resolve coords if proposer didn't provide them.
      let coords = proposal.church.coords;
      if (!coords) {
        const geo = await this.geocoder.search(
          `${proposal.church.physicalAddress}, ${proposal.church.city}, ${proposal.church.country}`,
        );
        if (geo) coords = { lat: geo.lat, lng: geo.lng };
      }

      const slug = await this.generateUniqueSlug(proposal.church.name, proposal.church.city);
      const now = new Date();
      const churchId = randomUUID();
      const church: Church = {
        id: churchId,
        slug,
        name: proposal.church.name,
        description: proposal.church.description,
        physicalAddress: proposal.church.physicalAddress,
        city: proposal.church.city,
        country: proposal.church.country,
        coords: coords ? makeCoordinates(coords.lat, coords.lng) : undefined,
        social: proposal.church.social ?? {},
        pix: {},
        ownershipStatus: 'CLAIMED',
        createdAt: now,
        updatedAt: now,
      };
      await this.churches.save(church);

      await this.roles.upsert({
        churchId,
        userId: proposal.proposerUserId,
        roleType: 'OWNER',
      });

      await this.proposals.updateStatus({
        id: proposal.id,
        status: 'APPROVED',
        reviewerId: principal.userId,
        notes: args.notes,
        createdChurchId: churchId,
      });

      const n: Notification = {
        id: randomUUID(),
        recipientUserId: proposal.proposerUserId,
        type: 'OWNERSHIP_CLAIM_APPROVED',
        title: `Proposta aprovada: ${church.name}`,
        body: args.notes,
        href: `/painel/${slug}`,
        payload: { churchId, churchSlug: slug, proposalId: proposal.id },
        createdAt: new Date(),
      };
      await this.notifications.save(n);
    } else {
      await this.proposals.updateStatus({
        id: proposal.id,
        status: 'REJECTED',
        reviewerId: principal.userId,
        notes: args.notes,
      });

      const n: Notification = {
        id: randomUUID(),
        recipientUserId: proposal.proposerUserId,
        type: 'OWNERSHIP_CLAIM_REJECTED',
        title: `Proposta não aprovada: ${proposal.church.name}`,
        body: args.notes,
        href: '/igrejas',
        payload: { proposalId: proposal.id },
        createdAt: new Date(),
      };
      await this.notifications.save(n);
    }
  }

  private async generateUniqueSlug(name: string, city: string): Promise<string> {
    const base = slugify(`${name} ${city}`);
    let candidate = base;
    let suffix = 2;
    while (await this.churches.findBySlug(candidate)) {
      candidate = `${base}-${suffix++}`;
    }
    return candidate;
  }
}
