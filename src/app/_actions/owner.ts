'use server';

import { revalidatePath } from 'next/cache';

import { container } from '@/infrastructure/di/container';
import { getPrincipal } from '@/presentation/lib/principal';
import type {
  ServiceCancelRule,
  ServiceRecurrence,
} from '@/domain/entities/Service';
import type { ChurchRoleType } from '@/domain/entities/ChurchRole';

export interface ServiceFormPayload {
  id?: string;
  churchId: string;
  label: string;
  startTime: string;
  endTime?: string;
  hasLiveStream: boolean;
  recurrence: ServiceRecurrence;
  cancelRules?: ServiceCancelRule[];
}

export async function saveServiceAction(payload: ServiceFormPayload, locale: string, churchSlug: string) {
  const principal = await getPrincipal();
  await container.upsertService().execute(principal, payload);
  revalidatePath(`/${locale}/painel/${churchSlug}/cultos`);
  revalidatePath(`/${locale}/igreja/${churchSlug}`);
}

export async function deleteServiceAction(args: {
  serviceId: string;
  churchId: string;
  locale: string;
  churchSlug: string;
}) {
  const principal = await getPrincipal();
  await container.deleteService().execute(principal, args.serviceId, args.churchId);
  revalidatePath(`/${args.locale}/painel/${args.churchSlug}/cultos`);
  revalidatePath(`/${args.locale}/igreja/${args.churchSlug}`);
}

export async function toggleServiceExceptionAction(args: {
  serviceId: string;
  churchId: string;
  date: string;
  reason?: string;
  locale: string;
  churchSlug: string;
}) {
  const principal = await getPrincipal();
  await container.toggleServiceException().execute(principal, {
    serviceId: args.serviceId,
    churchId: args.churchId,
    date: args.date,
    reason: args.reason,
  });
  revalidatePath(`/${args.locale}/painel/${args.churchSlug}/cultos`);
  revalidatePath(`/${args.locale}/igreja/${args.churchSlug}`);
}

export interface EventFormPayload {
  id?: string;
  churchId: string;
  slug?: string;
  title: string;
  description?: string;
  startDatetime: string; // ISO
  endDatetime?: string;
  eventLocation?: string;
  acceptingVolunteers: boolean;
}

export async function saveEventAction(payload: EventFormPayload, locale: string, churchSlug: string) {
  const principal = await getPrincipal();
  await container.upsertEvent().execute(principal, {
    ...payload,
    startDatetime: new Date(payload.startDatetime),
    endDatetime: payload.endDatetime ? new Date(payload.endDatetime) : undefined,
  });
  revalidatePath(`/${locale}/painel/${churchSlug}/eventos`);
  revalidatePath(`/${locale}/igreja/${churchSlug}`);
}

export async function deleteEventAction(args: {
  eventId: string;
  locale: string;
  churchSlug: string;
}) {
  const principal = await getPrincipal();
  await container.deleteEvent().execute(principal, args.eventId);
  revalidatePath(`/${args.locale}/painel/${args.churchSlug}/eventos`);
  revalidatePath(`/${args.locale}/igreja/${args.churchSlug}`);
}

export async function createInvitationAction(args: {
  churchId: string;
  email: string;
  roleType: ChurchRoleType;
  locale: string;
  churchSlug: string;
}): Promise<{ token: string }> {
  const principal = await getPrincipal();
  const inv = await container.createInvitation().execute(principal, {
    churchId: args.churchId,
    email: args.email,
    roleType: args.roleType,
  });
  revalidatePath(`/${args.locale}/painel/${args.churchSlug}/equipe`);
  return { token: inv.token };
}
