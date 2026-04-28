import { Church } from '@/domain/entities/Church';
import { Coordinates } from '@/domain/value-objects/Coordinates';

export interface ChurchListOptions {
  country?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface NearbyChurch extends Church {
  distanceKm: number;
}

/**
 * Port for accessing Church aggregates.
 * Adapters: MongoChurchRepository, SupabaseChurchRepository, ...
 */
export interface ChurchRepository {
  findBySlug(slug: string): Promise<Church | null>;
  findById(id: string): Promise<Church | null>;
  list(opts?: ChurchListOptions): Promise<Church[]>;
  findNearby(coords: Coordinates, radiusKm: number, limit?: number): Promise<NearbyChurch[]>;
  save(church: Church): Promise<void>;
  count(opts?: Pick<ChurchListOptions, 'country' | 'search'>): Promise<number>;
  /** Distinct list of countries with at least one church. Sorted ascending. */
  listCountries(): Promise<string[]>;
}
