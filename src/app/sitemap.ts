import type { MetadataRoute } from 'next';
import { container } from '@/infrastructure/di/container';
import { locales } from '@/presentation/i18n/config';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// Don't prerender at build time — the sitemap hits the DB and we don't want
// a transient Mongo issue to break the whole build.
export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = ['', '/igrejas', '/mapa', '/eventos'];
  const staticEntries = staticPaths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: path === '' ? 1 : 0.7,
    })),
  );

  // If the DB is unreachable we still want a usable sitemap with the static
  // paths instead of a 500 from the route.
  let churchEntries: MetadataRoute.Sitemap = [];
  try {
    const churches = await container.listChurches().execute({ limit: 5000 });
    churchEntries = churches.items.flatMap((c) =>
      locales.map((locale) => ({
        url: `${SITE_URL}/${locale}/igreja/${c.slug}`,
        lastModified: c.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
    );
  } catch (err) {
    console.error('[sitemap] failed to load churches from DB:', err);
  }

  return [...staticEntries, ...churchEntries];
}
