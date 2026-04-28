import { Geocoder, GeocodeResult } from '@/application/ports/Geocoder';

/**
 * OpenStreetMap Nominatim adapter.
 *
 * IMPORTANT — fair-use policy:
 *  - Max 1 request per second.
 *  - Must include a meaningful User-Agent identifying the app + contact.
 *  - This file MUST only run on the server.
 *
 * The throttle below uses a tiny in-process queue. Good enough for a single
 * Vercel runtime instance handling admin/owner-form submissions. If we ever
 * scale to many concurrent runtimes, swap for a real provider (or self-host).
 */
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

let lastCallAt = 0;
async function throttle() {
  const now = Date.now();
  const wait = Math.max(0, 1000 - (now - lastCallAt));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCallAt = Date.now();
}

export class NominatimGeocoder implements Geocoder {
  constructor(
    private readonly userAgent = process.env.NOMINATIM_USER_AGENT ??
      'portal-noiva/0.1 (contato@portalnoiva.org)',
  ) {}

  async search(query: string): Promise<GeocodeResult | null> {
    if (!query.trim()) return null;
    await throttle();

    const url = new URL(`${NOMINATIM_BASE}/search`);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '1');
    url.searchParams.set('addressdetails', '0');

    const res = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
        'Accept-Language': 'pt-BR,es,en;q=0.8',
      },
      // Small server-side cache to absorb duplicate edits without re-hitting OSM.
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    const first = json[0];
    if (!first) return null;
    return {
      lat: Number(first.lat),
      lng: Number(first.lon),
      formattedAddress: first.display_name,
    };
  }
}
