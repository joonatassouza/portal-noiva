import { MediaCommentRepository } from '@/application/ports/MediaCommentRepository';
import { MediaPostRepository } from '@/application/ports/MediaPostRepository';
import { RoleRepository } from '@/application/ports/RoleRepository';
import { NotFoundError, UnauthorizedError } from '@/domain/errors/DomainError';
import { hasAtLeast, Principal } from '@/domain/policies/access';

/**
 * Allowed deleters of a media comment:
 *   - the comment's author
 *   - the post's author (moderates the threads on their own posts)
 *   - any OWNER or EDITOR_ADMIN of the church that owns the post
 *   - master admin
 *
 * Comment-only roles (MEDIA_EDITOR for OTHER posts, regular logged-in users)
 * cannot delete other people's comments.
 */
export class DeleteMediaComment {
  constructor(
    private readonly comments: MediaCommentRepository,
    private readonly posts: MediaPostRepository,
    private readonly roles: RoleRepository,
  ) {}

  async execute(principal: Principal | null, commentId: string): Promise<void> {
    if (!principal) throw new UnauthorizedError('Login required.');
    const c = await this.comments.findById(commentId);
    if (!c) throw new NotFoundError('MediaComment', commentId);

    if (principal.isMasterAdmin) {
      await this.comments.deleteById(c.id);
      return;
    }
    if (c.authorUserId === principal.userId) {
      await this.comments.deleteById(c.id);
      return;
    }

    const post = await this.posts.findById(c.mediaPostId);
    if (!post) throw new NotFoundError('MediaPost', c.mediaPostId);

    if (post.authorUserId === principal.userId) {
      await this.comments.deleteById(c.id);
      return;
    }

    const role = await this.roles.findByUserAndChurch(principal.userId, post.churchId);
    if (!hasAtLeast(role?.roleType, 'EDITOR_ADMIN')) {
      throw new UnauthorizedError(
        'Only the comment author, the post author, or a church editor can delete this comment.',
      );
    }
    await this.comments.deleteById(c.id);
  }
}
