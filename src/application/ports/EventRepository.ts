import { Event } from '@/domain/entities/Event';

export interface UpcomingPage<T> {
  items: T[];
  /** Opaque cursor — pass back to fetch the next page; null when finished. */
  nextCursor: string | null;
}

export interface ListUpcomingOpts {
  /** ISO datetime — only events that start on/after this time. Defaults to now. */
  from?: Date;
  /** Cursor produced by a previous call. */
  cursor?: string;
  /** Page size; defaults to 10. */
  limit?: number;
  /** Optional church scope (used by the church page event feed). */
  churchId?: string;
}

export interface EventRepository {
  findById(id: string): Promise<Event | null>;
  /** Chronological — earliest upcoming first. */
  listUpcoming(opts?: ListUpcomingOpts): Promise<UpcomingPage<Event>>;
  listByChurch(churchId: string): Promise<Event[]>;
  save(event: Event): Promise<void>;
  deleteById(id: string): Promise<void>;
}
