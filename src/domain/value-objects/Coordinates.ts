import { ValidationError } from '@/domain/errors/DomainError';

export type Coordinates = Readonly<{ lat: number; lng: number }>;

export function makeCoordinates(lat: number, lng: number): Coordinates {
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    throw new ValidationError('Coordinates must be numbers.');
  }
  if (lat < -90 || lat > 90) throw new ValidationError(`Latitude out of range: ${lat}`);
  if (lng < -180 || lng > 180) throw new ValidationError(`Longitude out of range: ${lng}`);
  return Object.freeze({ lat, lng });
}

const EARTH_RADIUS_KM = 6371;

/** Haversine distance in kilometers. Pure, dependency-free. */
export function haversineKm(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}
