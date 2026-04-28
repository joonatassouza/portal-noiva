'use client';

import { useTransition, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';

import type {
  VolunteerApplication,
  VolunteerStatus,
} from '@/domain/entities/VolunteerApplication';

import { Card } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';
import { Button } from '@/presentation/components/ui/Button';
import { Select } from '@/presentation/components/ui/Select';
import { EmptyState } from '@/presentation/components/ui/EmptyState';
import { updateVolunteerStatusAction } from '@/app/_actions/volunteers';

interface VolunteersPanelProps {
  locale: string;
  churchSlug: string;
  applications: Array<{ application: VolunteerApplication; eventTitle: string }>;
}

const STATUS_TONE: Record<VolunteerStatus, 'gold' | 'success' | 'danger' | 'neutral'> = {
  SUBMITTED: 'gold',
  CONTACTED: 'neutral',
  ACCEPTED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
};

export function VolunteersPanel({ locale, churchSlug, applications }: VolunteersPanelProps) {
  const t = useTranslations('panel.volunteers');
  const intlLocale = useLocale();

  if (applications.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="font-serif text-xl text-ink">{t('title')}</h2>
        <EmptyState title={t('empty.title')} description={t('empty.description')} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-xl text-ink">{t('title')}</h2>
      <ul className="space-y-3">
        {applications.map(({ application: a, eventTitle }) => (
          <li key={a.id}>
            <Card pad="md" className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{a.applicantName ?? a.applicantEmail}</p>
                  <p className="text-xs text-muted">{a.applicantEmail}</p>
                  {a.applicantWhatsapp && (
                    <a
                      href={`https://wa.me/${a.applicantWhatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block font-mono text-xs text-success hover:underline"
                    >
                      📱 {a.applicantWhatsapp}
                    </a>
                  )}
                  <p className="mt-2 text-sm text-ink">{a.offeredRole}</p>
                  <p className="text-xs text-ink-soft">{eventTitle}</p>
                  {a.coverMessage && (
                    <p className="mt-2 max-w-prose whitespace-pre-wrap text-sm text-ink-soft">
                      {a.coverMessage}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted">
                    {new Date(a.createdAt).toLocaleString(intlLocale)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge tone={STATUS_TONE[a.status]}>{t(`status.${a.status}` as 'status.SUBMITTED')}</Badge>
                  <StatusEditor
                    applicationId={a.id}
                    initialStatus={a.status}
                    locale={locale}
                    churchSlug={churchSlug}
                  />
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusEditor({
  applicationId,
  initialStatus,
  locale,
  churchSlug,
}: {
  applicationId: string;
  initialStatus: VolunteerStatus;
  locale: string;
  churchSlug: string;
}) {
  const t = useTranslations('panel.volunteers');
  const [status, setStatus] = useState<VolunteerStatus>(initialStatus);
  const [notes, setNotes] = useState('');
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function onApply() {
    startTransition(async () => {
      await updateVolunteerStatusAction({
        applicationId,
        status,
        notes: notes || undefined,
        locale,
        churchSlug,
      });
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Select value={status} onChange={(e) => setStatus(e.target.value as VolunteerStatus)}>
        <option value="SUBMITTED">{t('status.SUBMITTED')}</option>
        <option value="CONTACTED">{t('status.CONTACTED')}</option>
        <option value="ACCEPTED">{t('status.ACCEPTED')}</option>
        <option value="REJECTED">{t('status.REJECTED')}</option>
      </Select>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        className="w-60 rounded-md border border-border bg-bg p-2 text-sm text-ink"
        placeholder={t('notesPlaceholder')}
      />
      <Button onClick={onApply} variant="secondary" size="sm" disabled={pending}>
        {done ? t('saved') : pending ? t('saving') : t('apply')}
      </Button>
    </div>
  );
}
