'use client';

import { toExternalHref } from '@/shared/url';

interface WatchLiveLinkProps {
  /** Raw YouTube URL — may be missing scheme. */
  youtubeUrl: string;
  label: string;
}

/**
 * Inline pill-style link that points to a church's YouTube channel.
 * Stops link propagation so a click inside a feed card opens YouTube
 * instead of navigating to the church page.
 */
export function WatchLiveLink({ youtubeUrl, label }: WatchLiveLinkProps) {
  const href = toExternalHref(youtubeUrl);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 rounded-full border border-danger/30 bg-danger/5 px-2.5 py-1 text-xs font-medium text-danger transition hover:bg-danger/10"
    >
      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
        <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3L10 15z" />
      </svg>
      {label}
    </a>
  );
}
