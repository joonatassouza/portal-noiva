'use server';

import { revalidatePath } from 'next/cache';

import { container } from '@/infrastructure/di/container';
import { getPrincipal } from '@/presentation/lib/principal';
import type { Locale } from '@/domain/entities/Profile';

export async function updateMyProfileAction(args: {
  displayName?: string;
  whatsappNumber?: string;
  locale?: Locale;
  pageLocale: string;
}) {
  const principal = await getPrincipal();
  await container.updateMyProfile().execute(principal, {
    displayName: args.displayName,
    whatsappNumber: args.whatsappNumber,
    locale: args.locale,
  });
  revalidatePath(`/${args.pageLocale}/meu-painel/perfil`);
  revalidatePath(`/${args.pageLocale}/meu-painel`);
}
