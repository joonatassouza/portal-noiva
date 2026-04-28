import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { container } from '@/infrastructure/di/container';

import { Container } from '@/presentation/components/ui/Container';
import { PageHero } from '@/presentation/components/ui/PageHero';
import { EmptyState } from '@/presentation/components/ui/EmptyState';
import { Button } from '@/presentation/components/ui/Button';
import { Card } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('panel');
  return { title: t('title'), description: t('subtitle'), robots: 'noindex' };
}

export const dynamic = 'force-dynamic';

export default async function MyPanelPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const session = await auth();
  if (!session?.user?.id) {
    // Send unauthenticated visitors through Google sign-in, returning here.
    redirect(`/api/auth/signin?callbackUrl=/${locale}/meu-painel`);
  }

  const [items, managedChurchIds] = await Promise.all([
    container.listUpcomingForFavorites().execute({
      userId: session.user.id,
      weeksAhead: 4,
      limit: 25,
    }),
    container.roles.listChurchIdsByUser(session.user.id),
  ]);

  // Master admin sees ALL churches in the "managed" section.
  const allChurchIds = session.user.isMasterAdmin
    ? (await container.churches.list({ limit: 5000 })).map((c) => c.id)
    : managedChurchIds;
  const managed = (
    await Promise.all(allChurchIds.map((id) => container.churches.findById(id)))
  ).filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <>
      <PageHero kicker={t('panel.title')} title={t('panel.title')} subtitle={t('panel.subtitle')} />

      <Container as="section" pad="page">
        {managed.length > 0 && (
          <section className="mb-10">
            <h2 className="font-serif text-xl text-ink sm:text-2xl">
              {t('panel.managed.title')}
            </h2>
            <p className="mt-1 text-sm text-ink-soft">{t('panel.managed.subtitle')}</p>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {managed.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/${locale}/painel/${c.slug}`}
                    className="group block hover:no-underline"
                  >
                    <Card interactive pad="md" as="article" className="h-full">
                      <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">
                        {t('panel.managed.openPanel')}
                      </p>
                      <h3 className="mt-2 font-serif text-lg leading-tight text-ink group-hover:text-gold sm:text-xl">
                        {c.name}
                      </h3>
                      <p className="mt-1 text-sm text-muted">
                        {c.city} · {c.country}
                      </p>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {items.length === 0 ? (
          <EmptyState
            title={t('panel.empty.title')}
            description={t('panel.empty.description')}
            action={
              <Button href={`/${locale}/igrejas`} variant="primary" size="md">
                {t('panel.empty.cta')} →
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {items.map((item) => {
              const occursAt = new Date(item.occursAt);
              return (
                <li key={`${item.service.id}-${item.occursAt}`}>
                  <Link
                    href={`/${locale}/igreja/${item.church.slug}`}
                    className="group block hover:no-underline"
                  >
                    <Card interactive pad="md" as="article" className="h-full">
                      <p className="font-mono text-xs uppercase tracking-[0.2em] text-gold">
                        {formatHeader(occursAt, locale)}
                      </p>
                      <h3 className="mt-2 font-serif text-lg leading-tight text-ink group-hover:text-gold sm:text-xl">
                        {item.service.label}
                      </h3>
                      <p className="mt-1 text-sm text-muted">
                        {item.church.name} · {item.church.city}
                      </p>
                      {item.service.hasLiveStream && (
                        <div className="mt-3">
                          <Badge tone="gold">{t('church.live')}</Badge>
                        </div>
                      )}
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Container>
    </>
  );
}

function formatHeader(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
