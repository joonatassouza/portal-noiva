'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/presentation/components/ui/Button';
import { Input } from '@/presentation/components/ui/Input';
import { Card } from '@/presentation/components/ui/Card';

import {
  geocodeAction,
  saveChurchAction,
  type ChurchFormPayload,
} from '@/app/_actions/admin-churches';

interface ChurchFormProps {
  locale: string;
  /** Pre-fill with an existing church for edit mode. */
  initial?: Partial<ChurchFormPayload>;
}

/**
 * Reusable church form. Used by master admin (full version including ownership
 * status) and later, in 3d, by owners (subset without ownership status).
 */
export function ChurchForm({ locale, initial }: ChurchFormProps) {
  const t = useTranslations('admin.churchForm');
  const [form, setForm] = useState<ChurchFormPayload>({
    id: initial?.id,
    slug: initial?.slug ?? '',
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    physicalAddress: initial?.physicalAddress ?? '',
    city: initial?.city ?? '',
    country: initial?.country ?? '',
    lat: initial?.lat ?? '',
    lng: initial?.lng ?? '',
    youtubeUrl: initial?.youtubeUrl ?? '',
    instagramUrl: initial?.instagramUrl ?? '',
    facebookUrl: initial?.facebookUrl ?? '',
    websiteUrl: initial?.websiteUrl ?? '',
    pixKey: initial?.pixKey ?? '',
    pixQrcodeImageUrl: initial?.pixQrcodeImageUrl ?? '',
    ownershipStatus: initial?.ownershipStatus ?? 'UNCLAIMED',
  });
  const [pending, startTransition] = useTransition();
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ChurchFormPayload>(key: K, value: ChurchFormPayload[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onGeocode() {
    if (!form.physicalAddress) return;
    setGeocoding(true);
    try {
      const r = await geocodeAction(`${form.physicalAddress}, ${form.city}, ${form.country}`);
      if (r) {
        set('lat', String(r.lat));
        set('lng', String(r.lng));
      } else {
        setError(t('geocodeNotFound'));
      }
    } finally {
      setGeocoding(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await saveChurchAction(form, locale);
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card pad="md">
        <h3 className="font-serif text-lg text-ink">{t('basics')}</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label={t('name')}>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </Field>
          <Field label={t('slug')}>
            <Input value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="auto" />
          </Field>
          <Field label={t('description')} colSpan={2}>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              className="block w-full rounded-md border border-border bg-bg p-3 text-sm text-ink"
            />
          </Field>
        </div>
      </Card>

      <Card pad="md">
        <h3 className="font-serif text-lg text-ink">{t('location')}</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label={t('physicalAddress')} colSpan={2}>
            <Input
              value={form.physicalAddress}
              onChange={(e) => set('physicalAddress', e.target.value)}
              required
            />
          </Field>
          <Field label={t('city')}>
            <Input value={form.city} onChange={(e) => set('city', e.target.value)} required />
          </Field>
          <Field label={t('country')}>
            <Input value={form.country} onChange={(e) => set('country', e.target.value)} required />
          </Field>
          <Field label="Latitude">
            <Input value={form.lat} onChange={(e) => set('lat', e.target.value)} placeholder="-25.4284" />
          </Field>
          <Field label="Longitude">
            <Input value={form.lng} onChange={(e) => set('lng', e.target.value)} placeholder="-49.2733" />
          </Field>
        </div>
        <div className="mt-3">
          <Button type="button" variant="secondary" size="sm" onClick={onGeocode} disabled={geocoding}>
            {geocoding ? t('geocoding') : t('geocode')}
          </Button>
          <p className="mt-2 text-xs text-muted">{t('geocodeHint')}</p>
        </div>
      </Card>

      <Card pad="md">
        <h3 className="font-serif text-lg text-ink">{t('digital')}</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="YouTube URL">
            <Input value={form.youtubeUrl} onChange={(e) => set('youtubeUrl', e.target.value)} />
          </Field>
          <Field label="Instagram URL">
            <Input value={form.instagramUrl} onChange={(e) => set('instagramUrl', e.target.value)} />
          </Field>
          <Field label="Facebook URL">
            <Input value={form.facebookUrl} onChange={(e) => set('facebookUrl', e.target.value)} />
          </Field>
          <Field label={t('website')}>
            <Input value={form.websiteUrl} onChange={(e) => set('websiteUrl', e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card pad="md">
        <h3 className="font-serif text-lg text-ink">{t('pix')}</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label={t('pixKey')}>
            <Input value={form.pixKey} onChange={(e) => set('pixKey', e.target.value)} />
          </Field>
          <Field label={t('pixQrcodeImageUrl')}>
            <Input value={form.pixQrcodeImageUrl} onChange={(e) => set('pixQrcodeImageUrl', e.target.value)} />
          </Field>
        </div>
        <p className="mt-2 text-xs text-muted">{t('pixHint')}</p>
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? t('saving') : t('save')}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children, colSpan }: { label: string; children: React.ReactNode; colSpan?: 2 }) {
  return (
    <label className={colSpan === 2 ? 'sm:col-span-2' : undefined}>
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-soft">
        {label}
      </span>
      {children}
    </label>
  );
}
