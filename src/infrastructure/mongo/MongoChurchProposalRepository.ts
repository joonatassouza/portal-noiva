import { Collection } from 'mongodb';

import {
  ChurchProposal,
  ChurchProposalStatus,
} from '@/domain/entities/ChurchProposal';
import { ChurchProposalRepository } from '@/application/ports/ChurchProposalRepository';
import { getDb } from '@/infrastructure/mongo/client';

interface ProposalDoc {
  _id: string;
  proposerUserId: string;
  proposerEmail: string;
  proposerName?: string;
  evidence: string;
  evidenceLinks: string[];
  church: ChurchProposal['church'];
  status: ChurchProposalStatus;
  reviewerNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdChurchId?: string;
  createdAt: Date;
}

function toEntity(d: ProposalDoc): ChurchProposal {
  return {
    id: d._id,
    proposerUserId: d.proposerUserId,
    proposerEmail: d.proposerEmail,
    proposerName: d.proposerName,
    evidence: d.evidence,
    evidenceLinks: d.evidenceLinks ?? [],
    church: d.church,
    status: d.status,
    reviewerNotes: d.reviewerNotes,
    reviewedBy: d.reviewedBy,
    reviewedAt: d.reviewedAt,
    createdChurchId: d.createdChurchId,
    createdAt: d.createdAt,
  };
}

export class MongoChurchProposalRepository implements ChurchProposalRepository {
  private async col(): Promise<Collection<ProposalDoc>> {
    const db = await getDb();
    return db.collection<ProposalDoc>('church_proposals');
  }

  async findById(id: string): Promise<ChurchProposal | null> {
    const doc = await (await this.col()).findOne({ _id: id });
    return doc ? toEntity(doc) : null;
  }

  async listPending(): Promise<ChurchProposal[]> {
    const docs = await (await this.col())
      .find({ status: 'PENDING' })
      .sort({ createdAt: 1 })
      .toArray();
    return docs.map(toEntity);
  }

  async listByProposer(userId: string): Promise<ChurchProposal[]> {
    const docs = await (await this.col())
      .find({ proposerUserId: userId })
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map(toEntity);
  }

  async hasPendingDuplicate(args: {
    proposerUserId: string;
    name: string;
    city: string;
  }): Promise<boolean> {
    const doc = await (await this.col()).findOne({
      proposerUserId: args.proposerUserId,
      status: 'PENDING',
      'church.name': args.name,
      'church.city': args.city,
    });
    return Boolean(doc);
  }

  async save(p: ChurchProposal): Promise<void> {
    await (await this.col()).updateOne(
      { _id: p.id },
      {
        $set: {
          proposerUserId: p.proposerUserId,
          proposerEmail: p.proposerEmail,
          proposerName: p.proposerName,
          evidence: p.evidence,
          evidenceLinks: p.evidenceLinks,
          church: p.church,
          status: p.status,
          reviewerNotes: p.reviewerNotes,
          reviewedBy: p.reviewedBy,
          reviewedAt: p.reviewedAt,
          createdChurchId: p.createdChurchId,
        },
        $setOnInsert: { createdAt: p.createdAt },
      },
      { upsert: true },
    );
  }

  async updateStatus(args: {
    id: string;
    status: ChurchProposalStatus;
    reviewerId: string;
    notes?: string;
    createdChurchId?: string;
  }): Promise<void> {
    await (await this.col()).updateOne(
      { _id: args.id },
      {
        $set: {
          status: args.status,
          reviewedBy: args.reviewerId,
          reviewedAt: new Date(),
          reviewerNotes: args.notes,
          createdChurchId: args.createdChurchId,
        },
      },
    );
  }
}
