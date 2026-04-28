'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';

import type { MediaFeedItem } from '@/application/use-cases/ListGlobalMediaFeed';

import { Card } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';
import { Button } from '@/presentation/components/ui/Button';
import { EmptyState } from '@/presentation/components/ui/EmptyState';
import { ShareLinkButton } from './ShareLinkButton';
import { ReportPostButton } from './ReportPostButton';
import { fetchMediaFeedAction } from '@/app/_actions/media';

interface MediaGlobalFeedProps {
  locale: string;
  isAuthenticated: boolean;
  initial: { items: MediaFeedItem[]; nextCursor: string | null };
}

/**
 * Chronological feed of every media post across the catalog.
 * Cards include 3 actions: comment (jumps to post page), share, report.
 */
export function MediaGlobalFeed({ locale, isAuthenticated, initial }: MediaGlobalFeedProps) {
  const t = useTranslations('feed');
  const intlLocale = useLocale();
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
      const page = await fetchMediaFeedAction(cursor);
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
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '300px 0px' },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [cursor, loadMore]);

  if (items.length === 0) {
    return <EmptyState title={t('empty.title')} description={t('empty.description')} />;
  }

  return (
    <div>
      <ul className="space-y-4">
        {items.map(({ post, church, event, commentCount }) => {
          const postPath = `/${locale}/igreja/${church.slug}/post/${post.id}`;
          return (
            <li key={post.id}>
              <Card pad="md" as="article" className="space-y-3">
                <header className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/${locale}/igreja/${church.slug}`}
                      className="font-medium text-ink hover:text-gold"
                    >
                      {church.name}
                    </Link>
                    <p className="text-xs text-muted">
                      {church.city} · {church.country}
                      {event && <span className="ml-2 text-ink-soft">· {event.title}</span>}
                    </p>
                  </div>
                  <Badge tone={post.type === 'ALBUM_LINK' ? 'neutral' : 'gold'}>
                    {post.type === 'ALBUM_LINK' ? 'Álbum' : 'Galeria'}
                  </Badge>
                </header>

                <Link href={postPath} className="block hover:no-underline">
                  {post.type === 'IMAGE_GALLERY' && post.images[0] && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={post.images[0].url}
                      alt={post.images[0].alt ?? post.caption ?? 'Mídia'}
                      className="aspect-video w-full rounded-md object-cover"
                      loading="lazy"
                    />
                  )}
                  {post.type === 'ALBUM_LINK' && post.externalUrl && (
                    <p className="break-all rounded-md border border-dashed border-border bg-surface p-3 text-sm text-ink-soft">
                      {post.externalUrl}
                    </p>
                  )}
                  {post.caption && (
                    <p className="mt-2 line-clamp-3 text-sm text-ink">{post.caption}</p>
                  )}
                </Link>

                <footer className="flex items-center justify-between gap-2 border-t border-border pt-2">
                  <p className="text-xs text-muted">
                    {new Intl.DateTimeFormat(intlLocale, {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(post.createdAt))}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button href={`${postPath}#comentarios`} variant="ghost" size="sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <span className="ml-1">
                        {commentCount > 0 ? commentCount : t('comment')}
                      </span>
                    </Button>
                    <ShareLinkButton path={postPath} />
                    <ReportPostButton
                      postId={post.id}
                      isAuthenticated={isAuthenticated}
                      callbackUrl={postPath}
                    />
                  </div>
                </footer>
              </Card>
            </li>
          );
        })}
      </ul>

      {cursor && (
        <div ref={sentinelRef} className="mt-6 flex h-12 items-center justify-center text-sm text-muted">
          {loading ? t('loading') : ' '}
        </div>
      )}
      {!cursor && items.length > 0 && (
        <p className="mt-6 text-center text-xs text-muted">{t('endOfFeed')}</p>
      )}
      {error && <p className="mt-3 text-center text-sm text-danger">{error}</p>}
    </div>
  );
}
