import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ChurchForm } from '@/presentation/components/ChurchForm';
import { SectionHeading } from '@/presentation/components/ui/SectionHeading';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function NewChurchPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin');
  return (
    <div className="space-y-6">
      <SectionHeading title={t('newChurch')} />
      <ChurchForm locale={locale} />
    </div>
  );
}
