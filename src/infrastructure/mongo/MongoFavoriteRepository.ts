import { Collection } from 'mongodb';
import { Favorite } from '@/domain/entities/Favorite';
import { FavoriteRepository } from '@/application/ports/FavoriteRepository';
import { getDb } from '@/infrastructure/mongo/client';

interface FavoriteDoc {
  userId: string;
  churchId: string;
  createdAt: Date;
}

export class MongoFavoriteRepository implements FavoriteRepository {
  private async col(): Promise<Collection<FavoriteDoc>> {
    const db = await getDb();
    return db.collection<FavoriteDoc>('favorites');
  }

  async add(userId: string, churchId: string): Promise<Favorite> {
    const now = new Date();
    const col = await this.col();
    await col.updateOne(
      { userId, churchId },
      { $setOnInsert: { userId, churchId, createdAt: now } },
      { upsert: true },
    );
    const doc = await col.findOne({ userId, churchId });
    return { userId, churchId, createdAt: doc?.createdAt ?? now };
  }

  async remove(userId: string, churchId: string): Promise<void> {
    await (await this.col()).deleteOne({ userId, churchId });
  }

  async isFavorited(userId: string, churchId: string): Promise<boolean> {
    const doc = await (await this.col()).findOne({ userId, churchId });
    return Boolean(doc);
  }

  async listChurchIdsByUser(userId: string): Promise<string[]> {
    const docs = await (await this.col())
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map((d) => d.churchId);
  }
}
