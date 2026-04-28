export type ClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface OwnershipClaim {
  id: string;
  churchId: string;
  claimantUserId: string;
  claimantEmail: string;
  claimantName?: string;
  /** Free text proof: contact info, role at the church, references. */
  evidence: string;
  /** Optional public-facing URLs (YouTube sermon, blog post, social posts). */
  evidenceLinks: string[];
  status: ClaimStatus;
  /** Master admin notes when reviewing. */
  reviewerNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
}
