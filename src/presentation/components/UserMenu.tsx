'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { signOut } from 'next-auth/react';

import { cx } from '@/presentation/components/ui/cx';

interface UserMenuProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
  locale: string;
  isMasterAdmin?: boolean;
}

/**
 * Avatar + dropdown for the logged-in user.
 * Pure CSS toggle would be simpler, but the dropdown closes on outside click,
 * so we do it on the client.
 */
export function UserMenu({ user, locale, isMasterAdmin }: UserMenuProps) {
  const t = useTranslations('auth');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const initials = (user.name ?? user.email ?? '?').slice(0, 1).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-surface text-ink hover:border-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('account')}
      >
        {user.image ? (
          <Image src={user.image} alt="" width={36} height={36} className="h-9 w-9 object-cover" />
        ) : (
          <span className="font-medium">{initials}</span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={cx(
            'absolute right-0 z-50 mt-2 w-60 rounded-lg border border-border bg-bg p-1 shadow-md',
          )}
        >
          <div className="px-3 py-2 text-sm">
            <p className="truncate font-medium text-ink">{user.name ?? user.email}</p>
            {user.email && <p className="truncate text-xs text-muted">{user.email}</p>}
          </div>
          <div className="my-1 border-t border-border" />
          <Link
            href={`/${locale}/meu-painel`}
            role="menuitem"
            className="block rounded-md px-3 py-2 text-sm text-ink hover:bg-surface hover:no-underline"
            onClick={() => setOpen(false)}
          >
            {t('myDashboard')}
          </Link>
          <Link
            href={`/${locale}/meu-painel/perfil`}
            role="menuitem"
            className="block rounded-md px-3 py-2 text-sm text-ink hover:bg-surface hover:no-underline"
            onClick={() => setOpen(false)}
          >
            {t('myProfile')}
          </Link>
          {isMasterAdmin && (
            <Link
              href={`/${locale}/admin`}
              role="menuitem"
              className="block rounded-md px-3 py-2 text-sm text-ink hover:bg-surface hover:no-underline"
              onClick={() => setOpen(false)}
            >
              {t('masterAdmin')}
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => signOut({ callbackUrl: `/${locale}` })}
            className="block w-full rounded-md px-3 py-2 text-left text-sm text-ink hover:bg-surface"
          >
            {t('signOut')}
          </button>
        </div>
      )}
    </div>
  );
}
