'use server';

import { revalidatePath } from 'next/cache';

import { container } from '@/infrastructure/di/container';
import { getPrincipal } from '@/presentation/lib/principal';
import type { VolunteerStatus } from '@/domain/entities/VolunteerApplication';

export async function applyAsVolunteerAction(args: {
  eventId: string;
  offeredRole: string;
  coverMessage?: string;
  applicantName?: string;
  applicantWhatsapp?: string;
  locale: string;
  churchSlug: string;
}) {
  const principal = await getPrincipal();
  await container.applyAsVolunteer().execute(principal, {
    eventId: args.eventId,
    offeredRole: args.offeredRole,
    coverMessage: args.coverMessage,
    applicantName: args.applicantName,
    applicantWhatsapp: args.applicantWhatsapp,
  });
  revalidatePath(`/${args.locale}/igreja/${args.churchSlug}`);
}

export async function updateMyVolunteerApplicationAction(args: {
  applicationId: string;
  offeredRole?: string;
  coverMessage?: string;
  applicantName?: string;
  applicantWhatsapp?: string;
  locale: string;
  churchSlug: string;
}) {
  const principal = await getPrincipal();
  await container.updateMyVolunteerApplication().execute(principal, {
    applicationId: args.applicationId,
    offeredRole: args.offeredRole,
    coverMessage: args.coverMessage,
    applicantName: args.applicantName,
    applicantWhatsapp: args.applicantWhatsapp,
  });
  revalidatePath(`/${args.locale}/igreja/${args.churchSlug}`);
}

export async function cancelMyVolunteerApplicationAction(args: {
  applicationId: string;
  locale: string;
  churchSlug: string;
}) {
  const principal = await getPrincipal();
  await container.cancelMyVolunteerApplication().execute(principal, args.applicationId);
  revalidatePath(`/${args.locale}/igreja/${args.churchSlug}`);
}

export async function updateVolunteerStatusAction(args: {
  applicationId: string;
  status: VolunteerStatus;
  notes?: string;
  locale: string;
  churchSlug: string;
}) {
  const principal = await getPrincipal();
  await container.updateVolunteerStatus().execute(principal, {
    applicationId: args.applicationId,
    status: args.status,
    notes: args.notes,
  });
  revalidatePath(`/${args.locale}/painel/${args.churchSlug}/voluntarios`);
}
