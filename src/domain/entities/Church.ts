import { Coordinates } from '@/domain/value-objects/Coordinates';

export type OwnershipStatus = 'UNCLAIMED' | 'PENDING_REVIEW' | 'CLAIMED';

export interface ChurchSocial {
  youtubeUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  websiteUrl?: string;
}

export interface ChurchPix {
  /** Apenas informativo — exibido para visitantes que queiram doar; sistema não transaciona. */
  pixKey?: string;
  pixQrcodeImageUrl?: string;
}

export interface Church {
  id: string;
  slug: string;
  name: string;
  description?: string;
  physicalAddress: string;
  city: string;
  country: string;
  coords?: Coordinates;
  social: ChurchSocial;
  pix: ChurchPix;
  ownershipStatus: OwnershipStatus;
  createdAt: Date;
  updatedAt: Date;
}
