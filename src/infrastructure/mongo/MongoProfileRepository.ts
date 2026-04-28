import { Collection } from 'mongodb';

import { Locale, Profile } from '@/domain/entities/Profile';
import { ProfileRepository } from '@/application/ports/ProfileRepository';
import { getDb } from '@/infrastructure/mongo/client';

interface ProfileDoc {
  _id: string; // userId
  displayName?: string;
  whatsappNumber?: string;
  locale?: Locale;
  createdAt: Date;
  updatedAt: Date;
}

function toEntity(d: ProfileDoc): Profile {
  return {
    userId: d._id,
    displayName: d.displayName,
    whatsappNumber: d.whatsappNumber,
    locale: d.locale,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

export class MongoProfileRepository implements ProfileRepository {
  private async col(): Promise<Collection<ProfileDoc>> {
    const db = await getDb();
    return db.collection<ProfileDoc>('profiles');
  }

  async findByUserId(userId: string): Promise<Profile | null> {
    const doc = await (await this.col()).findOne({ _id: userId });
    return doc ? toEntity(doc) : null;
  }

  async findManyByUserIds(userIds: string[]): Promise<Profile[]> {
    if (userIds.length === 0) return [];
    const docs = await (await this.col())
      .find({ _id: { $in: userIds } })
      .toArray();
    return docs.map(toEntity);
  }

  async save(profile: Profile): Promise<void> {
    await (await this.col()).updateOne(
      { _id: profile.userId },
      {
        $set: {
          displayName: profile.displayName,
          whatsappNumber: profile.whatsappNumber,
          locale: profile.locale,
          updatedAt: profile.updatedAt,
        },
        $setOnInsert: { createdAt: profile.createdAt },
      },
      { upsert: true },
    );
  }
}
