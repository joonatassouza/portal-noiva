import Link from 'next/link';

import { MediaPost } from '@/domain/entities/MediaPost';
import { Card } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';

interface MediaPostFeedProps {
  posts: MediaPost[];
  locale: string;
  churchSlug: string;
}

/**
 * Compact, server-rendered media feed for the public church page.
 * Each card links to the full post page.
 */
export function MediaPostFeed({ posts, locale, churchSlug }: MediaPostFeedProps) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((p) => (
        <li key={p.id}>
          <Link
            href={`/${locale}/igreja/${churchSlug}/post/${p.id}`}
            className="group block hover:no-underline"
          >
            <Card interactive pad="sm" as="article" className="h-full">
              {p.type === 'IMAGE_GALLERY' && p.images[0] && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={p.images[0].url}
                  alt={p.images[0].alt ?? p.caption ?? 'Mídia'}
                  className="mb-3 aspect-video w-full rounded-md object-cover"
                  loading="lazy"
                />
              )}
              <div className="flex items-center gap-2">
                <Badge tone={p.type === 'ALBUM_LINK' ? 'neutral' : 'gold'}>
                  {p.type === 'ALBUM_LINK' ? 'Álbum' : 'Galeria'}
                </Badge>
                {p.images.length > 1 && (
                  <span className="text-xs text-muted">+{p.images.length - 1}</span>
                )}
              </div>
              {p.caption && (
                <p className="mt-2 line-clamp-2 text-sm text-ink group-hover:text-gold">
                  {p.caption}
                </p>
              )}
              <p className="mt-2 text-xs text-muted">
                {new Date(p.createdAt).toLocaleDateString(locale)}
              </p>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
