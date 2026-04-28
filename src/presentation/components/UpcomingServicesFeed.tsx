'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { UpcomingServiceItem } from '@/application/use-cases/ListUpcomingServices';
import { Badge } from '@/presentation/components/ui/Badge';
import { Card } from '@/presentation/components/ui/Card';
import { EmptyState } from '@/presentation/components/ui/EmptyState';
import { fetchUpcomingServices } from '@/app/_actions/upcoming';

interface UpcomingServicesFeedProps {
  locale: string;
  initial: { items: UpcomingServiceItem[]; nextCursor: string | null };
}

/**
 * Chronological feed of next service occurrences.
 * Loads 10 at a time. IntersectionObserver fetches the next page when the
 * sentinel becomes visible.
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

  if (items.length === 0) {
    return <EmptyState title={t('upcoming.servicesEmpty.title')} description={t('upcoming.servicesEmpty.description')} />;
  }

  return (
    <div>
      <ul className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {items.map((item) => {
          const occursAt = new Date(item.occursAt);
          return (
            <li key={`${item.service.id}-${item.occursAt}`}>
              <Link
                href={`/${locale}/igreja/${item.church.slug}`}
                className="group block hover:no-underline"
              >
                <Card interactive pad="md" as="article" className="h-full">
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">
                    {formatHeader(occursAt, locale)}
                  </p>
                  <h3 className="mt-2 font-serif text-lg leading-tight text-ink group-hover:text-gold sm:text-xl">
                    {item.service.label}
                  </h3>
                  <p className="mt-1 text-sm text-muted">
                    {item.church.name} · {item.church.city}
                  </p>
                  {item.service.hasLiveStream && (
                    <div className="mt-3">
                      <Badge tone="gold">{t('church.live')}</Badge>
                    </div>
                  )}
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>

      {cursor && (
        <div ref={sentinelRef} className="mt-6 flex h-12 items-center justify-center text-sm text-muted">
          {loading ? t('upcoming.loading') : ' '}
        </div>
      )}
      {!cursor && items.length > 0 && (
        <p className="mt-6 text-center text-xs text-muted">{t('upcoming.endOfFeed')}</p>
      )}
      {error && <p className="mt-3 text-center text-sm text-danger">{error}</p>}
    </div>
  );
}

function formatHeader(date: Date, locale: string): string {
  const fmt = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  return fmt.format(date);
}
