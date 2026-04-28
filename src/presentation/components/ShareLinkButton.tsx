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

  return (
    <Button type="button" variant="secondary" size="sm" onClick={onCopy}>
      {copied ? t('copied') : t('button')}
    </Button>
  );
}
