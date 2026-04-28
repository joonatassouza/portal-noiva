import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { container } from '@/infrastructure/di/container';
import { VolunteersPanel } from '@/presentation/components/VolunteersPanel';

interface PageProps {
  params: Promise<{ locale: string; churchSlug: string }>;
}

export const dynamic = 'force-dynamic';

export default async function PanelVolunteersPage({ params }: PageProps) {
  const { locale, churchSlug } = await params;
  setRequestLocale(locale);

  const church = await container.churches.findBySlug(churchSlug);
  if (!church) notFound();

  const [applications, events] = await Promise.all([
    container.volunteers.listByChurch(church.id),
    container.events.listByChurch(church.id),
  ]);
  const eventsById = new Map(events.map((e) => [e.id, e]));

  return (
    <VolunteersPanel
      locale={locale}
      churchSlug={church.slug}
      applications={applications.map((a) => ({
        application: a,
        eventTitle: eventsById.get(a.eventId)?.title ?? a.eventId,
      }))}
    />
  );
}
