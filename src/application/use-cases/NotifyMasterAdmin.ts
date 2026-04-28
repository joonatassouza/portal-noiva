import { NotificationRepository } from '@/application/ports/NotificationRepository';
import { NotificationType } from '@/domain/entities/Notification';
import { randomUUID } from '@/shared/uuid';

/**
 * Sends a notification to every configured master admin user.
 *
 * The master admin user IDs are resolved by mapping configured emails to
 * users that have logged in at least once (Auth.js stores them under the
 * `users` collection — we use it through a thin reader function passed in).
 */
export class NotifyMasterAdmin {
  constructor(
    private readonly notifications: NotificationRepository,
    /** Returns the list of user-ids whose email is in `MASTER_ADMIN_EMAILS`. */
    private readonly resolveMasterAdminIds: () => Promise<string[]>,
  ) {}

  async execute(args: {
    type: NotificationType;
    title: string;
    body?: string;
    href?: string;
    payload?: Record<string, unknown>;
  }): Promise<void> {
    const ids = await this.resolveMasterAdminIds();
    if (ids.length === 0) return;

    const now = new Date();
    await Promise.all(
      ids.map((userId) =>
        this.notifications.save({
          id: randomUUID(),
          recipientUserId: userId,
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
