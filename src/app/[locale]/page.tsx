import { setRequestLocale, getTranslations } from 'next-intl/server';

import { auth } from '@/auth';
import { container } from '@/infrastructure/di/container';

import { Container } from '@/presentation/components/ui/Container';
import { PageHero } from '@/presentation/components/ui/PageHero';
import { SectionHeading } from '@/presentation/components/ui/SectionHeading';

import { HomeSearchForm } from '@/presentation/components/HomeSearchForm';
import { UpcomingTabs } from '@/presentation/components/UpcomingTabs';

interface PageProps {
  params: Promise<{ locale: string }>;
}

// Service projections + media feed depend on the current time, so we cap
// caching at 60s. Cheap enough, fresh enough.
export const revalidate = 60;

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');

  const session = await auth();

  const [initialServices, initialEvents, initialMediaFeed] = await Promise.all([
    container.listUpcomingServices().execute({ limit: 10 }),
    container.listUpcomingEvents().execute({ limit: 10 }),
    container.listGlobalMediaFeed().execute({ limit: 10 }),
  ]);

  return (
    <>
      <PageHero kicker={t('hero.kicker')} title={t('hero.title')} subtitle={t('hero.subtitle')}>
        <HomeSearchForm locale={locale} />
      </PageHero>

      <Container as="section" pad="page">
        <SectionHeading title={t('sectionsTitle')} />
        <div className="mt-6">
          <UpcomingTabs
            locale={locale}
            isAuthenticated={Boolean(session?.user)}
            initialServices={initialServices}
            initialEvents={initialEvents}
            initialMediaFeed={initialMediaFeed}
          />
        </div>
      </Container>
    </>
  );
}
