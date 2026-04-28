'use client';

import { useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';

import type { MediaComment } from '@/domain/entities/MediaComment';
import { Button } from '@/presentation/components/ui/Button';
import { deleteMediaCommentAction } from '@/app/_actions/media';

interface CommentListProps {
  comments: MediaComment[];
  currentUserId?: string;
  canModerate: boolean;
  locale: string;
  churchSlug: string;
  postId: string;
}

export function CommentList({
  comments,
  currentUserId,
  canModerate,
  locale,
  churchSlug,
  postId,
}: CommentListProps) {
  const t = useTranslations('post.comment');
  const intlLocale = useLocale();
  const [pending, startTransition] = useTransition();

  if (comments.length === 0) {
    return <p className="text-sm text-muted">{t('empty')}</p>;
  }

  function onDelete(commentId: string) {
    if (!window.confirm(t('confirmDelete'))) return;
    startTransition(async () => {
      await deleteMediaCommentAction({ commentId, postId, locale, churchSlug });
    });
  }

  return (
    <ul className="space-y-3">
      {comments.map((c) => {
        const canDelete = canModerate || c.authorUserId === currentUserId;
        return (
          <li key={c.id} className="rounded-md border border-border bg-bg p-3">
            <p className="whitespace-pre-wrap text-sm text-ink">{c.body}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-muted">
              <span>{new Date(c.createdAt).toLocaleString(intlLocale)}</span>
              {canDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(c.id)}
                  disabled={pending}
                >
                  {t('delete')}
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
