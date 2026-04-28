import { notFound, redirect } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { container } from '@/infrastructure/di/container';
import { getPrincipal } from '@/presentation/lib/principal';

import { Container } from '@/presentation/components/ui/Container';
import { PageHero } from '@/presentation/components/ui/PageHero';
import { ClaimForm } from '@/presentation/components/ClaimForm';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export const dynamic = 'force-dynamic';

export default async function ClaimChurchPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('claim');

  const principal = await getPrincipal();
  if (!principal) {
    redirect(`/api/auth/signin?callbackUrl=/${locale}/reivindicar/${slug}`);
  }

  const church = await container.churches.findBySlug(slug);
  if (!church) notFound();

  if (church.ownershipStatus === 'CLAIMED') {
    redirect(`/${locale}/igreja/${slug}`);
  }

  return (
    <>
      <PageHero
        kicker={t('kicker')}
        title={t('title', { church: church.name })}
        subtitle={t('subtitle')}
      />
      <Container as="section" pad="page">
        <ClaimForm
          locale={locale}
          churchId={church.id}
          churchSlug={church.slug}
          churchName={church.name}
        />
      </Container>
    </>
  );
}
