'use client';

import dynamic from 'next/dynamic';

import type { MapPin } from '@/application/use-cases/ListMapPins';

// Leaflet touches `window`, so the map has to be a client-only island.
// `ssr: false` is only allowed in Client Components in Next.js 15.
const ChurchMap = dynamic(
  () => import('@/presentation/components/ChurchMap').then((m) => m.ChurchMap),
  {
    ssr: false,
    loading: () => <div className="h-[60vh] w-full animate-pulse rounded-lg bg-surface" />,
  },
);

interface ChurchMapLoaderProps {
  pins: MapPin[];
  locale: string;
}

export function ChurchMapLoader({ pins, locale }: ChurchMapLoaderProps) {
  return <ChurchMap pins={pins} locale={locale} />;
}
