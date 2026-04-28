import { MediaPostRepository } from '@/application/ports/MediaPostRepository';
import { MediaCommentRepository } from '@/application/ports/MediaCommentRepository';
import { MediaStorage } from '@/application/ports/MediaStorage';
import { RoleRepository } from '@/application/ports/RoleRepository';
import { NotFoundError, UnauthorizedError } from '@/domain/errors/DomainError';
import { hasAtLeast, Principal } from '@/domain/policies/access';

/**
 * Allowed deleters: master admin, the OWNER/EDITOR_ADMIN of the church,
 * or the post author themselves.
 *
 * Deletion cascades comments and best-effort wipes the S3 objects.
 */
export class DeleteMediaPost {
  constructor(
    private readonly posts: MediaPostRepository,
    private readonly comments: MediaCommentRepository,
    private readonly roles: RoleRepository,
    private readonly storage: MediaStorage,
  ) {}

  async execute(principal: Principal | null, postId: string): Promise<void> {
    if (!principal) throw new UnauthorizedError('Login required.');
    const post = await this.posts.findById(postId);
    if (!post) throw new NotFoundError('MediaPost', postId);

    if (!principal.isMasterAdmin && post.authorUserId !== principal.userId) {
      const role = await this.roles.findByUserAndChurch(principal.userId, post.churchId);
      if (!hasAtLeast(role?.roleType, 'EDITOR_ADMIN')) {
        throw new UnauthorizedError('Only the author or a church editor can delete this post.');
      }
    }

    // Cascade delete comments.
    const comments = await this.comments.listByPost(post.id);
    await Promise.all(comments.map((c) => this.comments.deleteById(c.id)));

    // Best-effort image cleanup.
    await Promise.all(post.images.map((img) => this.storage.delete(img.url).catch(() => undefined)));

    await this.posts.deleteById(post.id);
  }
}
