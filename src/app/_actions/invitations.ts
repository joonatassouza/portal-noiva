'use server';

import { container } from '@/infrastructure/di/container';
import { getPrincipal } from '@/presentation/lib/principal';
import type { AcceptInvitationResult } from '@/application/use-cases/AcceptInvitation';

export async function acceptInvitationAction(token: string): Promise<AcceptInvitationResult> {
  const principal = await getPrincipal();
  return container.acceptInvitation().execute(principal, token);
}
