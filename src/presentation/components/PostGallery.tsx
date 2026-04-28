'use client';

import { useState } from 'react';

import { Lightbox, type LightboxImage } from '@/presentation/components/ui/Lightbox';

interface PostGalleryProps {
  images: LightboxImage[];
  caption?: string;
}

/**
 * Image grid for a single media post that opens a fullscreen lightbox on
 * click. Lives in `presentation/components` (not `ui/`) because it depends
 * on the post's caption shape.
 */
export function PostGallery({ images, caption }: PostGalleryProps) {
  const [openAt, setOpenAt] = useState<number | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <ul className="grid gap-2 sm:grid-cols-2">
        {images.map((img, i) => (
          <li key={img.url} className="overflow-hidden rounded-md border border-border bg-bg">
            <button
              type="button"
              onClick={() => setOpenAt(i)}
              className="block h-full w-full"
              aria-label={img.alt ?? `${caption ?? 'imagem'} ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.alt ?? `${caption ?? 'imagem'} ${i + 1}`}
                className="h-full w-full cursor-zoom-in object-cover transition hover:opacity-90"
                loading="lazy"
              />
            </button>
          </li>
        ))}
      </ul>

      <Lightbox
        images={images}
        initialIndex={openAt ?? 0}
        open={openAt !== null}
        onClose={() => setOpenAt(null)}
      />
    </>
  );
}
