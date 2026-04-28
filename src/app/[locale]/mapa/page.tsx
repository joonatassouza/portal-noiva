import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

import { container } from '@/infrastructure/di/container';
import { Container } from '@/presentation/components/ui/Container';
import { EmptyState } from '@/presentation/components/ui/EmptyState';
import { PageHero } from '@/presentation/components/ui/PageHero';
import { ChurchMapLoader } from '@/presentation/components/ChurchMapLoader';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('map');
  return { title: t('title'), description: t('subtitle') };
}

export default async function MapPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('map');

  const pins = await container.listMapPins().execute();

  return (
    <>
      <PageHero kicker={t('title')} title={t('title')} subtitle={t('subtitle')} />

      <Container as="section" pad="page">
        {pins.length === 0 ? (
          <EmptyState title={t('noPins')} />
        ) : (
          <ChurchMapLoader pins={pins} locale={locale} />
        )}
      </Container>
    </>
  );
}
