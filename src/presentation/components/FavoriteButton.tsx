'use client';

import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';
import { useState, useTransition } from 'react';

import { toggleFavoriteAction } from '@/app/_actions/favorites';
import { cx } from '@/presentation/components/ui/cx';

interface FavoriteButtonProps {
  churchId: string;
  initialFavorited: boolean;
  /** Whether the visitor is logged in. When false the click triggers sign-in. */
  isAuthenticated: boolean;
  /** Visual size. */
  size?: 'sm' | 'md';
  /** Optional callback URL to land on after Google round-trip. */
  callbackUrl?: string;
}

/**
 * Heart-toggle for favoriting a church.
 *
 * Optimistic: the icon flips immediately, then the server action confirms.
 * If the user isn't logged in, clicking starts the OAuth flow with a
 * callbackUrl so they land back where they were.
 */
export function FavoriteButton({
  churchId,
  initialFavorited,
  isAuthenticated,
  size = 'md',
  callbackUrl,
}: FavoriteButtonProps) {
  const t = useTranslations('auth');
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!isAuthenticated) {
      signIn('google', { callbackUrl });
      return;
    }
    setFavorited((prev) => !prev); // optimistic
    startTransition(async () => {
      const result = await toggleFavoriteAction(churchId);
      if (result.requiresLogin) {
        setFavorited(false);
        signIn('google', { callbackUrl });
        return;
      }
      setFavorited(result.favorited);
    });
  }

  const dim = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const icon = size === 'sm' ? 16 : 20;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={favorited}
      aria-label={favorited ? t('unfavorite') : t('favorite')}
      title={isAuthenticated ? undefined : t('loginPrompt')}
      disabled={pending}
      className={cx(
        'inline-flex items-center justify-center rounded-full border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40',
        dim,
        favorited
          ? 'border-gold bg-gold/15 text-gold'
          : 'border-border bg-bg text-ink-soft hover:border-gold hover:text-gold',
        pending && 'opacity-60',
      )}
    >
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 24 24"
        fill={favorited ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
