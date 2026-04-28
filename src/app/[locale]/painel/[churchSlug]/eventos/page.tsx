import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { container } from '@/infrastructure/di/container';
import { EventsPanel } from '@/presentation/components/EventsPanel';

interface PageProps {
  params: Promise<{ locale: string; churchSlug: string }>;
}

export const dynamic = 'force-dynamic';

export default async function PanelEventsPage({ params }: PageProps) {
  const { locale, churchSlug } = await params;
  setRequestLocale(locale);

  const church = await container.churches.findBySlug(churchSlug);
  if (!church) notFound();
  const events = await container.events.listByChurch(church.id);

  return <EventsPanel locale={locale} church={church} events={events} />;
}
