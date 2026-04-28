'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';

import type { VolunteerApplication } from '@/domain/entities/VolunteerApplication';

import { Button } from '@/presentation/components/ui/Button';
import { Input } from '@/presentation/components/ui/Input';
import { Card } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';
import {
  applyAsVolunteerAction,
  cancelMyVolunteerApplicationAction,
  updateMyVolunteerApplicationAction,
} from '@/app/_actions/volunteers';

interface VolunteerFormProps {
  eventId: string;
  isAuthenticated: boolean;
  existing: VolunteerApplication | null;
  /** Pre-fill the WhatsApp field from the user's profile when applying. */
  defaultWhatsapp?: string;
  callbackUrl: string;
  locale: string;
  churchSlug: string;
}

const STATUS_TONE: Record<string, 'gold' | 'success' | 'danger' | 'neutral'> = {
  SUBMITTED: 'gold',
  CONTACTED: 'neutral',
  ACCEPTED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
};

export function VolunteerForm({
  eventId,
  isAuthenticated,
  existing,
  defaultWhatsapp,
  callbackUrl,
  locale,
  churchSlug,
}: VolunteerFormProps) {
  const t = useTranslations('volunteer');

  // Logged-out: prompt to sign in.
  if (!isAuthenticated) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-ink-soft">{t('loginRequired')}</p>
        <Button onClick={() => signIn('google', { callbackUrl })} variant="secondary" size="sm">
          {t('signIn')}
        </Button>
      </div>
    );
  }

  // Has an active application — show summary + edit/cancel.
  if (existing && existing.status !== 'CANCELLED') {
    return (
      <ExistingApplication
        application={existing}
        locale={locale}
        churchSlug={churchSlug}
      />
    );
  }

  // No active application (either none ever, or cancelled). Show the form.
  return (
    <NewApplication
      eventId={eventId}
      defaultWhatsapp={defaultWhatsapp ?? existing?.applicantWhatsapp}
      defaultName={existing?.applicantName}
      locale={locale}
      churchSlug={churchSlug}
      cancelledHint={existing?.status === 'CANCELLED'}
    />
  );
}

function NewApplication({
  eventId,
  defaultWhatsapp,
  defaultName,
  locale,
  churchSlug,
  cancelledHint,
}: {
  eventId: string;
  defaultWhatsapp?: string;
  defaultName?: string;
  locale: string;
  churchSlug: string;
  cancelledHint: boolean;
}) {
  const t = useTranslations('volunteer');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName ?? '');
  const [offeredRole, setOfferedRole] = useState('');
  const [coverMessage, setCoverMessage] = useState('');
  const [whatsapp, setWhatsapp] = useState(defaultWhatsapp ?? '');
  const [shareWhatsapp, setShareWhatsapp] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        {cancelledHint && (
          <Badge tone="neutral">{t('previouslyCancelled')}</Badge>
        )}
        <Button onClick={() => setOpen(true)} variant="primary" size="sm">
          {t('cta')}
        </Button>
      </div>
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await applyAsVolunteerAction({
          eventId,
          offeredRole,
          coverMessage: coverMessage || undefined,
          applicantName: name || undefined,
          applicantWhatsapp: shareWhatsapp ? whatsapp : '',
          locale,
          churchSlug,
        });
        setOpen(false);
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <Card pad="md" className="max-w-xl">
      <form onSubmit={onSubmit} className="space-y-3">
        <Field label={t('name')}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('namePlaceholder')} />
        </Field>
        <Field label={t('role')}>
          <Input
            required
            value={offeredRole}
            onChange={(e) => setOfferedRole(e.target.value)}
            placeholder={t('rolePlaceholder')}
          />
        </Field>
        <Field label={t('message')}>
          <textarea
            value={coverMessage}
            onChange={(e) => setCoverMessage(e.target.value)}
            rows={3}
            className="block w-full rounded-md border border-border bg-bg p-3 text-sm text-ink"
            placeholder={t('messagePlaceholder')}
          />
        </Field>
        <Field label={t('whatsapp')}>
          <Input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+55 41 99999-9999"
            disabled={!shareWhatsapp}
          />
          <label className="mt-1 flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={shareWhatsapp}
              onChange={(e) => setShareWhatsapp(e.target.checked)}
            />
            {t('whatsappShare')}
          </label>
        </Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" variant="primary" size="sm" disabled={pending}>
            {pending ? t('submitting') : t('submit')}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
            {t('cancel')}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function ExistingApplication({
  application,
  locale,
  churchSlug,
}: {
  application: VolunteerApplication;
  locale: string;
  churchSlug: string;
}) {
  const t = useTranslations('volunteer');
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(application.applicantName ?? '');
  const [offeredRole, setOfferedRole] = useState(application.offeredRole);
  const [coverMessage, setCoverMessage] = useState(application.coverMessage ?? '');
  const [whatsapp, setWhatsapp] = useState(application.applicantWhatsapp ?? '');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const locked = application.status === 'ACCEPTED' || application.status === 'REJECTED';

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await updateMyVolunteerApplicationAction({
          applicationId: application.id,
          offeredRole,
          coverMessage: coverMessage,
          applicantName: name,
          applicantWhatsapp: whatsapp,
          locale,
          churchSlug,
        });
        setEditing(false);
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  function onCancel() {
    if (!window.confirm(t('confirmCancel'))) return;
    startTransition(async () => {
      try {
        await cancelMyVolunteerApplicationAction({
          applicationId: application.id,
          locale,
          churchSlug,
        });
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <Card pad="md" className="max-w-xl space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Badge tone={STATUS_TONE[application.status] ?? 'neutral'}>
          {t(`status.${application.status}` as 'status.SUBMITTED')}
        </Badge>
        {!locked && !editing && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              {t('edit')}
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={pending}>
              {t('cancelMy')}
            </Button>
          </div>
        )}
      </div>

      {!editing && (
        <>
          <p className="text-sm font-medium text-ink">{application.offeredRole}</p>
          {application.coverMessage && (
            <p className="whitespace-pre-wrap text-sm text-ink-soft">{application.coverMessage}</p>
          )}
          {application.applicantWhatsapp && (
            <p className="text-xs text-muted">
              {t('whatsappShared')}
            </p>
          )}
          {locked && <p className="text-xs text-muted">{t('lockedHint')}</p>}
        </>
      )}

      {editing && (
        <form onSubmit={onSave} className="space-y-3">
          <Field label={t('name')}>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label={t('role')}>
            <Input
              required
              value={offeredRole}
              onChange={(e) => setOfferedRole(e.target.value)}
            />
          </Field>
          <Field label={t('message')}>
            <textarea
              value={coverMessage}
              onChange={(e) => setCoverMessage(e.target.value)}
              rows={3}
              className="block w-full rounded-md border border-border bg-bg p-3 text-sm text-ink"
            />
          </Field>
          <Field label={t('whatsapp')}>
            <Input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          </Field>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm" disabled={pending}>
              {pending ? t('submitting') : t('save')}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
              {t('cancel')}
            </Button>
          </div>
        </form>
      )}

      {!editing && error && <p className="text-sm text-danger">{error}</p>}
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-soft">
        {label}
      </span>
      {children}
    </label>
  );
}
