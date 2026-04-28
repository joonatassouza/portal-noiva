import { Notification } from '@/domain/entities/Notification';

export interface NotificationRepository {
  /** Latest first. */
  listByUser(userId: string, limit?: number): Promise<Notification[]>;
  countUnreadByUser(userId: string): Promise<number>;
  save(notification: Notification): Promise<void>;
  markRead(userId: string, ids: string[]): Promise<void>;
  markAllRead(userId: string): Promise<void>;
}
