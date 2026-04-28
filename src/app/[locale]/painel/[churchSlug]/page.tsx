import { notFound, redirect } from 'next/navigation';

import { container } from '@/infrastructure/di/container';
import { getPrincipal } from '@/presentation/lib/principal';
import { hasAtLeast } from '@/domain/policies/access';

interface PageProps {
  params: Promise<{ locale: string; churchSlug: string }>;
}

export default async function PanelIndex({ params }: PageProps) {
  const { locale, churchSlug } = await params;
  const principal = await getPrincipal();
  if (!principal) redirect(`/api/auth/signin?callbackUrl=/${locale}/painel/${churchSlug}`);

  const church = await container.churches.findBySlug(churchSlug);
  if (!church) notFound();
  const role = await container.roles.findByUserAndChurch(principal.userId, church.id);

  // Editor+ goes to cultos; pure MEDIA_EDITOR goes to mídia.
  const target =
    principal.isMasterAdmin || hasAtLeast(role?.roleType, 'EDITOR_ADMIN')
      ? `/${locale}/painel/${churchSlug}/cultos`
      : `/${locale}/painel/${churchSlug}/midia`;
  redirect(target);
}
