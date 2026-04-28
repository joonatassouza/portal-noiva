'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { UpcomingServiceItem } from '@/application/use-cases/ListUpcomingServices';
import { Card } from '@/presentation/components/ui/Card';
import { EmptyState } from '@/presentation/components/ui/EmptyState';
import { fetchUpcomingServices } from '@/app/_actions/upcoming';
import { groupByDay, formatDayHeading, formatTimeOnly } from '@/shared/dayGroups';
import { WatchLiveLink } from '@/presentation/components/WatchLiveLink';

interface UpcomingServicesFeedProps {
  locale: string;
  initial: { items: UpcomingServiceItem[]; nextCursor: string | null };
}

/**
 * Chronological feed of next service occurrences, bucketed by local day so
 * scanning by date is one glance instead of reading every card. Pages of 10
 * are appended via IntersectionObserver and re-grouped on each render.
 */
export function UpcomingServicesFeed({ locale, initial }: UpcomingServicesFeedProps) {
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
      const page = await fetchUpcomingServices(cursor);
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
    () => groupByDay(items, (it) => new Date(it.occursAt)),
    [items],
  );

  if (items.length === 0) {
    return <EmptyState title={t('upcoming.servicesEmpty.title')} description={t('upcoming.servicesEmpty.description')} />;
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.dayKey} aria-labelledby={`day-${group.dayKey}`}>
          <h3
            id={`day-${group.dayKey}`}
            className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-gold"
          >
            {formatDayHeading(group.date, locale, dayLabels)}
          </h3>
          <ul className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {group.items.map((item) => {
              const occursAt = new Date(item.occursAt);
              return (
                <li key={`${item.service.id}-${item.occursAt}`}>
                  <Link
                    href={`/${locale}/igreja/${item.church.slug}`}
                    className="group block hover:no-underline"
                  >
                    <Card interactive pad="md" as="article" className="h-full">
                      <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
                        {formatTimeOnly(occursAt, locale)}
                      </p>
                      <h4 className="mt-2 font-serif text-lg leading-tight text-ink group-hover:text-gold sm:text-xl">
                        {item.service.label}
                      </h4>
                      <p className="mt-1 text-sm text-muted">
                        {item.church.name} · {item.church.city}
                      </p>
                      {item.service.hasLiveStream && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {item.church.youtubeUrl ? (
                            <WatchLiveLink
                              youtubeUrl={item.church.youtubeUrl}
                              label={t('church.watchLive')}
                            />
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-xs font-medium text-gold">
                              {t('church.live')}
                            </span>
                          )}
                        </div>
                      )}
                    </Card>
                  </Link>
                </li>
              );
            })}
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
