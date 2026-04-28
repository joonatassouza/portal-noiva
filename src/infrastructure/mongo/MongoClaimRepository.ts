import { Collection } from 'mongodb';
import { ClaimStatus, OwnershipClaim } from '@/domain/entities/OwnershipClaim';
import { ClaimRepository } from '@/application/ports/ClaimRepository';
import { getDb } from '@/infrastructure/mongo/client';

interface ClaimDoc {
  _id: string;
  churchId: string;
  claimantUserId: string;
  claimantEmail: string;
  claimantName?: string;
  evidence: string;
  evidenceLinks: string[];
  status: ClaimStatus;
  reviewerNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
}

function toEntity(d: ClaimDoc): OwnershipClaim {
  return {
    id: d._id,
    churchId: d.churchId,
    claimantUserId: d.claimantUserId,
    claimantEmail: d.claimantEmail,
    claimantName: d.claimantName,
    evidence: d.evidence,
    evidenceLinks: d.evidenceLinks ?? [],
    status: d.status,
    reviewerNotes: d.reviewerNotes,
    reviewedBy: d.reviewedBy,
    reviewedAt: d.reviewedAt,
    createdAt: d.createdAt,
  };
}

export class MongoClaimRepository implements ClaimRepository {
  private async col(): Promise<Collection<ClaimDoc>> {
    const db = await getDb();
    return db.collection<ClaimDoc>('ownership_claims');
  }

  async findById(id: string): Promise<OwnershipClaim | null> {
    const doc = await (await this.col()).findOne({ _id: id });
    return doc ? toEntity(doc) : null;
  }

  async listPending(): Promise<OwnershipClaim[]> {
    const docs = await (await this.col())
      .find({ status: 'PENDING' })
      .sort({ createdAt: 1 })
      .toArray();
    return docs.map(toEntity);
  }

  async listByChurch(churchId: string): Promise<OwnershipClaim[]> {
    const docs = await (await this.col())
      .find({ churchId })
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map(toEntity);
  }

  async hasPendingForChurch(churchId: string): Promise<boolean> {
    const doc = await (await this.col()).findOne({ churchId, status: 'PENDING' });
    return Boolean(doc);
  }

  async save(claim: OwnershipClaim): Promise<void> {
    await (await this.col()).updateOne(
      { _id: claim.id },
      {
        $set: {
          churchId: claim.churchId,
          claimantUserId: claim.claimantUserId,
          claimantEmail: claim.claimantEmail,
          claimantName: claim.claimantName,
          evidence: claim.evidence,
          evidenceLinks: claim.evidenceLinks,
          status: claim.status,
          reviewerNotes: claim.reviewerNotes,
          reviewedBy: claim.reviewedBy,
          reviewedAt: claim.reviewedAt,
        },
        $setOnInsert: { createdAt: claim.createdAt },
      },
      { upsert: true },
    );
  }

  async updateStatus(
    id: string,
    status: ClaimStatus,
    reviewerId: string,
    notes?: string,
  ): Promise<void> {
    await (await this.col()).updateOne(
      { _id: id },
      {
        $set: {
          status,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          reviewerNotes: notes,
        },
      },
    );
  }
}
