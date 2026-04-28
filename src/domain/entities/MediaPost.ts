/**
 * Media post — anchored to a Church and OPTIONALLY to an Event.
 *
 * Two flavors:
 *  - ALBUM_LINK: a single external URL (Facebook album, Flickr, Instagram).
 *    The platform just renders thumbnail + title + redirect.
 *  - IMAGE_GALLERY: images stored on the church-owned S3 bucket. Uploaded
 *    directly from the browser with WebP compression (≤ 200KB each, ≤ 20).
 */
export type MediaPostType = 'ALBUM_LINK' | 'IMAGE_GALLERY';

export interface MediaImage {
  url: string;
  /** Optional aspect-ratio hint for layout (width/height). */
  aspectRatio?: number;
  /** Optional client-supplied alt text (≤ 140 chars). */
  alt?: string;
}

export interface MediaPost {
  id: string;
  /** Optional — posts can stand on their own. */
  eventId?: string;
  churchId: string;
  authorUserId: string;
  type: MediaPostType;
  /** When type === ALBUM_LINK. */
  externalUrl?: string;
  /** When type === IMAGE_GALLERY. */
  images: MediaImage[];
  caption?: string;
  createdAt: Date;
}
