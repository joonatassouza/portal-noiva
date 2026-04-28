import { Collection } from 'mongodb';
import { ChurchRole } from '@/domain/entities/ChurchRole';
import { RoleRepository } from '@/application/ports/RoleRepository';
import { getDb } from '@/infrastructure/mongo/client';

interface RoleDoc {
  _id: string;
  churchId: string;
  userId: string;
  roleType: 'OWNER' | 'EDITOR_ADMIN' | 'MEDIA_EDITOR';
  createdAt: Date;
}

function toEntity(d: RoleDoc): ChurchRole {
  return {
    id: d._id,
    churchId: d.churchId,
    userId: d.userId,
    roleType: d.roleType,
    createdAt: d.createdAt,
  };
}

export class MongoRoleRepository implements RoleRepository {
  private async col(): Promise<Collection<RoleDoc>> {
    const db = await getDb();
    return db.collection<RoleDoc>('church_roles');
  }

  async findByUserAndChurch(userId: string, churchId: string): Promise<ChurchRole | null> {
    const doc = await (await this.col()).findOne({ userId, churchId });
    return doc ? toEntity(doc) : null;
  }

  async listByChurch(churchId: string): Promise<ChurchRole[]> {
    const docs = await (await this.col()).find({ churchId }).toArray();
    return docs.map(toEntity);
  }

  async listChurchIdsByUser(userId: string): Promise<string[]> {
    const docs = await (await this.col()).find({ userId }).toArray();
    return docs.map((d) => d.churchId);
  }

  async upsert(
    role: Omit<ChurchRole, 'id' | 'createdAt'> & { id?: string },
  ): Promise<ChurchRole> {
    const col = await this.col();
    const id = role.id ?? `${role.churchId}:${role.userId}`;
    const now = new Date();
    await col.updateOne(
      { _id: id },
      {
        $set: {
          churchId: role.churchId,
          userId: role.userId,
          roleType: role.roleType,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );
    const doc = await col.findOne({ _id: id });
    return toEntity(doc!);
  }

  async remove(churchId: string, userId: string): Promise<void> {
    await (await this.col()).deleteOne({ churchId, userId });
  }
}
