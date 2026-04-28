import { NotificationRepository } from '@/application/ports/NotificationRepository';
import { RoleRepository } from '@/application/ports/RoleRepository';
import { NotificationType } from '@/domain/entities/Notification';
import { randomUUID } from '@/shared/uuid';

/**
 * Fans out a notification to every OWNER and EDITOR_ADMIN of a given church.
 * MEDIA_EDITOR is excluded — they only manage media posts.
 */
export class NotifyChurchAdmins {
  constructor(
    private readonly notifications: NotificationRepository,
    private readonly roles: RoleRepository,
  ) {}

  async execute(args: {
    churchId: string;
    type: NotificationType;
    title: string;
    body?: string;
    href?: string;
    payload?: Record<string, unknown>;
  }): Promise<void> {
    const all = await this.roles.listByChurch(args.churchId);
    const targets = all.filter((r) => r.roleType === 'OWNER' || r.roleType === 'EDITOR_ADMIN');
    if (targets.length === 0) return;

    const now = new Date();
    await Promise.all(
      targets.map((r) =>
        this.notifications.save({
          id: randomUUID(),
          recipientUserId: r.userId,
          type: args.type,
          title: args.title,
          body: args.body,
          href: args.href,
          payload: args.payload,
          createdAt: now,
        }),
      ),
    );
  }
}
