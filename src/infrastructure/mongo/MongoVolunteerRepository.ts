import { Collection } from 'mongodb';

import {
  VolunteerApplication,
  VolunteerStatus,
} from '@/domain/entities/VolunteerApplication';
import { VolunteerRepository } from '@/application/ports/VolunteerRepository';
import { getDb } from '@/infrastructure/mongo/client';

interface VolunteerDoc {
  _id: string;
  eventId: string;
  churchId: string;
  applicantUserId: string;
  applicantEmail: string;
  applicantName?: string;
  applicantWhatsapp?: string;
  offeredRole: string;
  coverMessage?: string;
  status: VolunteerStatus;
  reviewerNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

function toEntity(d: VolunteerDoc): VolunteerApplication {
  return {
    id: d._id,
    eventId: d.eventId,
    churchId: d.churchId,
    applicantUserId: d.applicantUserId,
    applicantEmail: d.applicantEmail,
    applicantName: d.applicantName,
    applicantWhatsapp: d.applicantWhatsapp,
    offeredRole: d.offeredRole,
    coverMessage: d.coverMessage,
    status: d.status,
    reviewerNotes: d.reviewerNotes,
    reviewedBy: d.reviewedBy,
    reviewedAt: d.reviewedAt,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt ?? d.createdAt,
  };
}

export class MongoVolunteerRepository implements VolunteerRepository {
  private async col(): Promise<Collection<VolunteerDoc>> {
    const db = await getDb();
    return db.collection<VolunteerDoc>('volunteer_applications');
  }

  async findById(id: string): Promise<VolunteerApplication | null> {
    const doc = await (await this.col()).findOne({ _id: id });
    return doc ? toEntity(doc) : null;
  }

  async findByEventAndUser(
    eventId: string,
    userId: string,
  ): Promise<VolunteerApplication | null> {
    const doc = await (await this.col()).findOne({ eventId, applicantUserId: userId });
    return doc ? toEntity(doc) : null;
  }

  async listByEvent(eventId: string): Promise<VolunteerApplication[]> {
    const docs = await (await this.col())
      .find({ eventId })
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map(toEntity);
  }

  async listByChurch(churchId: string): Promise<VolunteerApplication[]> {
    const docs = await (await this.col())
      .find({ churchId })
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map(toEntity);
  }

  async hasApplied(eventId: string, userId: string): Promise<boolean> {
    const doc = await (await this.col()).findOne({ eventId, applicantUserId: userId });
    return Boolean(doc);
  }

  async save(application: VolunteerApplication): Promise<void> {
    await (await this.col()).updateOne(
      { _id: application.id },
      {
        $set: {
          eventId: application.eventId,
          churchId: application.churchId,
          applicantUserId: application.applicantUserId,
          applicantEmail: application.applicantEmail,
          applicantName: application.applicantName,
          applicantWhatsapp: application.applicantWhatsapp,
          offeredRole: application.offeredRole,
          coverMessage: application.coverMessage,
          status: application.status,
          reviewerNotes: application.reviewerNotes,
          reviewedBy: application.reviewedBy,
          reviewedAt: application.reviewedAt,
          updatedAt: application.updatedAt,
        },
        $setOnInsert: { createdAt: application.createdAt },
      },
      { upsert: true },
    );
  }

  async updateStatus(
    id: string,
    status: VolunteerStatus,
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
