import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { container } from '@/infrastructure/di/container';
import { ChurchForm } from '@/presentation/components/ChurchForm';
import { SectionHeading } from '@/presentation/components/ui/SectionHeading';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function EditChurchPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin');

  const church = await container.churches.findBySlug(slug);
  if (!church) notFound();

  return (
    <div className="space-y-6">
      <SectionHeading title={`${t('edit')} — ${church.name}`} />
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
