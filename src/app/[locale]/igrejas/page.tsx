import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

import { container } from '@/infrastructure/di/container';

import { ChurchCard } from '@/presentation/components/ChurchCard';
import { ChurchFilters } from '@/presentation/components/ChurchFilters';
import { Container } from '@/presentation/components/ui/Container';
import { EmptyState } from '@/presentation/components/ui/EmptyState';
import { PageHero } from '@/presentation/components/ui/PageHero';
import { Card } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ country?: string; q?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('churches');
  return { title: t('title'), description: t('subtitle') };
}

export default async function ChurchesListPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('churches');
  const tProposal = await getTranslations('proposal');

  const sp = await searchParams;
  const country = (sp.country ?? '').trim();
  const q = (sp.q ?? '').trim();

  const { items, total, countries } = await container
    .listChurchesPage()
    .execute({ country: country || undefined, search: q || undefined });

  return (
    <>
      <PageHero kicker={t('title')} title={t('title')} subtitle={t('subtitle')} />

      <Container as="section" pad="page">
        <ChurchFilters countries={countries} initialCountry={country} initialSearch={q} />

        <p className="mt-4 text-sm text-muted">
          {t('filters.results', { count: total })}
        </p>

        {items.length === 0 ? (
          <EmptyState
            className="mt-6"
            title={t('empty.title')}
            description={t('empty.description')}
          />
        ) : (
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {items.map((church) => (
              <li key={church.id}>
                <ChurchCard church={church} locale={locale} />
              </li>
            ))}
          </ul>
        )}

        <Card pad="md" className="mt-10 flex flex-wrap items-center justify-between gap-3 border-gold">
          <div>
            <p className="font-medium text-ink">{tProposal('catalogCta.title')}</p>
            <p className="mt-1 text-sm text-ink-soft">{tProposal('catalogCta.subtitle')}</p>
          </div>
          <Button href={`/${locale}/cadastrar-igreja`} variant="primary" size="sm">
            {tProposal('catalogCta.button')}
          </Button>
        </Card>
      </Container>
    </>
  );
}
