'use client';

import { useTranslations } from 'next-intl';

import type { UpcomingServiceItem } from '@/application/use-cases/ListUpcomingServices';
import type { UpcomingEventItem } from '@/application/use-cases/ListUpcomingEvents';
import type { MediaFeedItem } from '@/application/use-cases/ListGlobalMediaFeed';
import { Tabs, type TabDef } from '@/presentation/components/ui/Tabs';
import { UpcomingServicesFeed } from './UpcomingServicesFeed';
import { UpcomingEventsFeed } from './UpcomingEventsFeed';
import { MediaGlobalFeed } from './MediaGlobalFeed';

interface UpcomingTabsProps {
  locale: string;
  isAuthenticated: boolean;
  initialServices: { items: UpcomingServiceItem[]; nextCursor: string | null };
  initialEvents: { items: UpcomingEventItem[]; nextCursor: string | null };
  initialMediaFeed: { items: MediaFeedItem[]; nextCursor: string | null };
}

export function UpcomingTabs({
  locale,
  isAuthenticated,
  initialServices,
  initialEvents,
  initialMediaFeed,
}: UpcomingTabsProps) {
  const t = useTranslations('upcoming');
  const tabs: TabDef[] = [
    { id: 'services', label: t('servicesTab'), count: initialServices.items.length },
    { id: 'events', label: t('eventsTab'), count: initialEvents.items.length },
    { id: 'feed', label: t('feedTab'), count: initialMediaFeed.items.length },
  ];

  return (
    <Tabs tabs={tabs} initialTabId="services">
      {(active) => {
        if (active === 'services') {
          return <UpcomingServicesFeed locale={locale} initial={initialServices} />;
        }
        if (active === 'events') {
          return <UpcomingEventsFeed locale={locale} initial={initialEvents} />;
        }
        return (
          <MediaGlobalFeed
            locale={locale}
            isAuthenticated={isAuthenticated}
            initial={initialMediaFeed}
          />
        );
      }}
    </Tabs>
  );
}
