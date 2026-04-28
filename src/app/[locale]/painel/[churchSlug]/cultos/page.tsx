import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { container } from '@/infrastructure/di/container';
import { compareServicesForDisplay } from '@/shared/services';
import { ServicesPanel } from '@/presentation/components/ServicesPanel';

interface PageProps {
  params: Promise<{ locale: string; churchSlug: string }>;
}

export const dynamic = 'force-dynamic';

export default async function PanelServicesPage({ params }: PageProps) {
  const { locale, churchSlug } = await params;
  setRequestLocale(locale);
  await getTranslations('panel');

  const church = await container.churches.findBySlug(churchSlug);
  if (!church) notFound();
  const services = (await container.services.listByChurch(church.id)).sort(
    compareServicesForDisplay,
  );

  return <ServicesPanel locale={locale} church={church} services={services} />;
}
