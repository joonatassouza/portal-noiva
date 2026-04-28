import Link from 'next/link';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { container } from '@/infrastructure/di/container';
import { Button } from '@/presentation/components/ui/Button';
import { Card } from '@/presentation/components/ui/Card';
import { SectionHeading } from '@/presentation/components/ui/SectionHeading';
import { Badge } from '@/presentation/components/ui/Badge';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminChurchesList({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin');

  const items = await container.churches.list({ limit: 500 });

  return (
    <div className="space-y-6">
      <SectionHeading
        title={t('churches')}
        trailing={
          <Button href={`/${locale}/admin/igrejas/nova`} variant="primary" size="sm">
            {t('newChurch')}
          </Button>
        }
      />
      <ul className="space-y-3">
        {items.map((c) => (
          <li key={c.id}>
            <Card pad="md" className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-ink">{c.name}</p>
                <p className="text-sm text-muted">
                  {c.city} · {c.country}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={c.ownershipStatus} />
                <Link
                  href={`/${locale}/admin/igrejas/${c.slug}`}
                  className="text-sm text-ink hover:text-gold"
                >
                  {t('edit')}
                </Link>
                <Link
                  href={`/${locale}/igreja/${c.slug}`}
                  className="text-sm text-ink-soft hover:text-gold"
                >
                  {t('viewPublic')}
                </Link>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusBadge({ status }: { status: 'UNCLAIMED' | 'PENDING_REVIEW' | 'CLAIMED' }) {
  if (status === 'CLAIMED') return <Badge tone="success">CLAIMED</Badge>;
  if (status === 'PENDING_REVIEW') return <Badge tone="gold">PENDING</Badge>;
  return <Badge>UNCLAIMED</Badge>;
}
