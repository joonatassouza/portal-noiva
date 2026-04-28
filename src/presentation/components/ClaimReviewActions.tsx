'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/presentation/components/ui/Button';
import { reviewClaimAction } from '@/app/_actions/claims';

interface ClaimReviewActionsProps {
  claimId: string;
  locale: string;
}

export function ClaimReviewActions({ claimId, locale }: ClaimReviewActionsProps) {
  const t = useTranslations('admin');
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  function review(approve: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        await reviewClaimAction({ claimId, approve, notes: notes || undefined, locale });
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  return (
    <div className="space-y-2">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder={t('reviewNotesPlaceholder')}
        className="block w-full rounded-md border border-border bg-bg p-2 text-sm text-ink"
      />
      <div className="flex gap-2">
        <Button onClick={() => review(true)} variant="primary" size="sm" disabled={pending}>
          {t('approve')}
        </Button>
        <Button onClick={() => review(false)} variant="secondary" size="sm" disabled={pending}>
          {t('reject')}
        </Button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
