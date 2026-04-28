/**
 * A user-submitted proposal to add a NEW church to the catalog.
 *
 * Different from OwnershipClaim, which targets an existing church.
 * Approving a proposal:
 *   1) creates a Church with ownershipStatus=CLAIMED
 *   2) creates a ChurchRole(OWNER) for the proposer
 *
 * Until approved, the proposal does NOT appear in the public catalog.
 */
export type ChurchProposalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ChurchProposalChurchData {
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
}

export interface ChurchProposal {
  id: string;
  proposerUserId: string;
  proposerEmail: string;
  proposerName?: string;
  /** Free text proof — same shape as OwnershipClaim.evidence. */
  evidence: string;
  evidenceLinks: string[];
  church: ChurchProposalChurchData;
  status: ChurchProposalStatus;
  reviewerNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  /** Populated after approval — the id of the resulting Church record. */
  createdChurchId?: string;
  createdAt: Date;
}
