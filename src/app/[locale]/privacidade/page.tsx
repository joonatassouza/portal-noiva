import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

import { Container } from '@/presentation/components/ui/Container';
import { PageHero } from '@/presentation/components/ui/PageHero';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('privacy');
  return { title: t('title'), description: t('subtitle') };
}

export default async function PrivacyPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('privacy');

  return (
    <>
      <PageHero kicker={t('kicker')} title={t('title')} subtitle={t('subtitle')} />
      <Container as="article" pad="page">
        <div className="prose max-w-prose space-y-4 text-sm text-ink-soft">
          <Section title={t('s1.title')} body={t('s1.body')} />
          <Section title={t('s2.title')} body={t('s2.body')} />
          <Section title={t('s3.title')} body={t('s3.body')} />
          <Section title={t('s4.title')} body={t('s4.body')} />
          <Section title={t('s5.title')} body={t('s5.body')} />
          <Section title={t('s6.title')} body={t('s6.body')} />
          <p className="pt-4 text-xs text-muted">{t('lastUpdated')}</p>
        </div>
      </Container>
    </>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <section>
      <h2 className="font-serif text-lg text-ink">{title}</h2>
      <p className="mt-1 whitespace-pre-line">{body}</p>
    </section>
  );
}
