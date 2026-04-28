import { useTranslations, useLocale } from 'next-intl';

import { Event } from '@/domain/entities/Event';
import { VolunteerApplication } from '@/domain/entities/VolunteerApplication';
import { Badge } from '@/presentation/components/ui/Badge';
import { EmptyState } from '@/presentation/components/ui/EmptyState';
import { VolunteerForm } from './VolunteerForm';

interface EventListProps {
  events: Event[];
  /** Slug of the church owning these events — used in callback URLs. */
  churchSlug: string;
  locale: string;
  isAuthenticated: boolean;
  /** Map of eventId -> the user's existing application (any status). */
  applicationsByEventId?: Map<string, VolunteerApplication>;
  /** Pre-fill WhatsApp from the user's profile. */
  defaultWhatsapp?: string;
}

export function EventList({
  events,
  churchSlug,
  locale,
  isAuthenticated,
  applicationsByEventId,
  defaultWhatsapp,
}: EventListProps) {
  const t = useTranslations();
  const intlLocale = useLocale();

  if (events.length === 0) {
    return <EmptyState title={t('church.noEvents')} />;
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
      {events.map((ev) => (
        <li key={ev.id} className="flex flex-col gap-2 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium text-ink">{ev.title}</p>
            <span className="font-mono text-sm text-ink whitespace-nowrap">
              {formatDateTime(new Date(ev.startDatetime), intlLocale)}
            </span>
          </div>
          {ev.description && <p className="text-sm text-ink-soft">{ev.description}</p>}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            {ev.eventLocation && <span>{ev.eventLocation}</span>}
            {ev.acceptingVolunteers && <Badge tone="gold">{t('upcoming.volunteers')}</Badge>}
          </div>
          {ev.acceptingVolunteers && (
            <div className="mt-2">
              <VolunteerForm
                eventId={ev.id}
                isAuthenticated={isAuthenticated}
                existing={applicationsByEventId?.get(ev.id) ?? null}
                defaultWhatsapp={defaultWhatsapp}
                callbackUrl={`/${locale}/igreja/${churchSlug}`}
                locale={locale}
                churchSlug={churchSlug}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function formatDateTime(d: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}
