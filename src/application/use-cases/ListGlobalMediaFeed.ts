import { ChurchRepository } from '@/application/ports/ChurchRepository';
import { EventRepository, UpcomingPage } from '@/application/ports/EventRepository';
import { MediaCommentRepository } from '@/application/ports/MediaCommentRepository';
import { MediaPostRepository } from '@/application/ports/MediaPostRepository';
import { Church } from '@/domain/entities/Church';
import { Event } from '@/domain/entities/Event';
import { MediaPost } from '@/domain/entities/MediaPost';

export interface MediaFeedItem {
  post: MediaPost;
  church: Pick<Church, 'id' | 'slug' | 'name' | 'city' | 'country'>;
  event?: Pick<Event, 'id' | 'title' | 'slug'>;
  /** Pre-counted to avoid an extra request per card. */
  commentCount: number;
}

/**
 * Cursor-paginated chronological feed of media posts across all churches.
 * Denormalizes the church + (optional) event so each card renders without
 * extra round trips.
 */
export class ListGlobalMediaFeed {
  constructor(
    private readonly posts: MediaPostRepository,
    private readonly churches: ChurchRepository,
    private readonly events: EventRepository,
    private readonly comments: MediaCommentRepository,
  ) {}

  async execute(opts: { cursor?: string; limit?: number } = {}): Promise<UpcomingPage<MediaFeedItem>> {
    const page = await this.posts.listGlobal({
      cursor: opts.cursor,
      limit: opts.limit ?? 10,
    });
    if (page.items.length === 0) return { items: [], nextCursor: page.nextCursor };

    const churchIds = Array.from(new Set(page.items.map((p) => p.churchId)));
    const eventIds = Array.from(
      new Set(page.items.map((p) => p.eventId).filter((id): id is string => Boolean(id))),
    );

    const [churches, events, counts] = await Promise.all([
      Promise.all(churchIds.map((id) => this.churches.findById(id))),
      Promise.all(eventIds.map((id) => this.events.findById(id))),
      Promise.all(page.items.map((p) => this.comments.countByPost(p.id))),
    ]);
    const churchById = new Map(
      churches.filter((c): c is Church => Boolean(c)).map((c) => [c.id, c]),
    );
    const eventById = new Map(
      events.filter((e): e is Event => Boolean(e)).map((e) => [e.id, e]),
    );

    const items: MediaFeedItem[] = [];
    page.items.forEach((post, idx) => {
      const c = churchById.get(post.churchId);
      if (!c) return; // orphan — skip silently
      const e = post.eventId ? eventById.get(post.eventId) : undefined;
      items.push({
        post,
        church: { id: c.id, slug: c.slug, name: c.name, city: c.city, country: c.country },
        event: e ? { id: e.id, title: e.title, slug: e.slug } : undefined,
        commentCount: counts[idx] ?? 0,
      });
    });

    return { items, nextCursor: page.nextCursor };
  }
}
