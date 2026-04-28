import Link from 'next/link';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { container } from '@/infrastructure/di/container';
import { getPrincipal } from '@/presentation/lib/principal';

import { Container } from '@/presentation/components/ui/Container';
import { PageHero } from '@/presentation/components/ui/PageHero';
import { Card } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Badge } from '@/presentation/components/ui/Badge';
import { AcceptInvitationButton } from '@/presentation/components/AcceptInvitationButton';

interface PageProps {
  params: Promise<{ locale: string; token: string }>;
}

export const dynamic = 'force-dynamic';

export default async function InvitePage({ params }: PageProps) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('invite');

  const inv = await container.invitations.findByToken(token);
  if (!inv) {
    return (
      <Container as="section" pad="page">
        <Card pad="md">
          <h1 className="font-serif text-2xl text-ink">{t('invalidTitle')}</h1>
          <p className="mt-2 text-sm text-ink-soft">{t('invalidDesc')}</p>
        </Card>
      </Container>
    );
  }

  const expired = inv.status === 'EXPIRED' || inv.expiresAt.getTime() < Date.now();
  const consumed = inv.status === 'ACCEPTED' || inv.status === 'CANCELLED';
  const church = await container.churches.findById(inv.churchId);
  const principal = await getPrincipal();

  return (
    <>
      <PageHero
        kicker={t('kicker')}
        title={church ? t('title', { church: church.name }) : t('titleGeneric')}
        subtitle={t('subtitle', { role: inv.roleType, email: inv.email })}
      />
      <Container as="section" pad="page">
        <Card pad="md" className="max-w-2xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={expired ? 'danger' : consumed ? 'neutral' : 'gold'}>
              {expired ? t('status.EXPIRED') : t(`status.${inv.status}` as 'status.PENDING')}
            </Badge>
          </div>

          {expired && <p className="text-sm text-ink-soft">{t('expiredDesc')}</p>}
          {consumed && !expired && <p className="text-sm text-ink-soft">{t('consumedDesc')}</p>}

          {!expired && !consumed && !principal && (
            <>
              <p className="text-sm text-ink-soft">{t('loginPrompt', { email: inv.email })}</p>
              <Button
                href={`/api/auth/signin?callbackUrl=/${locale}/convite/${token}`}
                variant="primary"
              >
                {t('signIn')}
              </Button>
            </>
          )}

          {!expired &&
            !consumed &&
            principal &&
            principal.email.toLowerCase() !== inv.email.toLowerCase() && (
              <>
                <p className="text-sm text-danger">
                  {t('emailMismatch', { logged: principal.email, expected: inv.email })}
                </p>
                <p className="text-sm text-ink-soft">{t('switchAccountHint')}</p>
              </>
            )}

          {!expired &&
            !consumed &&
            principal &&
            principal.email.toLowerCase() === inv.email.toLowerCase() && (
              <AcceptInvitationButton token={token} locale={locale} churchSlug={church?.slug} />
            )}

          {church && (
            <p className="pt-2 text-xs text-muted">
              <Link href={`/${locale}/igreja/${church.slug}`} className="text-ink-soft hover:text-gold">
                {t('viewChurch')}
              </Link>
            </p>
          )}
        </Card>
      </Container>
    </>
  );
}
