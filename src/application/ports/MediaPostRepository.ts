import { MediaPost } from '@/domain/entities/MediaPost';
import { UpcomingPage } from '@/application/ports/EventRepository';

export interface MediaPostRepository {
  findById(id: string): Promise<MediaPost | null>;
  /** Latest first; used by the church-page feed. */
  listByChurch(churchId: string, limit?: number): Promise<MediaPost[]>;
  listByEvent(eventId: string): Promise<MediaPost[]>;
  /**
   * Cursor-paginated global feed of every post, latest first.
   * Cursor format is opaque to callers.
   */
  listGlobal(opts?: { cursor?: string; limit?: number }): Promise<UpcomingPage<MediaPost>>;
  save(post: MediaPost): Promise<void>;
  deleteById(id: string): Promise<void>;
}
