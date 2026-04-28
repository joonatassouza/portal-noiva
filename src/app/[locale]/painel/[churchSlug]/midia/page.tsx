import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { container } from '@/infrastructure/di/container';
import { MediaPanel } from '@/presentation/components/MediaPanel';

interface PageProps {
  params: Promise<{ locale: string; churchSlug: string }>;
}

export const dynamic = 'force-dynamic';

export default async function PanelMediaPage({ params }: PageProps) {
  const { locale, churchSlug } = await params;
  setRequestLocale(locale);

  const church = await container.churches.findBySlug(churchSlug);
  if (!church) notFound();

  const [posts, events] = await Promise.all([
    container.mediaPosts.listByChurch(church.id, 200),
    container.events.listByChurch(church.id),
  ]);
  // Pass only the lightweight fields the form needs.
  const eventOptions = events.map((e) => ({
    id: e.id,
    title: e.title,
    startDatetime: e.startDatetime.toISOString(),
  }));

  return (
    <MediaPanel
      locale={locale}
      church={{ id: church.id, slug: church.slug, name: church.name }}
      events={eventOptions}
      posts={posts}
    />
  );
}
