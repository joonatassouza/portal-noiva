'use client';

import { useState, useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';

import type { Church } from '@/domain/entities/Church';
import type { Event } from '@/domain/entities/Event';

import { Card } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Input } from '@/presentation/components/ui/Input';
import { Badge } from '@/presentation/components/ui/Badge';
import { deleteEventAction, saveEventAction } from '@/app/_actions/owner';

interface EventsPanelProps {
  locale: string;
  church: Church;
  events: Event[];
}

export function EventsPanel({ locale, church, events }: EventsPanelProps) {
  const t = useTranslations('panel.events');
  const [editing, setEditing] = useState<Event | null>(null);
  const [creating, setCreating] = useState(false);
  const intlLocale = useLocale();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl text-ink">{t('title')}</h2>
        {!creating && !editing && (
          <Button onClick={() => setCreating(true)} variant="primary" size="sm">
            {t('new')}
          </Button>
        )}
      </div>

      {creating && (
        <EventForm
          locale={locale}
          church={church}
          onCancel={() => setCreating(false)}
          onSaved={() => setCreating(false)}
        />
      )}

      <ul className="space-y-3">
        {events.map((ev) => (
          <li key={ev.id}>
            {editing?.id === ev.id ? (
              <EventForm
                locale={locale}
                church={church}
                initial={ev}
                onCancel={() => setEditing(null)}
                onSaved={() => setEditing(null)}
              />
            ) : (
              <Card pad="md" className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{ev.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-gold">
                    {formatDateTime(new Date(ev.startDatetime), intlLocale)}
                  </p>
                  {ev.description && (
                    <p className="mt-2 max-w-md text-sm text-ink-soft">{ev.description}</p>
                  )}
                  {ev.acceptingVolunteers && (
                    <div className="mt-2">
                      <Badge tone="gold">{t('acceptingVolunteers')}</Badge>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => setEditing(ev)} variant="secondary" size="sm">
                    {t('edit')}
                  </Button>
                  <DeleteButton
                    onConfirm={async () => {
                      await deleteEventAction({
                        eventId: ev.id,
                        locale,
                        churchSlug: church.slug,
                      });
                    }}
                  />
                </div>
              </Card>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface EventFormProps {
  locale: string;
  church: Church;
  initial?: Event;
  onCancel: () => void;
  onSaved: () => void;
}

function EventForm({ locale, church, initial, onCancel, onSaved }: EventFormProps) {
  const t = useTranslations('panel.events.form');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [startAt, setStartAt] = useState(toLocalInput(initial?.startDatetime ?? new Date()));
  const [endAt, setEndAt] = useState(initial?.endDatetime ? toLocalInput(initial.endDatetime) : '');
  const [eventLocation, setEventLocation] = useState(initial?.eventLocation ?? '');
  const [acceptingVolunteers, setAcceptingVolunteers] = useState(
    Boolean(initial?.acceptingVolunteers),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await saveEventAction(
          {
            id: initial?.id,
            churchId: church.id,
            slug: initial?.slug,
            title,
            description: description || undefined,
            startDatetime: new Date(startAt).toISOString(),
            endDatetime: endAt ? new Date(endAt).toISOString() : undefined,
            eventLocation: eventLocation || undefined,
            acceptingVolunteers,
          },
          locale,
          church.slug,
        );
        onSaved();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <Card pad="md">
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-soft">
            {t('title')}
          </span>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-soft">
            {t('description')}
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="block w-full rounded-md border border-border bg-bg p-3 text-sm text-ink"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-soft">
              {t('startDatetime')}
            </span>
            <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-soft">
              {t('endDatetime')}
            </span>
            <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-soft">
            {t('location')}
          </span>
          <Input value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={acceptingVolunteers}
            onChange={(e) => setAcceptingVolunteers(e.target.checked)}
          />
          {t('acceptingVolunteers')}
        </label>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex gap-3">
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? t('saving') : t('save')}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t('cancel')}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function DeleteButton({ onConfirm }: { onConfirm: () => Promise<void> }) {
  const t = useTranslations('panel.events');
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={async () => {
        if (window.confirm(t('confirmDelete'))) await onConfirm();
      }}
    >
      {t('delete')}
    </Button>
  );
}

function toLocalInput(d: Date): string {
  // Format to "YYYY-MM-DDTHH:mm" in local TZ for <input type="datetime-local">
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateTime(d: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}
