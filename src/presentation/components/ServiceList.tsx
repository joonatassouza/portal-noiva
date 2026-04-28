import { useTranslations } from 'next-intl';
import { Service } from '@/domain/entities/Service';
import { Badge } from '@/presentation/components/ui/Badge';
import { EmptyState } from '@/presentation/components/ui/EmptyState';

interface ServiceListProps {
  services: Service[];
}

/**
 * Renders a church's recurring schedule.
 * Translation keys consumed:
 *   days.0..6, schedule.weekly, schedule.monthlyNth, schedule.monthlyLast,
 *   schedule.exceptions, church.live, church.noServices
 */
export function ServiceList({ services }: ServiceListProps) {
  const t = useTranslations();

  if (services.length === 0) {
    return <EmptyState title={t('church.noServices')} />;
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
      {services.map((s) => (
        <li
          key={s.id}
          className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4"
        >
          <div>
            <p className="font-medium text-ink">{s.label}</p>
            <p className="text-sm text-muted">{describeRecurrence(s, t)}</p>
            {s.exceptions && s.exceptions.length > 0 && (
              <p className="mt-1 text-xs text-ink-soft">
                {t('schedule.exceptions', { count: s.exceptions.length })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-ink">
              {s.startTime}
              {s.endTime ? ` – ${s.endTime}` : ''}
            </span>
            {s.hasLiveStream && <Badge tone="gold">{t('church.live')}</Badge>}
          </div>
        </li>
      ))}
    </ul>
  );
}

type Translator = ReturnType<typeof useTranslations>;

function describeRecurrence(s: Service, t: Translator): string {
  const day = t(`days.${s.recurrence.dayOfWeek}` as `days.0`);
  if (s.recurrence.kind === 'WEEKLY') {
    return t('schedule.weekly', { day });
  }
  if (s.recurrence.nth === -1) {
    return t('schedule.monthlyLast', { day });
  }
  return t('schedule.monthlyNth', { day, nth: s.recurrence.nth });
}
