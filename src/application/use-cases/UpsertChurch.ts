import { ChurchRepository } from '@/application/ports/ChurchRepository';
import { Geocoder } from '@/application/ports/Geocoder';
import { Church, OwnershipStatus } from '@/domain/entities/Church';
import { ValidationError } from '@/domain/errors/DomainError';
import { makeCoordinates } from '@/domain/value-objects/Coordinates';
import { assertMasterAdmin, Principal } from '@/domain/policies/access';
import { isValidSlug, slugify } from '@/shared/slug';
import { randomUUID } from '@/shared/uuid';

export interface UpsertChurchInput {
  /** When undefined, creates a new church. */
  id?: string;
  slug?: string;
  name: string;
  description?: string;
  physicalAddress: string;
  city: string;
  country: string;
  /** When provided, used as-is. Otherwise the geocoder is consulted. */
  coords?: { lat: number; lng: number };
  social?: {
    youtubeUrl?: string;
    instagramUrl?: string;
    facebookUrl?: string;
    websiteUrl?: string;
  };
  pix?: { pixKey?: string; pixQrcodeImageUrl?: string };
  ownershipStatus?: OwnershipStatus;
}

export class UpsertChurch {
  constructor(
    private readonly churches: ChurchRepository,
    private readonly geocoder: Geocoder,
  ) {}

  /** Master-admin-only entry point. */
  async execute(principal: Principal | null, input: UpsertChurchInput): Promise<Church> {
    assertMasterAdmin(principal);

    if (!input.name.trim()) throw new ValidationError('Name is required.');
    if (!input.city.trim()) throw new ValidationError('City is required.');
    if (!input.country.trim()) throw new ValidationError('Country is required.');

    const slug = input.slug?.trim() || slugify(`${input.name} ${input.city}`);
    if (!isValidSlug(slug)) throw new ValidationError(`Invalid slug: ${slug}`);

    let coords = input.coords;
    if (!coords) {
      const geo = await this.geocoder.search(`${input.physicalAddress}, ${input.city}, ${input.country}`);
      if (geo) coords = { lat: geo.lat, lng: geo.lng };
    }

    const now = new Date();
    const existing = input.id ? await this.churches.findById(input.id) : null;
    const church: Church = {
      id: input.id ?? existing?.id ?? randomUUID(),
      slug,
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      physicalAddress: input.physicalAddress.trim(),
      city: input.city.trim(),
      country: input.country.trim(),
      coords: coords ? makeCoordinates(coords.lat, coords.lng) : undefined,
      social: {
        youtubeUrl: input.social?.youtubeUrl?.trim() || undefined,
        instagramUrl: input.social?.instagramUrl?.trim() || undefined,
        facebookUrl: input.social?.facebookUrl?.trim() || undefined,
        websiteUrl: input.social?.websiteUrl?.trim() || undefined,
      },
      pix: {
        pixKey: input.pix?.pixKey?.trim() || undefined,
        pixQrcodeImageUrl: input.pix?.pixQrcodeImageUrl?.trim() || undefined,
      },
      ownershipStatus: input.ownershipStatus ?? existing?.ownershipStatus ?? 'UNCLAIMED',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await this.churches.save(church);
    return church;
  }
}
