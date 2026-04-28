'use client';

import { useMemo, useState, useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';

import type { Service } from '@/domain/entities/Service';
import {
  addDays,
  startOfDay,
  toLocalDateKey,
} from '@/shared/dates';
import { computeRuleCancelled, recurrenceDates } from '@/shared/recurrence';
import { toggleServiceExceptionAction } from '@/app/_actions/owner';
import { cx } from '@/presentation/components/ui/cx';

interface ServiceOccurrencesProps {
  service: Service;
  /** Other services in the same church — needed to evaluate cancel rules. */
  peers: Service[];
  locale: string;
  churchSlug: string;
  /** How many weeks ahead to enumerate. */
  weeksAhead?: number;
}

/**
 * 12-week schedule preview with click-to-cancel for manual exceptions.
 *
 * Rule-driven auto-cancellations render in a different color and are NOT
 * toggleable — to remove them, the owner must edit the trigger service or
 * delete the cancel rule itself.
 */
export function ServiceOccurrences({
  service,
  peers,
  locale,
  churchSlug,
  weeksAhead = 12,
}: ServiceOccurrencesProps) {
  const t = useTranslations('panel.services.occurrences');
  const intlLocale = useLocale();
  const [pending, startTransition] = useTransition();
  const [optimisticManual, setOptimisticManual] = useState<Set<string>>(
    () => new Set(service.exceptions.filter((e) => e.kind === 'CANCEL').map((e) => e.date)),
  );

  const { dates, ruleCancelled } = useMemo(() => {
    const now = startOfDay(new Date());
    const until = addDays(now, weeksAhead * 7);
    const dates = Array.from(recurrenceDates(service, now, until)).map((d) => ({
      date: d,
      key: toLocalDateKey(d),
    }));
    const peerById = new Map(peers.map((p) => [p.id, p]));
    const cancelMap = computeRuleCancelled(service, peerById, now, until).byDate;
    return { dates, ruleCancelled: cancelMap };
  }, [service, peers, weeksAhead]);

  function toggle(dateKey: string) {
    if (ruleCancelled.has(dateKey)) return; // not toggleable
    setOptimisticManual((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) next.delete(dateKey);
      else next.add(dateKey);
      return next;
    });
    startTransition(async () => {
      try {
        await toggleServiceExceptionAction({
          serviceId: service.id,
          churchId: service.churchId,
          date: dateKey,
          locale,
          churchSlug,
        });
      } catch {
        setOptimisticManual((prev) => {
          const next = new Set(prev);
          if (next.has(dateKey)) next.delete(dateKey);
          else next.add(dateKey);
          return next;
        });
      }
    });
  }

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-ink-soft">
        {t('title')}
      </p>
      <p className="mt-1 text-xs text-muted">{t('hint')}</p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {dates.map(({ date, key }) => {
          const isAuto = ruleCancelled.has(key);
          const autoReason = ruleCancelled.get(key);
          const isManual = optimisticManual.has(key);
          const cancelled = isAuto || isManual;
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => toggle(key)}
                disabled={pending || isAuto}
                title={isAuto ? autoReason ?? t('autoCancelledTooltip') : undefined}
                className={cx(
                  'flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition',
                  isAuto
                    ? 'cursor-not-allowed border-gold bg-gold/10 text-ink-soft'
                    : isManual
                      ? 'border-danger bg-danger/10 text-danger line-through'
                      : 'border-border bg-bg text-ink hover:border-gold',
                )}
              >
                <span>{formatDate(date, intlLocale)}</span>
                <span className="ml-2 text-xs">
                  {isAuto
                    ? t('autoCancelled')
                    : isManual
                      ? t('cancelled')
                      : t('toggleCancel')}
                </span>
              </button>
              {isAuto && autoReason && (
                <p className="mt-0.5 px-1 text-[11px] text-ink-soft">{autoReason}</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function formatDate(d: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(d);
}
