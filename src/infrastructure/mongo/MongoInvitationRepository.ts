import { Collection } from 'mongodb';
import { Invitation, InvitationStatus } from '@/domain/entities/Invitation';
import { InvitationRepository } from '@/application/ports/InvitationRepository';
import { getDb } from '@/infrastructure/mongo/client';

interface InvitationDoc {
  _id: string;
  token: string;
  churchId: string;
  email: string;
  roleType: 'OWNER' | 'EDITOR_ADMIN' | 'MEDIA_EDITOR';
  invitedByUserId: string;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
  acceptedAt?: Date;
  acceptedByUserId?: string;
}

function toEntity(d: InvitationDoc): Invitation {
  return {
    id: d._id,
    token: d.token,
    churchId: d.churchId,
    email: d.email,
    roleType: d.roleType,
    invitedByUserId: d.invitedByUserId,
    status: d.status,
    expiresAt: d.expiresAt,
    createdAt: d.createdAt,
    acceptedAt: d.acceptedAt,
    acceptedByUserId: d.acceptedByUserId,
  };
}

export class MongoInvitationRepository implements InvitationRepository {
  private async col(): Promise<Collection<InvitationDoc>> {
    const db = await getDb();
    return db.collection<InvitationDoc>('invitations');
  }

  async findByToken(token: string): Promise<Invitation | null> {
    const doc = await (await this.col()).findOne({ token });
    return doc ? toEntity(doc) : null;
  }

  async listByChurch(churchId: string): Promise<Invitation[]> {
    const docs = await (await this.col())
      .find({ churchId })
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map(toEntity);
  }

  async save(invitation: Invitation): Promise<void> {
    await (await this.col()).updateOne(
      { _id: invitation.id },
      {
        $set: {
          token: invitation.token,
          churchId: invitation.churchId,
          email: invitation.email,
          roleType: invitation.roleType,
          invitedByUserId: invitation.invitedByUserId,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
          acceptedAt: invitation.acceptedAt,
          acceptedByUserId: invitation.acceptedByUserId,
        },
        $setOnInsert: { createdAt: invitation.createdAt },
      },
      { upsert: true },
    );
  }

  async updateStatus(
    id: string,
    status: InvitationStatus,
    acceptedByUserId?: string,
  ): Promise<void> {
    const $set: Record<string, unknown> = { status };
    if (status === 'ACCEPTED') {
      $set.acceptedAt = new Date();
      if (acceptedByUserId) $set.acceptedByUserId = acceptedByUserId;
    }
    await (await this.col()).updateOne({ _id: id }, { $set });
  }
}
