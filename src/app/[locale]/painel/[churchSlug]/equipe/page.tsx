import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { container } from '@/infrastructure/di/container';
import { TeamPanel } from '@/presentation/components/TeamPanel';

interface PageProps {
  params: Promise<{ locale: string; churchSlug: string }>;
}

export const dynamic = 'force-dynamic';

export default async function PanelTeamPage({ params }: PageProps) {
  const { locale, churchSlug } = await params;
  setRequestLocale(locale);

  const church = await container.churches.findBySlug(churchSlug);
  if (!church) notFound();

  const [roles, invitations] = await Promise.all([
    container.roles.listByChurch(church.id),
    container.invitations.listByChurch(church.id),
  ]);

  return (
    <TeamPanel
      locale={locale}
      church={church}
      roles={roles}
      invitations={invitations}
      siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}
    />
  );
}
