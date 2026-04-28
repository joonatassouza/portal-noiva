'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { Button } from '@/presentation/components/ui/Button';
import { acceptInvitationAction } from '@/app/_actions/invitations';

interface AcceptInvitationButtonProps {
  token: string;
  locale: string;
  churchSlug?: string;
}

export function AcceptInvitationButton({ token, locale, churchSlug }: AcceptInvitationButtonProps) {
  const t = useTranslations('invite');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function onAccept() {
    setError(null);
    startTransition(async () => {
      try {
        const r = await acceptInvitationAction(token);
        if (r.status === 'ACCEPTED') {
          setDone(true);
          if (churchSlug) router.push(`/${locale}/painel/${churchSlug}`);
        } else if (r.status === 'EMAIL_MISMATCH') {
          setError(t('emailMismatchShort'));
        } else if (r.status === 'EXPIRED') {
          setError(t('status.EXPIRED'));
        } else {
          setError(t('status.INVALID'));
        }
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button onClick={onAccept} variant="primary" disabled={pending || done}>
        {done ? t('accepted') : pending ? t('accepting') : t('accept')}
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
