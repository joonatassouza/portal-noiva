'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';

import { Button } from '@/presentation/components/ui/Button';
import { reportMediaPostAction } from '@/app/_actions/media';

interface ReportPostButtonProps {
  postId: string;
  isAuthenticated: boolean;
  callbackUrl: string;
  /** Visual variant — outlined when used inline in feed cards. */
  size?: 'sm' | 'md';
}

/**
 * Triangle-warning button + popover with optional reason. Triggers a red
 * notification to the master admin.
 */
export function ReportPostButton({
  postId,
  isAuthenticated,
  callbackUrl,
  size = 'sm',
}: ReportPostButtonProps) {
  const t = useTranslations('feed.report');
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const r = await reportMediaPostAction({ postId, reason: reason || undefined });
      if (!r.ok) {
        if (r.requiresLogin) {
          signIn('google', { callbackUrl });
          return;
        }
        setError(r.error ?? t('error'));
        return;
      }
      setSubmitted(true);
      setReason('');
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
      }, 1500);
    });
  }

  return (
    <div ref={ref} className="relative">
      <Button
        type="button"
        variant="ghost"
        size={size}
        onClick={() => {
          if (!isAuthenticated) {
            signIn('google', { callbackUrl });
            return;
          }
          setOpen((v) => !v);
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span className="sr-only sm:not-sr-only sm:ml-1">{t('button')}</span>
      </Button>
      {open && (
        <form
          onSubmit={onSubmit}
          className="absolute right-0 z-30 mt-2 w-72 rounded-lg border border-border bg-bg p-3 shadow-md"
        >
          <p className="text-sm text-ink">{t('title')}</p>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('placeholder')}
            maxLength={500}
            className="mt-2 block w-full rounded-md border border-border bg-bg p-2 text-sm text-ink"
          />
          {error && <p className="mt-1 text-xs text-danger">{error}</p>}
          <div className="mt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={pending}>
              {submitted ? t('sent') : pending ? t('sending') : t('submit')}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
