import { ChurchRepository } from '@/application/ports/ChurchRepository';
import { EventRepository } from '@/application/ports/EventRepository';
import { MediaPostRepository } from '@/application/ports/MediaPostRepository';
import { RoleRepository } from '@/application/ports/RoleRepository';
import { MediaImage, MediaPost, MediaPostType } from '@/domain/entities/MediaPost';
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@/domain/errors/DomainError';
import { assertChurchAccess, Principal } from '@/domain/policies/access';
import { randomUUID } from '@/shared/uuid';

export interface CreateMediaPostInput {
  churchId: string;
  /** Optional — if provided must belong to the same church. */
  eventId?: string;
  type: MediaPostType;
  externalUrl?: string;
  images?: MediaImage[];
  caption?: string;
}

const MAX_IMAGES_PER_POST = 20;

export class CreateMediaPost {
  constructor(
    private readonly posts: MediaPostRepository,
    private readonly events: EventRepository,
    private readonly churches: ChurchRepository,
    private readonly roles: RoleRepository,
  ) {}

  async execute(principal: Principal | null, input: CreateMediaPostInput): Promise<MediaPost> {
    if (!principal) throw new UnauthorizedError('Login required.');

    const church = await this.churches.findById(input.churchId);
    if (!church) throw new NotFoundError('Church', input.churchId);

    const role = await this.roles.findByUserAndChurch(principal.userId, church.id);
    assertChurchAccess(principal, role, 'MEDIA_EDITOR');

    if (input.eventId) {
      const event = await this.events.findById(input.eventId);
      if (!event) throw new NotFoundError('Event', input.eventId);
      if (event.churchId !== church.id) {
        throw new ValidationError('Event does not belong to this church.');
      }
    }

    if (input.type === 'ALBUM_LINK') {
      if (!input.externalUrl?.trim()) {
        throw new ValidationError('External URL is required for an album link post.');
      }
      try {
        new URL(input.externalUrl);
      } catch {
        throw new ValidationError('External URL is invalid.');
      }
    } else {
      const images = input.images ?? [];
      if (images.length === 0) throw new ValidationError('At least one image is required.');
      if (images.length > MAX_IMAGES_PER_POST) {
        throw new ValidationError(`At most ${MAX_IMAGES_PER_POST} images per post.`);
      }
      for (const img of images) {
        if (!img.url) throw new ValidationError('Image URL is required.');
      }
    }

    const post: MediaPost = {
      id: randomUUID(),
      eventId: input.eventId,
      churchId: church.id,
      authorUserId: principal.userId,
      type: input.type,
      externalUrl:
        input.type === 'ALBUM_LINK' ? input.externalUrl?.trim() : undefined,
      images: input.type === 'IMAGE_GALLERY' ? input.images ?? [] : [],
      caption: input.caption?.trim() || undefined,
      createdAt: new Date(),
    };
    await this.posts.save(post);
    return post;
  }
}
