import { Collection } from 'mongodb';

import { MediaImage, MediaPost, MediaPostType } from '@/domain/entities/MediaPost';
import { MediaPostRepository } from '@/application/ports/MediaPostRepository';
import { UpcomingPage } from '@/application/ports/EventRepository';
import { getDb } from '@/infrastructure/mongo/client';

function encodeCursor(ms: number, id: string): string {
  return Buffer.from(`${ms}_${id}`, 'utf8').toString('base64url');
}
function decodeCursor(raw: string): { ms: number; id: string } | null {
  try {
    const s = Buffer.from(raw, 'base64url').toString('utf8');
    const [ms, id] = s.split('_');
    if (!ms || !id) return null;
    return { ms: Number(ms), id };
  } catch {
    return null;
  }
}

interface MediaPostDoc {
  _id: string;
  eventId?: string;
  churchId: string;
  authorUserId: string;
  type: MediaPostType;
  externalUrl?: string;
  images: MediaImage[];
  caption?: string;
  createdAt: Date;
}

function toEntity(d: MediaPostDoc): MediaPost {
  return {
    id: d._id,
    eventId: d.eventId,
    churchId: d.churchId,
    authorUserId: d.authorUserId,
    type: d.type,
    externalUrl: d.externalUrl,
    images: d.images ?? [],
    caption: d.caption,
    createdAt: d.createdAt,
  };
}

export class MongoMediaPostRepository implements MediaPostRepository {
  private async col(): Promise<Collection<MediaPostDoc>> {
    const db = await getDb();
    return db.collection<MediaPostDoc>('media_posts');
  }

  async findById(id: string): Promise<MediaPost | null> {
    const doc = await (await this.col()).findOne({ _id: id });
    return doc ? toEntity(doc) : null;
  }

  async listByChurch(churchId: string, limit = 50): Promise<MediaPost[]> {
    const docs = await (await this.col())
      .find({ churchId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    return docs.map(toEntity);
  }

  async listByEvent(eventId: string): Promise<MediaPost[]> {
    const docs = await (await this.col())
      .find({ eventId })
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map(toEntity);
  }

  async listGlobal(opts: { cursor?: string; limit?: number } = {}): Promise<UpcomingPage<MediaPost>> {
    const limit = opts.limit ?? 10;
    const filter: Record<string, unknown> = {};
    if (opts.cursor) {
      const c = decodeCursor(opts.cursor);
      if (c) {
        const cursorDate = new Date(c.ms);
        // Latest-first ordering: next page = posts with createdAt < cursorDate,
        // OR same instant but lexicographically smaller id.
        filter.$or = [
          { createdAt: { $lt: cursorDate } },
          { createdAt: cursorDate, _id: { $lt: c.id } },
        ];
      }
    }
    const docs = await (await this.col())
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .toArray();

    const hasMore = docs.length > limit;
    const page = docs.slice(0, limit);
    const items = page.map(toEntity);
    let nextCursor: string | null = null;
    if (hasMore && page.length > 0) {
      const last = page[page.length - 1]!;
      nextCursor = encodeCursor(last.createdAt.getTime(), last._id);
    }
    return { items, nextCursor };
  }

  async save(post: MediaPost): Promise<void> {
    await (await this.col()).updateOne(
      { _id: post.id },
      {
        $set: {
          eventId: post.eventId,
          churchId: post.churchId,
          authorUserId: post.authorUserId,
          type: post.type,
          externalUrl: post.externalUrl,
          images: post.images,
          caption: post.caption,
        },
        $setOnInsert: { createdAt: post.createdAt },
      },
      { upsert: true },
    );
  }

  async deleteById(id: string): Promise<void> {
    await (await this.col()).deleteOne({ _id: id });
  }
}
