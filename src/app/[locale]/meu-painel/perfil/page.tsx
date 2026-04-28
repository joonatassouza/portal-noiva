import { redirect } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { container } from '@/infrastructure/di/container';
import { getPrincipal } from '@/presentation/lib/principal';

import { Container } from '@/presentation/components/ui/Container';
import { PageHero } from '@/presentation/components/ui/PageHero';
import { ProfileForm } from '@/presentation/components/ProfileForm';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export const dynamic = 'force-dynamic';

export default async function MyProfilePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('profile');

  const principal = await getPrincipal();
  if (!principal) {
    redirect(`/api/auth/signin?callbackUrl=/${locale}/meu-painel/perfil`);
  }

  const profile = await container.profiles.findByUserId(principal.userId);

  return (
    <>
      <PageHero kicker={t('kicker')} title={t('title')} subtitle={t('subtitle')} />
      <Container as="section" pad="page">
        <ProfileForm
          locale={locale}
          email={principal.email}
          initial={{
            displayName: profile?.displayName ?? '',
            whatsappNumber: profile?.whatsappNumber ?? '',
            locale: profile?.locale ?? (locale as 'pt-BR' | 'es-LA'),
          }}
        />
      </Container>
    </>
  );
}
