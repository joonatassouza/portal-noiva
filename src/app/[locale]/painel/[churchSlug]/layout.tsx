import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { container } from '@/infrastructure/di/container';
import { getPrincipal } from '@/presentation/lib/principal';
import { hasAtLeast } from '@/domain/policies/access';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string; churchSlug: string }>;
}

export const dynamic = 'force-dynamic';

export default async function OwnerPanelLayout({ children, params }: LayoutProps) {
  const { locale, churchSlug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('panel');

  const principal = await getPrincipal();
  if (!principal) redirect(`/api/auth/signin?callbackUrl=/${locale}/painel/${churchSlug}`);

  const church = await container.churches.findBySlug(churchSlug);
  if (!church) notFound();

  const role = await container.roles.findByUserAndChurch(principal.userId, church.id);
  // Any role gets in (MEDIA_EDITOR is the lowest). Master admin always passes.
  const allowed = principal.isMasterAdmin || hasAtLeast(role?.roleType, 'MEDIA_EDITOR');
  if (!allowed) redirect(`/${locale}/igreja/${churchSlug}`);

  // Tabs that touch services / events / info / equipe require EDITOR_ADMIN+.
  // Mídia tab is open to MEDIA_EDITOR and up.
  const canEdit = principal.isMasterAdmin || hasAtLeast(role?.roleType, 'EDITOR_ADMIN');

  return (
    <div className="container-page py-6 sm:py-10">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-gold">
        {t('panelLabel')}
      </p>
      <h1 className="mt-2 font-serif text-2xl text-ink sm:text-3xl">{church.name}</h1>
      <p className="mt-1 text-sm text-muted">
        {church.city} · {church.country}
      </p>
      <nav className="mt-4 flex flex-wrap gap-3 border-b border-border pb-2 text-sm">
        {canEdit && (
          <>
            <PanelLink href={`/${locale}/painel/${churchSlug}/cultos`}>{t('tabs.services')}</PanelLink>
            <PanelLink href={`/${locale}/painel/${churchSlug}/eventos`}>{t('tabs.events')}</PanelLink>
            <PanelLink href={`/${locale}/painel/${churchSlug}/voluntarios`}>{t('tabs.volunteers')}</PanelLink>
            <PanelLink href={`/${locale}/painel/${churchSlug}/info`}>{t('tabs.info')}</PanelLink>
            <PanelLink href={`/${locale}/painel/${churchSlug}/equipe`}>{t('tabs.team')}</PanelLink>
          </>
        )}
        <PanelLink href={`/${locale}/painel/${churchSlug}/midia`}>{t('tabs.media')}</PanelLink>
      </nav>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-ink hover:text-gold">
      {children}
    </Link>
  );
}
