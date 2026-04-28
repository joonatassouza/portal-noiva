import { redirect } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { getPrincipal } from '@/presentation/lib/principal';
import { Container } from '@/presentation/components/ui/Container';
import { PageHero } from '@/presentation/components/ui/PageHero';
import { Card } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { ChurchProposalForm } from '@/presentation/components/ChurchProposalForm';

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}

export const dynamic = 'force-dynamic';

export default async function ProposeChurchPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { status } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations('proposal');

  const principal = await getPrincipal();
  if (!principal) {
    redirect(`/api/auth/signin?callbackUrl=/${locale}/cadastrar-igreja`);
  }

  if (status === 'submitted') {
    return (
      <>
        <PageHero kicker={t('kicker')} title={t('submittedTitle')} subtitle={t('submittedSubtitle')} />
        <Container as="section" pad="page">
          <Card pad="md" className="max-w-xl space-y-3">
            <p className="text-sm text-ink">{t('submittedBody')}</p>
            <Button href={`/${locale}/igrejas`} variant="primary" size="sm">
              {t('backToCatalog')}
            </Button>
          </Card>
        </Container>
      </>
    );
  }

  return (
    <>
      <PageHero kicker={t('kicker')} title={t('title')} subtitle={t('subtitle')} />
      <Container as="section" pad="page">
        <ChurchProposalForm locale={locale} />
      </Container>
    </>
  );
}
