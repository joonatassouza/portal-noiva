import { ChurchRepository } from '@/application/ports/ChurchRepository';
import { Church } from '@/domain/entities/Church';

export interface MapPin {
  id: string;
  slug: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
}

/**
 * Returns the lightweight projection needed by the global map page —
 * only churches with coordinates and only the fields the marker pop-up needs.
 */
export class ListMapPins {
  constructor(private readonly churches: ChurchRepository) {}

  async execute(): Promise<MapPin[]> {
    // 5k cap is safe and fits the global Mensagem footprint for the foreseeable future.
    const items = await this.churches.list({ limit: 5000 });
    return items
      .filter((c): c is Church & { coords: NonNullable<Church['coords']> } => Boolean(c.coords))
      .map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        city: c.city,
        country: c.country,
        lat: c.coords.lat,
        lng: c.coords.lng,
      }));
  }
}
