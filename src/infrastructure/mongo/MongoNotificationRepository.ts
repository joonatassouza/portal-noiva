import { Collection } from 'mongodb';

import { Notification, NotificationType } from '@/domain/entities/Notification';
import { NotificationRepository } from '@/application/ports/NotificationRepository';
import { getDb } from '@/infrastructure/mongo/client';

interface NotificationDoc {
  _id: string;
  recipientUserId: string;
  type: NotificationType;
  title: string;
  body?: string;
  href?: string;
  payload?: Record<string, unknown>;
  readAt?: Date;
  createdAt: Date;
}

function toEntity(d: NotificationDoc): Notification {
  return {
    id: d._id,
    recipientUserId: d.recipientUserId,
    type: d.type,
    title: d.title,
    body: d.body,
    href: d.href,
    payload: d.payload,
    readAt: d.readAt,
    createdAt: d.createdAt,
  };
}

export class MongoNotificationRepository implements NotificationRepository {
  private async col(): Promise<Collection<NotificationDoc>> {
    const db = await getDb();
    return db.collection<NotificationDoc>('notifications');
  }

  async listByUser(userId: string, limit = 30): Promise<Notification[]> {
    const docs = await (await this.col())
      .find({ recipientUserId: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    return docs.map(toEntity);
  }

  async countUnreadByUser(userId: string): Promise<number> {
    return (await this.col()).countDocuments({ recipientUserId: userId, readAt: { $exists: false } });
  }

  async save(n: Notification): Promise<void> {
    await (await this.col()).updateOne(
      { _id: n.id },
      {
        $set: {
          recipientUserId: n.recipientUserId,
          type: n.type,
          title: n.title,
          body: n.body,
          href: n.href,
          payload: n.payload,
          readAt: n.readAt,
        },
        $setOnInsert: { createdAt: n.createdAt },
      },
      { upsert: true },
    );
  }

  async markRead(userId: string, ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await (await this.col()).updateMany(
      { recipientUserId: userId, _id: { $in: ids } },
      { $set: { readAt: new Date() } },
    );
  }

  async markAllRead(userId: string): Promise<void> {
    await (await this.col()).updateMany(
      { recipientUserId: userId, readAt: { $exists: false } },
      { $set: { readAt: new Date() } },
    );
  }
}
