export interface GeocodeResult {
  lat: number;
  lng: number;
  /** The provider's normalized full address for the match. */
  formattedAddress: string;
}

export interface Geocoder {
  /**
   * Forward geocode a free-text address. Returns null if no match found.
   * Implementations are expected to enforce per-provider fair-use limits.
   */
  search(query: string): Promise<GeocodeResult | null>;
}
