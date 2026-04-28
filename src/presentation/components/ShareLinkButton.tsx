'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/presentation/components/ui/Button';

interface ShareLinkButtonProps {
  /** Path on this site, e.g. `/pt-BR/igreja/.../post/123`. */
  path: string;
}

export function ShareLinkButton({ path }: ShareLinkButtonProps) {
  const t = useTranslations('post.share');
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_SITE_URL ?? '');
    const url = `${origin}${path}`;
    try {
      if (navigator.share) {
        await navigator.share({ url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // user cancelled or clipboard blocked — silently ignore
    }
  }

  const label = copied ? t('copied') : t('button');

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={onCopy}
      aria-label={label}
      title={label}
    >
      <span className="inline-flex items-center gap-1.5">
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        <span className="hidden sm:inline">{label}</span>
      </span>
    </Button>
  );
}
