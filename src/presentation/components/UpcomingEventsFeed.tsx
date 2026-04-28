'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { UpcomingEventItem } from '@/application/use-cases/ListUpcomingEvents';
import { Badge } from '@/presentation/components/ui/Badge';
import { Card } from '@/presentation/components/ui/Card';
import { EmptyState } from '@/presentation/components/ui/EmptyState';
import { fetchUpcomingEvents } from '@/app/_actions/upcoming';
import { groupByDay, formatDayHeading, formatTimeOnly } from '@/shared/dayGroups';
import { WatchLiveLink } from '@/presentation/components/WatchLiveLink';

interface UpcomingEventsFeedProps {
  locale: string;
  initial: { items: UpcomingEventItem[]; nextCursor: string | null };
}

export function UpcomingEventsFeed({ locale, initial }: UpcomingEventsFeedProps) {
  const t = useTranslations();
  const [items, setItems] = useState(initial.items);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !cursor) return;
    setLoading(true);
    setError(null);
    try {
      const page = await fetchUpcomingEvents(cursor);
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [cursor, loading]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !cursor) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '300px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [cursor, loadMore]);

  const dayLabels = useMemo(
    () => ({ today: t('upcoming.day.today'), tomorrow: t('upcoming.day.tomorrow') }),
    [t],
  );
  const groups = useMemo(
    () => groupByDay(items, ({ event }) => new Date(event.startDatetime)),
    [items],
  );

  if (items.length === 0) {
    return <EmptyState title={t('upcoming.eventsEmpty.title')} description={t('upcoming.eventsEmpty.description')} />;
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.dayKey} aria-labelledby={`day-event-${group.dayKey}`}>
          <h3
            id={`day-event-${group.dayKey}`}
            className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-gold"
          >
            {formatDayHeading(group.date, locale, dayLabels)}
          </h3>
          <ul className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {group.items.map(({ event, church }) => (
              <li key={event.id}>
                <Link
                  href={`/${locale}/igreja/${church.slug}`}
                  className="group block hover:no-underline"
                >
                  <Card interactive pad="md" as="article" className="h-full">
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
                      {formatTimeOnly(new Date(event.startDatetime), locale)}
                    </p>
                    <h4 className="mt-2 font-serif text-lg leading-tight text-ink group-hover:text-gold sm:text-xl">
                      {event.title}
                    </h4>
                    <p className="mt-1 text-sm text-muted">
                      {church.name} · {church.city}
                    </p>
                    {event.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{event.description}</p>
                    )}
                    {(event.acceptingVolunteers || church.youtubeUrl) && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {event.acceptingVolunteers && (
                          <Badge tone="gold">{t('upcoming.volunteers')}</Badge>
                        )}
                        {church.youtubeUrl && (
                          <WatchLiveLink
                            youtubeUrl={church.youtubeUrl}
                            label={t('church.watchLive')}
                          />
                        )}
                      </div>
                    )}
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {cursor && (
        <div ref={sentinelRef} className="mt-2 flex h-12 items-center justify-center text-sm text-muted">
          {loading ? t('upcoming.loading') : ' '}
        </div>
      )}
      {!cursor && items.length > 0 && (
        <p className="mt-2 text-center text-xs text-muted">{t('upcoming.endOfFeed')}</p>
      )}
      {error && <p className="mt-3 text-center text-sm text-danger">{error}</p>}
    </div>
  );
}
