'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/presentation/components/ui/Button';
import { Input } from '@/presentation/components/ui/Input';
import { Card } from '@/presentation/components/ui/Card';
import { geocodeAction } from '@/app/_actions/admin-churches';
import { submitProposalAction, type ProposalFormPayload } from '@/app/_actions/proposals';

interface ChurchProposalFormProps {
  locale: string;
}

/**
 * Public-facing form for users to propose a NEW church.
 *
 * Note: shares fields with master admin's ChurchForm but stays separate to
 * keep its scope tight (no PIX, no ownership status, plus evidence section).
 * If schemas drift, both forms must be updated.
 */
export function ChurchProposalForm({ locale }: ChurchProposalFormProps) {
  const t = useTranslations('proposal.form');
  const [form, setForm] = useState<ProposalFormPayload>({
    name: '',
    description: '',
    physicalAddress: '',
    city: '',
    country: '',
    lat: '',
    lng: '',
    youtubeUrl: '',
    instagramUrl: '',
    facebookUrl: '',
    websiteUrl: '',
    evidence: '',
    evidenceLinks: [],
    proposerName: '',
  });
  const [linksText, setLinksText] = useState('');
  const [pending, startTransition] = useTransition();
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ProposalFormPayload>(key: K, value: ProposalFormPayload[K]) {
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
        await submitProposalAction(
          {
            ...form,
            evidenceLinks: linksText.split('\n').map((s) => s.trim()).filter(Boolean),
          },
          locale,
        );
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card pad="md">
        <h3 className="font-serif text-lg text-ink">{t('aboutChurch')}</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label={t('name')} colSpan={2}>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </Field>
          <Field label={t('description')} colSpan={2}>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              className="block w-full rounded-md border border-border bg-bg p-3 text-sm text-ink"
            />
          </Field>
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
            <Input value={form.lat} onChange={(e) => set('lat', e.target.value)} placeholder={t('coordsOptional')} />
          </Field>
          <Field label="Longitude">
            <Input value={form.lng} onChange={(e) => set('lng', e.target.value)} placeholder={t('coordsOptional')} />
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
        <h3 className="font-serif text-lg text-ink">{t('aboutYou')}</h3>
        <div className="mt-3 grid gap-3">
          <Field label={t('proposerName')}>
            <Input
              value={form.proposerName}
              onChange={(e) => set('proposerName', e.target.value)}
              placeholder={t('proposerNamePlaceholder')}
            />
          </Field>
          <Field label={t('evidenceLabel')}>
            <textarea
              required
              minLength={20}
              value={form.evidence}
              onChange={(e) => set('evidence', e.target.value)}
              rows={5}
              placeholder={t('evidencePlaceholder')}
              className="block w-full rounded-md border border-border bg-bg p-3 text-sm text-ink"
            />
            <span className="mt-1 block text-xs text-muted">{t('evidenceHint')}</span>
          </Field>
          <Field label={t('linksLabel')}>
            <textarea
              value={linksText}
              onChange={(e) => setLinksText(e.target.value)}
              rows={3}
              placeholder={'https://youtube.com/...\nhttps://instagram.com/...'}
              className="block w-full rounded-md border border-border bg-bg p-3 text-sm text-ink"
            />
          </Field>
        </div>
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" variant="primary" disabled={pending}>
        {pending ? t('submitting') : t('submit')}
      </Button>
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
