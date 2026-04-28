'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import type { Service } from '@/domain/entities/Service';
import type { Church } from '@/domain/entities/Church';

import { Card } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Badge } from '@/presentation/components/ui/Badge';
import { ServiceForm } from './ServiceForm';
import { ServiceOccurrences } from './ServiceOccurrences';
import { deleteServiceAction } from '@/app/_actions/owner';

interface ServicesPanelProps {
  locale: string;
  church: Church;
  services: Service[];
}

export function ServicesPanel({ locale, church, services }: ServicesPanelProps) {
  const t = useTranslations('panel.services');
  const [editing, setEditing] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);

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
        <ServiceForm
          locale={locale}
          church={church}
          peers={services}
          onCancel={() => setCreating(false)}
          onSaved={() => setCreating(false)}
        />
      )}

      <ul className="space-y-3">
        {services.map((s) => (
          <li key={s.id}>
            {editing?.id === s.id ? (
              <ServiceForm
                locale={locale}
                church={church}
                initial={s}
                peers={services}
                onCancel={() => setEditing(null)}
                onSaved={() => setEditing(null)}
              />
            ) : (
              <Card pad="md" className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">{s.label}</p>
                    <p className="text-sm text-muted">{summarizeRecurrence(s, t)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-ink">
                      {s.startTime}
                      {s.endTime ? `–${s.endTime}` : ''}
                    </span>
                    {s.hasLiveStream && <Badge tone="gold">{t('live')}</Badge>}
                    <Button onClick={() => setEditing(s)} variant="secondary" size="sm">
                      {t('edit')}
                    </Button>
                    <DeleteButton
                      onConfirm={async () => {
                        await deleteServiceAction({
                          serviceId: s.id,
                          churchId: church.id,
                          locale,
                          churchSlug: church.slug,
                        });
                      }}
                    />
                  </div>
                </div>
                <ServiceOccurrences
                  locale={locale}
                  service={s}
                  churchSlug={church.slug}
                  peers={services}
                />
              </Card>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function summarizeRecurrence(s: Service, t: ReturnType<typeof useTranslations>): string {
  const day = t(`day.${s.recurrence.dayOfWeek}` as 'day.0');
  if (s.recurrence.kind === 'WEEKLY') return t('summary.weekly', { day });
  if (s.recurrence.nth === -1) return t('summary.monthlyLast', { day });
  return t('summary.monthlyNth', { nth: s.recurrence.nth, day });
}

function DeleteButton({ onConfirm }: { onConfirm: () => Promise<void> }) {
  const t = useTranslations('panel.services');
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
