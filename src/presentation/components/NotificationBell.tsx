'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

import type { Notification } from '@/domain/entities/Notification';
import { cx } from '@/presentation/components/ui/cx';
import {
  fetchNotificationsAction,
  markNotificationsReadAction,
} from '@/app/_actions/notifications';

const POLL_INTERVAL_MS = 60_000;

interface NotificationBellProps {
  initialUnread: number;
  initialItems: Notification[];
}

/**
 * Bell icon + dropdown of recent in-app notifications. Polls every 60s while
 * the tab is visible. Clicking the bell marks unread items as read.
 */
export function NotificationBell({ initialUnread, initialItems }: NotificationBellProps) {
  const t = useTranslations('notifications');
  const intlLocale = useLocale();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState<Notification[]>(initialItems);
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    async function tick() {
      if (document.hidden) {
        timer = setTimeout(tick, POLL_INTERVAL_MS);
        return;
      }
      try {
        const r = await fetchNotificationsAction();
        setUnread(r.unreadCount);
        setItems(r.items);
      } catch {
        // silent — polling is best-effort
      }
      timer = setTimeout(tick, POLL_INTERVAL_MS);
    }
    timer = setTimeout(tick, POLL_INTERVAL_MS);
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  function onToggle() {
    setOpen((v) => !v);
    if (!open && unread > 0) {
      // Optimistically mark as read on open.
      const ids = items.filter((i) => !i.readAt).map((i) => i.id);
      setUnread(0);
      setItems((prev) => prev.map((i) => (i.readAt ? i : { ...i, readAt: new Date() })));
      startTransition(async () => {
        await markNotificationsReadAction({ ids });
      });
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-ink hover:border-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
        aria-label={t('aria')}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10 21a2 2 0 0 0 4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-medium text-ink">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 max-h-96 w-80 overflow-y-auto rounded-lg border border-border bg-bg p-1 shadow-md"
        >
          {items.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted">{t('empty')}</p>
          ) : (
            <ul className="space-y-0.5">
              {items.map((n) => (
                <li key={n.id}>
                  <NotificationRow notification={n} locale={intlLocale} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// Notification types that should stand out visually in the dropdown.
const ALERT_TYPES = new Set(['MEDIA_POST_REPORT']);

function NotificationRow({ notification, locale }: { notification: Notification; locale: string }) {
  const isAlert = ALERT_TYPES.has(notification.type);
  const cls = cx(
    'flex flex-col gap-0.5 rounded-md px-3 py-2 hover:bg-surface',
    !notification.readAt && 'bg-surface',
    isAlert && 'border-l-2 border-danger pl-2',
  );
  const time = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(notification.createdAt));
  const inner = (
    <>
      <p className={cx('text-sm', isAlert ? 'text-danger' : 'text-ink')}>{notification.title}</p>
      {notification.body && <p className="text-xs text-ink-soft">{notification.body}</p>}
      <p className="text-xs text-muted">{time}</p>
    </>
  );
  if (notification.href) {
    // Prefix the user's current locale onto internal app paths
    // ("/painel/foo" -> "/pt-BR/painel/foo"). External URLs go through unchanged.
    const target = notification.href.startsWith('/')
      ? `/${locale}${notification.href}`
      : notification.href;
    return (
      <Link href={target} className={cx(cls, 'hover:no-underline')}>
        {inner}
      </Link>
    );
  }
  return <div className={cls}>{inner}</div>;
}
