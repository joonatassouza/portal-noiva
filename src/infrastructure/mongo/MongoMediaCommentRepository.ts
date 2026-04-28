import { Collection } from 'mongodb';

import { MediaComment } from '@/domain/entities/MediaComment';
import { MediaCommentRepository } from '@/application/ports/MediaCommentRepository';
import { getDb } from '@/infrastructure/mongo/client';

interface MediaCommentDoc {
  _id: string;
  mediaPostId: string;
  authorUserId: string;
  authorName?: string;
  body: string;
  createdAt: Date;
}

function toEntity(d: MediaCommentDoc): MediaComment {
  return {
    id: d._id,
    mediaPostId: d.mediaPostId,
    authorUserId: d.authorUserId,
    authorName: d.authorName,
    body: d.body,
    createdAt: d.createdAt,
  };
}

export class MongoMediaCommentRepository implements MediaCommentRepository {
  private async col(): Promise<Collection<MediaCommentDoc>> {
    const db = await getDb();
    return db.collection<MediaCommentDoc>('media_comments');
  }

  async findById(id: string): Promise<MediaComment | null> {
    const doc = await (await this.col()).findOne({ _id: id });
    return doc ? toEntity(doc) : null;
  }

  async listByPost(postId: string): Promise<MediaComment[]> {
    const docs = await (await this.col())
      .find({ mediaPostId: postId })
      .sort({ createdAt: 1 })
      .toArray();
    return docs.map(toEntity);
  }

  async countByPost(postId: string): Promise<number> {
    return (await this.col()).countDocuments({ mediaPostId: postId });
  }

  async save(c: MediaComment): Promise<void> {
    await (await this.col()).updateOne(
      { _id: c.id },
      {
        $set: {
          mediaPostId: c.mediaPostId,
          authorUserId: c.authorUserId,
          authorName: c.authorName,
          body: c.body,
        },
        $setOnInsert: { createdAt: c.createdAt },
      },
      { upsert: true },
    );
  }

  async deleteById(id: string): Promise<void> {
    await (await this.col()).deleteOne({ _id: id });
  }
}
