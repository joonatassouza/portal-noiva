'use server';

import { container } from '@/infrastructure/di/container';
import type { UpcomingPage } from '@/application/ports/EventRepository';
import type { UpcomingServiceItem } from '@/application/use-cases/ListUpcomingServices';
import type { UpcomingEventItem } from '@/application/use-cases/ListUpcomingEvents';

const PAGE_SIZE = 10;

export async function fetchUpcomingServices(
  cursor?: string,
): Promise<UpcomingPage<UpcomingServiceItem>> {
  return container.listUpcomingServices().execute({ cursor, limit: PAGE_SIZE });
}

export async function fetchUpcomingEvents(
  cursor?: string,
): Promise<UpcomingPage<UpcomingEventItem>> {
  return container.listUpcomingEvents().execute({ cursor, limit: PAGE_SIZE });
}
