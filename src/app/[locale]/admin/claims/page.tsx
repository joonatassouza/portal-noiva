import { setRequestLocale, getTranslations } from 'next-intl/server';

import { container } from '@/infrastructure/di/container';
import { Card } from '@/presentation/components/ui/Card';
import { SectionHeading } from '@/presentation/components/ui/SectionHeading';
import { EmptyState } from '@/presentation/components/ui/EmptyState';
import { ClaimReviewActions } from '@/presentation/components/ClaimReviewActions';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export const dynamic = 'force-dynamic';

export default async function AdminClaimsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin');

  const pending = await container.claims.listPending();
  const churches = new Map(
    (
      await Promise.all(pending.map((c) => container.churches.findById(c.churchId)))
    )
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .map((c) => [c.id, c]),
  );

  return (
    <div className="space-y-6">
      <SectionHeading title={t('claims')} description={t('claimsSubtitle')} />
      {pending.length === 0 ? (
        <EmptyState title={t('claimsEmpty')} />
      ) : (
        <ul className="space-y-4">
          {pending.map((claim) => {
            const church = churches.get(claim.churchId);
            return (
              <li key={claim.id}>
                <Card pad="md">
                  <p className="font-medium text-ink">{church?.name ?? claim.churchId}</p>
                  <p className="text-sm text-muted">
                    {church ? `${church.city} · ${church.country}` : ''}
                  </p>
                  <p className="mt-3 text-sm text-ink-soft">
                    <strong>{claim.claimantName ?? claim.claimantEmail}</strong>{' '}
                    <span className="text-muted">· {claim.claimantEmail}</span>
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-ink">
                    {claim.evidence}
                  </p>
                  {claim.evidenceLinks.length > 0 && (
                    <ul className="mt-2 space-y-1 text-sm">
                      {claim.evidenceLinks.map((url) => (
                        <li key={url}>
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            {url} ↗
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-2 text-xs text-muted">
                    {new Date(claim.createdAt).toLocaleString(locale)}
                  </p>
                  <div className="mt-4">
                    <ClaimReviewActions claimId={claim.id} locale={locale} />
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
