'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { container } from '@/infrastructure/di/container';
import { getPrincipal } from '@/presentation/lib/principal';
import type { OwnershipStatus } from '@/domain/entities/Church';

export interface ChurchFormPayload {
  id?: string;
  slug?: string;
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
  pixKey?: string;
  pixQrcodeImageUrl?: string;
  ownershipStatus?: OwnershipStatus;
}

export async function saveChurchAction(payload: ChurchFormPayload, locale: string) {
  const principal = await getPrincipal();
  const lat = payload.lat ? Number(payload.lat) : undefined;
  const lng = payload.lng ? Number(payload.lng) : undefined;

  const church = await container.upsertChurch().execute(principal, {
    id: payload.id,
    slug: payload.slug,
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
    pix: {
      pixKey: payload.pixKey,
      pixQrcodeImageUrl: payload.pixQrcodeImageUrl,
    },
    ownershipStatus: payload.ownershipStatus,
  });

  revalidatePath(`/${locale}/admin/igrejas`);
  revalidatePath(`/${locale}/igreja/${church.slug}`);
  redirect(`/${locale}/admin/igrejas`);
}

export async function geocodeAction(query: string): Promise<{ lat: number; lng: number; formattedAddress: string } | null> {
  const principal = await getPrincipal();
  if (!principal?.isMasterAdmin) return null;
  return container.geocoder.search(query);
}
