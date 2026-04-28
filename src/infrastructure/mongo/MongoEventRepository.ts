import { Collection, Filter } from 'mongodb';
import { Event } from '@/domain/entities/Event';
import {
  EventRepository,
  ListUpcomingOpts,
  UpcomingPage,
} from '@/application/ports/EventRepository';
import { getDb } from '@/infrastructure/mongo/client';
import { EventDoc, fromEventDoc, toEventDoc } from '@/infrastructure/mongo/mappers';

/**
 * Cursor format: `${startMs}_${id}`.
 * (startDatetime in ms, then id as tiebreaker — ensures stable order when many
 *  events start at the same instant.)
 */
function encodeCursor(startMs: number, id: string): string {
  return Buffer.from(`${startMs}_${id}`, 'utf8').toString('base64url');
}
function decodeCursor(cursor: string): { startMs: number; id: string } | null {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const [ms, id] = raw.split('_');
    if (!ms || !id) return null;
    return { startMs: Number(ms), id };
  } catch {
    return null;
  }
}

export class MongoEventRepository implements EventRepository {
  private async col(): Promise<Collection<EventDoc>> {
    const db = await getDb();
    return db.collection<EventDoc>('events');
  }

  async findById(id: string): Promise<Event | null> {
    const doc = await (await this.col()).findOne({ _id: id });
    return doc ? fromEventDoc(doc) : null;
  }

  async listByChurch(churchId: string): Promise<Event[]> {
    const docs = await (await this.col())
      .find({ churchId })
      .sort({ startDatetime: 1 })
      .toArray();
    return docs.map(fromEventDoc);
  }

  async listUpcoming(opts: ListUpcomingOpts = {}): Promise<UpcomingPage<Event>> {
    const limit = opts.limit ?? 10;
    const from = opts.from ?? new Date();

    const filter: Filter<EventDoc> = {
      startDatetime: { $gte: from },
    };
    if (opts.churchId) filter.churchId = opts.churchId;

    if (opts.cursor) {
      const c = decodeCursor(opts.cursor);
      if (c) {
        const cursorDate = new Date(c.startMs);
        // (startDatetime > cursorDate) OR (startDatetime == cursorDate AND _id > id)
        filter.$or = [
          { startDatetime: { $gt: cursorDate } },
          { startDatetime: cursorDate, _id: { $gt: c.id } },
        ];
        delete filter.startDatetime; // replaced by $or
      }
    }

    const docs = await (await this.col())
      .find(filter)
      .sort({ startDatetime: 1, _id: 1 })
      .limit(limit + 1)
      .toArray();

    const hasMore = docs.length > limit;
    const page = docs.slice(0, limit);
    const items = page.map(fromEventDoc);

    let nextCursor: string | null = null;
    if (hasMore && page.length > 0) {
      const last = page[page.length - 1]!;
      nextCursor = encodeCursor(last.startDatetime.getTime(), last._id);
    }

    return { items, nextCursor };
  }

  async save(event: Event): Promise<void> {
    const doc = toEventDoc(event);
    await (await this.col()).updateOne(
      { _id: event.id },
      { $set: doc },
      { upsert: true },
    );
  }

  async deleteById(id: string): Promise<void> {
    await (await this.col()).deleteOne({ _id: id });
  }
}
