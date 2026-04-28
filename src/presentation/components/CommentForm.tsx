'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';

import { Button } from '@/presentation/components/ui/Button';
import { addMediaCommentAction } from '@/app/_actions/media';
import { MEDIA_COMMENT_MAX_LENGTH } from '@/domain/entities/MediaComment';

interface CommentFormProps {
  postId: string;
  isAuthenticated: boolean;
  callbackUrl: string;
  locale: string;
  churchSlug: string;
}

export function CommentForm({
  postId,
  isAuthenticated,
  callbackUrl,
  locale,
  churchSlug,
}: CommentFormProps) {
  const t = useTranslations('post.comment');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!isAuthenticated) {
    return (
      <div className="rounded-md border border-border bg-bg p-3 text-sm">
        <p className="text-ink-soft">{t('loginRequired')}</p>
        <Button
          onClick={() => signIn('google', { callbackUrl })}
          variant="secondary"
          size="sm"
          className="mt-2"
        >
          {t('signIn')}
        </Button>
      </div>
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await addMediaCommentAction({ postId, body, locale, churchSlug });
        setBody('');
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  const remaining = MEDIA_COMMENT_MAX_LENGTH - body.length;

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={MEDIA_COMMENT_MAX_LENGTH}
        required
        placeholder={t('placeholder')}
        className="block w-full rounded-md border border-border bg-bg p-3 text-sm text-ink"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">
          {t('remaining', { count: Math.max(0, remaining) })}
        </span>
        <Button type="submit" variant="primary" size="sm" disabled={pending || body.trim().length === 0}>
          {pending ? t('submitting') : t('submit')}
        </Button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
