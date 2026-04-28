import { setRequestLocale, getTranslations } from 'next-intl/server';
import { container } from '@/infrastructure/di/container';
import { Card } from '@/presentation/components/ui/Card';
import { SectionHeading } from '@/presentation/components/ui/SectionHeading';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminHome({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin');

  const [pending, pendingProposals, churchCount] = await Promise.all([
    container.claims.listPending(),
    container.proposals.listPending(),
    container.churches.count(),
  ]);

  return (
    <div className="space-y-6">
      <SectionHeading title={t('overview')} description={t('overviewSubtitle')} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card pad="md">
          <p className="text-sm text-muted">{t('totals.churches')}</p>
          <p className="mt-1 font-serif text-3xl text-ink">{churchCount}</p>
        </Card>
        <Card pad="md">
          <p className="text-sm text-muted">{t('totals.pendingProposals')}</p>
          <p className="mt-1 font-serif text-3xl text-ink">{pendingProposals.length}</p>
        </Card>
        <Card pad="md">
          <p className="text-sm text-muted">{t('totals.pendingClaims')}</p>
          <p className="mt-1 font-serif text-3xl text-ink">{pending.length}</p>
        </Card>
      </div>
    </div>
  );
}
