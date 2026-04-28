'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { container } from '@/infrastructure/di/container';
import { getPrincipal } from '@/presentation/lib/principal';

export async function submitClaimAction(args: {
  churchId: string;
  evidence: string;
  evidenceLinks: string[];
  locale: string;
  churchSlug: string;
}) {
  const principal = await getPrincipal();
  await container.submitClaim().execute(principal, {
    churchId: args.churchId,
    evidence: args.evidence,
    evidenceLinks: args.evidenceLinks,
  });
  revalidatePath(`/${args.locale}/igreja/${args.churchSlug}`);
  redirect(`/${args.locale}/igreja/${args.churchSlug}?claim=submitted`);
}

export async function reviewClaimAction(args: {
  claimId: string;
  approve: boolean;
  notes?: string;
  locale: string;
}) {
  const principal = await getPrincipal();
  await container.reviewClaim().execute(principal, {
    claimId: args.claimId,
    approve: args.approve,
    notes: args.notes,
  });
  revalidatePath(`/${args.locale}/admin/claims`);
}
