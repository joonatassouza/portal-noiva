'use server';

import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { container } from '@/infrastructure/di/container';
import { UnauthorizedError } from '@/domain/errors/DomainError';

export async function toggleFavoriteAction(
  churchId: string,
): Promise<{ favorited: boolean; requiresLogin?: boolean }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { favorited: false, requiresLogin: true };
  }

  try {
    const result = await container.toggleFavorite().execute(session.user.id, churchId);
    // Refresh server-rendered routes that show favorite state.
    revalidatePath('/[locale]/meu-painel', 'page');
    return result;
  } catch (e) {
    if (e instanceof UnauthorizedError) return { favorited: false, requiresLogin: true };
    throw e;
  }
}
