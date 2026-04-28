import { setRequestLocale, getTranslations } from 'next-intl/server';

import { container } from '@/infrastructure/di/container';
import { Card } from '@/presentation/components/ui/Card';
import { SectionHeading } from '@/presentation/components/ui/SectionHeading';
import { EmptyState } from '@/presentation/components/ui/EmptyState';
import { ProposalReviewActions } from '@/presentation/components/ProposalReviewActions';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export const dynamic = 'force-dynamic';

export default async function AdminProposalsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin');

  const pending = await container.proposals.listPending();

  return (
    <div className="space-y-6">
      <SectionHeading title={t('proposals')} description={t('proposalsSubtitle')} />
      {pending.length === 0 ? (
        <EmptyState title={t('proposalsEmpty')} />
      ) : (
        <ul className="space-y-4">
          {pending.map((p) => (
            <li key={p.id}>
              <Card pad="md">
                <p className="font-medium text-ink">{p.church.name}</p>
                <p className="text-sm text-muted">
                  {p.church.city} · {p.church.country}
                </p>
                <p className="mt-2 text-sm text-ink-soft">{p.church.physicalAddress}</p>
                {p.church.description && (
                  <p className="mt-2 text-sm text-ink-soft">{p.church.description}</p>
                )}
                {(p.church.social?.youtubeUrl ||
                  p.church.social?.instagramUrl ||
                  p.church.social?.websiteUrl) && (
                  <ul className="mt-2 space-y-1 text-xs">
                    {p.church.social?.youtubeUrl && (
                      <li>
                        <a href={p.church.social.youtubeUrl} target="_blank" rel="noopener noreferrer">
                          YouTube ↗
                        </a>
                      </li>
                    )}
                    {p.church.social?.instagramUrl && (
                      <li>
                        <a href={p.church.social.instagramUrl} target="_blank" rel="noopener noreferrer">
                          Instagram ↗
                        </a>
                      </li>
                    )}
                    {p.church.social?.websiteUrl && (
                      <li>
                        <a href={p.church.social.websiteUrl} target="_blank" rel="noopener noreferrer">
                          Site ↗
                        </a>
                      </li>
                    )}
                  </ul>
                )}
                <hr className="my-3 border-border" />
                <p className="text-sm text-ink-soft">
                  <strong>{p.proposerName ?? p.proposerEmail}</strong>{' '}
                  <span className="text-muted">· {p.proposerEmail}</span>
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{p.evidence}</p>
                {p.evidenceLinks.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm">
                    {p.evidenceLinks.map((url) => (
                      <li key={url}>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          {url} ↗
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 text-xs text-muted">
                  {new Date(p.createdAt).toLocaleString(locale)}
                </p>
                <div className="mt-4">
                  <ProposalReviewActions proposalId={p.id} locale={locale} />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
