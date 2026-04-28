'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/presentation/components/ui/Button';
import { Input } from '@/presentation/components/ui/Input';
import { Card } from '@/presentation/components/ui/Card';
import { submitClaimAction } from '@/app/_actions/claims';

interface ClaimFormProps {
  locale: string;
  churchId: string;
  churchSlug: string;
  churchName: string;
}

export function ClaimForm({ locale, churchId, churchSlug }: ClaimFormProps) {
  const t = useTranslations('claim');
  const [evidence, setEvidence] = useState('');
  const [linksText, setLinksText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await submitClaimAction({
          churchId,
          evidence,
          evidenceLinks: linksText.split('\n').map((s) => s.trim()).filter(Boolean),
          locale,
          churchSlug,
        });
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <Card pad="md" className="max-w-2xl">
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-soft">
            {t('evidenceLabel')}
          </span>
          <textarea
            required
            minLength={20}
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            rows={6}
            placeholder={t('evidencePlaceholder')}
            className="block w-full rounded-md border border-border bg-bg p-3 text-sm text-ink"
          />
          <span className="mt-1 block text-xs text-muted">{t('evidenceHint')}</span>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-soft">
            {t('linksLabel')}
          </span>
          <textarea
            value={linksText}
            onChange={(e) => setLinksText(e.target.value)}
            rows={3}
            placeholder={'https://youtube.com/...\nhttps://instagram.com/...'}
            className="block w-full rounded-md border border-border bg-bg p-3 text-sm text-ink"
          />
        </label>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? t('submitting') : t('submit')}
        </Button>
      </form>
    </Card>
  );
}
// Avoid TS complaining about unused import.
void Input;
