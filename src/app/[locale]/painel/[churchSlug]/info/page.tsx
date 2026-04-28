import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { container } from '@/infrastructure/di/container';
import { ChurchForm } from '@/presentation/components/ChurchForm';
import { Card } from '@/presentation/components/ui/Card';

interface PageProps {
  params: Promise<{ locale: string; churchSlug: string }>;
}

export const dynamic = 'force-dynamic';

export default async function PanelInfoPage({ params }: PageProps) {
  const { locale, churchSlug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('panel');

  const church = await container.churches.findBySlug(churchSlug);
  if (!church) notFound();

  return (
    <div className="space-y-4">
      <Card pad="md" tone="plain">
        <p className="text-sm text-ink-soft">{t('infoNotice')}</p>
      </Card>
      <ChurchForm
        locale={locale}
        initial={{
          id: church.id,
          slug: church.slug,
          name: church.name,
          description: church.description,
          physicalAddress: church.physicalAddress,
          city: church.city,
          country: church.country,
          lat: church.coords?.lat?.toString(),
          lng: church.coords?.lng?.toString(),
          youtubeUrl: church.social.youtubeUrl,
          instagramUrl: church.social.instagramUrl,
          facebookUrl: church.social.facebookUrl,
          websiteUrl: church.social.websiteUrl,
          pixKey: church.pix.pixKey,
          pixQrcodeImageUrl: church.pix.pixQrcodeImageUrl,
          ownershipStatus: church.ownershipStatus,
        }}
      />
    </div>
  );
}
