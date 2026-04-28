import Link from 'next/link';
import { redirect } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { getPrincipal } from '@/presentation/lib/principal';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const principal = await getPrincipal();
  if (!principal) redirect(`/api/auth/signin?callbackUrl=/${locale}/admin`);
  if (!principal.isMasterAdmin) redirect(`/${locale}`);

  const t = await getTranslations('admin');

  return (
    <div className="container-page py-6 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[220px,1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-gold">
            {t('panel')}
          </p>
          <nav className="mt-3 flex flex-row flex-wrap gap-2 lg:flex-col lg:flex-nowrap">
            <Link href={`/${locale}/admin`} className="text-sm text-ink hover:text-gold">
              {t('overview')}
            </Link>
            <Link href={`/${locale}/admin/igrejas`} className="text-sm text-ink hover:text-gold">
              {t('churches')}
            </Link>
            <Link href={`/${locale}/admin/propostas`} className="text-sm text-ink hover:text-gold">
              {t('proposals')}
            </Link>
            <Link href={`/${locale}/admin/claims`} className="text-sm text-ink hover:text-gold">
              {t('claims')}
            </Link>
          </nav>
        </aside>
        <section>{children}</section>
      </div>
    </div>
  );
}
