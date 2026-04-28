import { ChurchRepository } from '@/application/ports/ChurchRepository';
import { MediaPostRepository } from '@/application/ports/MediaPostRepository';
import { NotifyMasterAdmin } from '@/application/use-cases/NotifyMasterAdmin';
import { NotFoundError, UnauthorizedError, ValidationError } from '@/domain/errors/DomainError';
import { Principal } from '@/domain/policies/access';

const MAX_REASON = 500;

export class ReportMediaPost {
  constructor(
    private readonly posts: MediaPostRepository,
    private readonly churches: ChurchRepository,
    private readonly notifyMasterAdmin: NotifyMasterAdmin,
  ) {}

  async execute(
    principal: Principal | null,
    args: { postId: string; reason?: string },
  ): Promise<void> {
    if (!principal) throw new UnauthorizedError('Login required.');

    const trimmedReason = args.reason?.trim();
    if (trimmedReason && trimmedReason.length > MAX_REASON) {
      throw new ValidationError(`Reason exceeds ${MAX_REASON} characters.`);
    }

    const post = await this.posts.findById(args.postId);
    if (!post) throw new NotFoundError('MediaPost', args.postId);

    const church = await this.churches.findById(post.churchId);
    const churchName = church?.name ?? 'Igreja desconhecida';

    await this.notifyMasterAdmin.execute({
      type: 'MEDIA_POST_REPORT',
      title: `Denúncia em post de ${churchName}`,
      body: trimmedReason
        ? `${principal.email}: ${trimmedReason.slice(0, 160)}`
        : `${principal.email}`,
      href: church ? `/igreja/${church.slug}/post/${post.id}` : undefined,
      payload: {
        postId: post.id,
        churchId: post.churchId,
        churchSlug: church?.slug,
        reporterUserId: principal.userId,
        reporterEmail: principal.email,
        reason: trimmedReason,
      },
    });
  }
}
