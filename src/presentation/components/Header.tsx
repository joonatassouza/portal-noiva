import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { auth } from '@/auth';
import { container } from '@/infrastructure/di/container';

import { Logo } from './Logo';
import { SignInButton } from './SignInButton';
import { UserMenu } from './UserMenu';
import { NotificationBell } from './NotificationBell';

interface HeaderProps {
  locale: string;
}

/**
 * Server-rendered header. Reads the auth session AND, when logged in, the
 * initial notifications snapshot so the bell renders with state already.
 */
export async function Header({ locale }: HeaderProps) {
  const [t, session] = await Promise.all([getTranslations('nav'), auth()]);

  let initialNotifications: { unreadCount: number; items: Awaited<ReturnType<typeof container.notifications.listByUser>> } | null = null;
  if (session?.user?.id) {
    const [items, unreadCount] = await Promise.all([
      container.notifications.listByUser(session.user.id, 30),
      container.notifications.countUnreadByUser(session.user.id),
    ]);
    initialNotifications = { unreadCount, items };
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur">
      <div className="container-page flex h-14 items-center justify-between gap-4 sm:h-16">
        <Link href={`/${locale}`} className="flex items-center hover:no-underline">
          <Logo size={32} showWordmark={false} className="sm:hidden" />
          <Logo size={36} showWordmark className="hidden sm:inline-flex" />
        </Link>
        <nav className="flex items-center gap-3 text-sm sm:gap-5">
          <Link href={`/${locale}/igrejas`} className="text-ink hover:text-gold">
            {t('churches')}
          </Link>
          <Link href={`/${locale}/mapa`} className="text-ink hover:text-gold">
            {t('map')}
          </Link>
          {session?.user && initialNotifications && (
            <NotificationBell
              initialUnread={initialNotifications.unreadCount}
              initialItems={initialNotifications.items}
            />
          )}
          {session?.user ? (
            <UserMenu
              user={session.user}
              locale={locale}
              isMasterAdmin={session.user.isMasterAdmin}
            />
          ) : (
            <SignInButton />
          )}
        </nav>
      </div>
    </header>
  );
}
