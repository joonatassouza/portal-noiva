import { ChurchRepository } from '@/application/ports/ChurchRepository';
import { MediaCommentRepository } from '@/application/ports/MediaCommentRepository';
import { MediaPostRepository } from '@/application/ports/MediaPostRepository';
import { NotificationRepository } from '@/application/ports/NotificationRepository';
import {
  MEDIA_COMMENT_MAX_LENGTH,
  MediaComment,
} from '@/domain/entities/MediaComment';
import { Notification } from '@/domain/entities/Notification';
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@/domain/errors/DomainError';
import { Principal } from '@/domain/policies/access';
import { randomUUID } from '@/shared/uuid';

export class AddMediaComment {
  constructor(
    private readonly comments: MediaCommentRepository,
    private readonly posts: MediaPostRepository,
    private readonly notifications: NotificationRepository,
    private readonly churches: ChurchRepository,
  ) {}

  async execute(
    principal: Principal | null,
    args: { postId: string; body: string; authorName?: string },
  ): Promise<MediaComment> {
    if (!principal) throw new UnauthorizedError('Login required.');

    const trimmed = args.body.trim();
    if (trimmed.length === 0) throw new ValidationError('Empty comment.');
    if (trimmed.length > MEDIA_COMMENT_MAX_LENGTH) {
      throw new ValidationError(`Comment exceeds ${MEDIA_COMMENT_MAX_LENGTH} characters.`);
    }

    const post = await this.posts.findById(args.postId);
    if (!post) throw new NotFoundError('MediaPost', args.postId);

    const comment: MediaComment = {
      id: randomUUID(),
      mediaPostId: post.id,
      authorUserId: principal.userId,
      authorName: args.authorName?.trim() || undefined,
      body: trimmed,
      createdAt: new Date(),
    };
    await this.comments.save(comment);

    // Notify the author of the post (skip if commenting on your own post).
    if (post.authorUserId !== principal.userId) {
      const church = await this.churches.findById(post.churchId);
      const n: Notification = {
        id: randomUUID(),
        recipientUserId: post.authorUserId,
        type: 'MEDIA_COMMENT_NEW',
        title: 'Novo comentário em sua postagem',
        body: trimmed.slice(0, 120),
        href: church ? `/igreja/${church.slug}/post/${post.id}` : undefined,
        payload: { postId: post.id, commentId: comment.id, churchId: post.churchId },
        createdAt: new Date(),
      };
      await this.notifications.save(n);
    }

    return comment;
  }
}
