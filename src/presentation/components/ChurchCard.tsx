import Link from 'next/link';
import { Church } from '@/domain/entities/Church';
import { Badge } from '@/presentation/components/ui/Badge';
import { Card } from '@/presentation/components/ui/Card';
import { FavoriteButton } from './FavoriteButton';

interface ChurchCardProps {
  church: Church;
  locale: string;
  /** Optional distance label (e.g. when listed by proximity). */
  distanceKm?: number;
  /** When provided, renders the favorite heart button. */
  favorite?: {
    isFavorited: boolean;
    isAuthenticated: boolean;
  };
}

export function ChurchCard({ church, locale, distanceKm, favorite }: ChurchCardProps) {
  return (
    <Card pad="md" as="article" className="group relative h-full transition hover:border-gold">
      {favorite && (
        <div className="absolute right-3 top-3 z-10">
          <FavoriteButton
            churchId={church.id}
            initialFavorited={favorite.isFavorited}
            isAuthenticated={favorite.isAuthenticated}
            size="sm"
            callbackUrl={`/${locale}/igreja/${church.slug}`}
          />
        </div>
      )}
      <Link
        href={`/${locale}/igreja/${church.slug}`}
        className="block hover:no-underline"
      >
        <h3 className="pr-10 font-serif text-lg leading-tight text-ink group-hover:text-gold sm:text-xl">
          {church.name}
        </h3>
        <p className="mt-1 text-sm text-muted">
          {church.city} · {church.country}
          {typeof distanceKm === 'number' && (
            <span className="ml-2 text-ink-soft">· {distanceKm.toFixed(1)} km</span>
          )}
        </p>
        <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{church.physicalAddress}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {church.social.youtubeUrl && <Badge>YouTube</Badge>}
          {church.social.instagramUrl && <Badge>Instagram</Badge>}
          {church.social.websiteUrl && <Badge>Site</Badge>}
        </div>
      </Link>
    </Card>
  );
}
