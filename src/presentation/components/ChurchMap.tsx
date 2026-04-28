'use client';

import { useEffect, useRef } from 'react';
import L, { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import type { MapPin } from '@/application/use-cases/ListMapPins';

interface ChurchMapProps {
  pins: MapPin[];
  locale: string;
  /** Initial center if no pins are present. Default: world centroid-ish. */
  fallbackCenter?: [number, number];
  fallbackZoom?: number;
}

/**
 * Leaflet + OpenStreetMap global map of churches.
 * Mobile-friendly: no scroll-zoom on touch (use pinch), tap-to-pop-up.
 */
export function ChurchMap({
  pins,
  locale,
  fallbackCenter = [-15, -55], // South America-ish for our primary audience
  fallbackZoom = 3,
}: ChurchMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: fallbackCenter,
      zoom: fallbackZoom,
      scrollWheelZoom: true,
      worldCopyJump: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Compact custom marker — token-driven via an SVG data URI.
    const icon = L.divIcon({
      className: 'pn-pin',
      html: `<span style="
        display:inline-block;width:14px;height:14px;border-radius:50%;
        background:var(--color-gold);border:2px solid var(--color-ink);
        box-shadow:0 0 0 2px rgba(255,255,255,0.85);
      "></span>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    const markers: L.Marker[] = [];
    for (const pin of pins) {
      const marker = L.marker([pin.lat, pin.lng], { icon }).addTo(map);
      const popupHtml = `
        <strong style="font-family:var(--font-serif);font-size:15px;color:var(--color-ink);">
          ${escapeHtml(pin.name)}
        </strong><br/>
        <span style="font-size:12px;color:var(--color-muted);">
          ${escapeHtml(pin.city)} · ${escapeHtml(pin.country)}
        </span><br/>
        <a href="/${locale}/igreja/${pin.slug}"
           style="font-size:12px;color:var(--color-ink);text-decoration:underline;">
          Abrir página da igreja
        </a>`;
      marker.bindPopup(popupHtml);
      markers.push(marker);
    }

    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.2), { maxZoom: 8 });
    }

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [pins, locale, fallbackCenter, fallbackZoom]);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Map of churches"
      className="h-[60vh] min-h-[420px] w-full overflow-hidden rounded-lg border border-border"
    />
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
