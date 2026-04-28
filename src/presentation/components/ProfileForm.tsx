'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';

import type { Locale } from '@/domain/entities/Profile';
import { Button } from '@/presentation/components/ui/Button';
import { Input } from '@/presentation/components/ui/Input';
import { Select } from '@/presentation/components/ui/Select';
import { Card } from '@/presentation/components/ui/Card';
import { updateMyProfileAction } from '@/app/_actions/profile';

interface ProfileFormProps {
  locale: string;
  email: string;
  initial: {
    displayName: string;
    whatsappNumber: string;
    locale: Locale;
  };
}

export function ProfileForm({ locale, email, initial }: ProfileFormProps) {
  const t = useTranslations('profile.form');
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [whatsappNumber, setWhatsappNumber] = useState(initial.whatsappNumber);
  const [pref, setPref] = useState<Locale>(initial.locale);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateMyProfileAction({
          displayName,
          whatsappNumber,
          locale: pref,
          pageLocale: locale,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <Card pad="md" className="max-w-xl">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-ink-soft">
            {t('email')}
          </span>
          <p className="mt-1 text-sm text-ink">{email}</p>
        </div>
        <Field label={t('displayName')}>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t('displayNamePlaceholder')}
          />
        </Field>
        <Field label={t('whatsapp')}>
          <Input
            type="tel"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="+55 41 99999-9999"
          />
          <span className="mt-1 block text-xs text-muted">{t('whatsappHint')}</span>
        </Field>
        <Field label={t('locale')}>
          <Select value={pref} onChange={(e) => setPref(e.target.value as Locale)}>
            <option value="pt-BR">Português (Brasil)</option>
            <option value="es-LA">Español</option>
          </Select>
        </Field>

        {error && <p className="text-sm text-danger">{error}</p>}
        {saved && <p className="text-sm text-success">{t('saved')}</p>}

        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? t('saving') : t('save')}
        </Button>
      </form>
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
