'use client';

import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';

import { Button } from '@/presentation/components/ui/Button';

interface SignInButtonProps {
  /** Optional URL to land on after the OAuth round-trip. */
  callbackUrl?: string;
  size?: 'sm' | 'md';
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function SignInButton({ callbackUrl, size = 'sm', variant = 'secondary' }: SignInButtonProps) {
  const t = useTranslations('auth');
  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={() => signIn('google', { callbackUrl })}
    >
      {t('signIn')}
    </Button>
  );
}
