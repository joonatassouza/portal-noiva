import { NotificationRepository } from '@/application/ports/NotificationRepository';
import { Notification } from '@/domain/entities/Notification';
import { UnauthorizedError } from '@/domain/errors/DomainError';
import { Principal } from '@/domain/policies/access';

export interface NotificationFeed {
  items: Notification[];
  unreadCount: number;
}

export class ListNotifications {
  constructor(private readonly notifications: NotificationRepository) {}

  async execute(principal: Principal | null, limit = 30): Promise<NotificationFeed> {
    if (!principal) throw new UnauthorizedError('Login required.');
    const [items, unreadCount] = await Promise.all([
      this.notifications.listByUser(principal.userId, limit),
      this.notifications.countUnreadByUser(principal.userId),
    ]);
    return { items, unreadCount };
  }
}

export class MarkNotificationsRead {
  constructor(private readonly notifications: NotificationRepository) {}

  async execute(
    principal: Principal | null,
    args: { ids?: string[]; all?: boolean },
  ): Promise<void> {
    if (!principal) throw new UnauthorizedError('Login required.');
    if (args.all) {
      await this.notifications.markAllRead(principal.userId);
    } else if (args.ids && args.ids.length > 0) {
      await this.notifications.markRead(principal.userId, args.ids);
    }
  }
}
