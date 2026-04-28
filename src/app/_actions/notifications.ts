'use server';

import { container } from '@/infrastructure/di/container';
import { getPrincipal } from '@/presentation/lib/principal';
import type { NotificationFeed } from '@/application/use-cases/ListNotifications';

export async function fetchNotificationsAction(): Promise<NotificationFeed> {
  const principal = await getPrincipal();
  if (!principal) return { items: [], unreadCount: 0 };
  return container.listNotifications().execute(principal, 30);
}

export async function markNotificationsReadAction(args: { ids?: string[]; all?: boolean }) {
  const principal = await getPrincipal();
  if (!principal) return;
  await container.markNotificationsRead().execute(principal, args);
}
