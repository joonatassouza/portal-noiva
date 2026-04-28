'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { container } from '@/infrastructure/di/container';
import { getPrincipal } from '@/presentation/lib/principal';

export interface ProposalFormPayload {
  name: string;
  description?: string;
  physicalAddress: string;
  city: string;
  country: string;
  lat?: string;
  lng?: string;
  youtubeUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  websiteUrl?: string;
  evidence: string;
  evidenceLinks: string[];
  proposerName?: string;
}

export async function submitProposalAction(payload: ProposalFormPayload, locale: string) {
  const principal = await getPrincipal();
  const lat = payload.lat ? Number(payload.lat) : undefined;
  const lng = payload.lng ? Number(payload.lng) : undefined;

  await container.submitChurchProposal().execute(principal, {
    name: payload.name,
    description: payload.description,
    physicalAddress: payload.physicalAddress,
    city: payload.city,
    country: payload.country,
    coords: lat && lng ? { lat, lng } : undefined,
    social: {
      youtubeUrl: payload.youtubeUrl,
      instagramUrl: payload.instagramUrl,
      facebookUrl: payload.facebookUrl,
      websiteUrl: payload.websiteUrl,
    },
    evidence: payload.evidence,
    evidenceLinks: payload.evidenceLinks,
    proposerName: payload.proposerName,
  });
  revalidatePath(`/${locale}/admin/propostas`);
  redirect(`/${locale}/cadastrar-igreja?status=submitted`);
}

export async function reviewProposalAction(args: {
  proposalId: string;
  approve: boolean;
  notes?: string;
  locale: string;
}) {
  const principal = await getPrincipal();
  await container.reviewChurchProposal().execute(principal, {
    proposalId: args.proposalId,
    approve: args.approve,
    notes: args.notes,
  });
  revalidatePath(`/${args.locale}/admin/propostas`);
}
