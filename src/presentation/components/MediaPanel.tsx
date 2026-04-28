'use client';

import { useState, useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';

import type { MediaImage, MediaPost, MediaPostType } from '@/domain/entities/MediaPost';

import { Card } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Input } from '@/presentation/components/ui/Input';
import { Select } from '@/presentation/components/ui/Select';
import { EmptyState } from '@/presentation/components/ui/EmptyState';
import { Badge } from '@/presentation/components/ui/Badge';

// EmptyState reused for the empty posts list below.

import {
  createMediaPostAction,
  deleteMediaPostAction,
  presignMediaUploadAction,
} from '@/app/_actions/media';
import { compressToWebP } from '@/presentation/lib/imageCompression';

interface MediaPanelProps {
  locale: string;
  church: { id: string; slug: string; name: string };
  events: Array<{ id: string; title: string; startDatetime: string }>;
  posts: MediaPost[];
}

const MAX_IMAGES = 20;

export function MediaPanel({ locale, church, events, posts }: MediaPanelProps) {
  const t = useTranslations('panel.media');
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl text-ink">{t('title')}</h2>
        {!creating && (
          <Button onClick={() => setCreating(true)} variant="primary" size="sm">
            {t('new')}
          </Button>
        )}
      </div>

      {creating && (
        <PostForm
          locale={locale}
          church={church}
          events={events}
          onCancel={() => setCreating(false)}
          onSaved={() => setCreating(false)}
        />
      )}

      {posts.length === 0 ? (
        <EmptyState title={t('empty.title')} description={t('empty.description')} />
      ) : (
        <ul className="space-y-3">
          {posts.map((p) => (
            <li key={p.id}>
              <PostRow locale={locale} church={church} post={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PostRow({
  locale,
  church,
  post,
}: {
  locale: string;
  church: { slug: string };
  post: MediaPost;
}) {
  const t = useTranslations('panel.media');
  const intlLocale = useLocale();
  return (
    <Card pad="md" className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <Badge tone={post.type === 'ALBUM_LINK' ? 'neutral' : 'gold'}>
          {t(`type.${post.type}` as 'type.ALBUM_LINK')}
        </Badge>
        {post.caption && <p className="mt-2 text-sm text-ink">{post.caption}</p>}
        {post.type === 'ALBUM_LINK' && post.externalUrl && (
          <a href={post.externalUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block text-xs text-ink-soft">
            {post.externalUrl} ↗
          </a>
        )}
        {post.type === 'IMAGE_GALLERY' && post.images.length > 0 && (
          <p className="mt-1 text-xs text-muted">
            {t('imageCount', { count: post.images.length })}
          </p>
        )}
        <p className="mt-1 text-xs text-muted">
          {new Date(post.createdAt).toLocaleString(intlLocale)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          href={`/${locale}/igreja/${church.slug}/post/${post.id}`}
          variant="secondary"
          size="sm"
        >
          {t('view')}
        </Button>
        <DeleteButton
          onConfirm={async () => {
            await deleteMediaPostAction({
              postId: post.id,
              locale,
              churchSlug: church.slug,
            });
          }}
        />
      </div>
    </Card>
  );
}

function DeleteButton({ onConfirm }: { onConfirm: () => Promise<void> }) {
  const t = useTranslations('panel.media');
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={async () => {
        if (window.confirm(t('confirmDelete'))) await onConfirm();
      }}
    >
      {t('delete')}
    </Button>
  );
}

function PostForm({
  locale,
  church,
  events,
  onCancel,
  onSaved,
}: {
  locale: string;
  church: { id: string; slug: string };
  events: MediaPanelProps['events'];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations('panel.media.form');
  const [eventId, setEventId] = useState<string>('');
  const [type, setType] = useState<MediaPostType>('ALBUM_LINK');
  const [externalUrl, setExternalUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []);
    setFiles(list.slice(0, MAX_IMAGES));
  }

  async function uploadAll(): Promise<MediaImage[]> {
    const uploaded: MediaImage[] = [];
    for (let i = 0; i < files.length; i++) {
      setProgress({ done: i, total: files.length });
      const f = files[i]!;
      const compressed = await compressToWebP(f);
      const presign = await presignMediaUploadAction({
        churchId: church.id,
        contentType: 'image/webp',
        sizeBytes: compressed.blob.size,
        extension: 'webp',
      });
      const res = await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/webp' },
        body: compressed.blob,
      });
      if (!res.ok) {
        throw new Error(`Upload falhou: HTTP ${res.status}`);
      }
      uploaded.push({
        url: presign.publicUrl,
        aspectRatio: compressed.height > 0 ? compressed.width / compressed.height : undefined,
      });
    }
    setProgress(null);
    return uploaded;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const images = type === 'IMAGE_GALLERY' ? await uploadAll() : undefined;
        await createMediaPostAction({
          churchId: church.id,
          eventId: eventId || undefined,
          type,
          externalUrl: type === 'ALBUM_LINK' ? externalUrl : undefined,
          images,
          caption: caption || undefined,
          locale,
          churchSlug: church.slug,
        });
        onSaved();
      } catch (err) {
        setError((err as Error).message);
        setProgress(null);
      }
    });
  }

  return (
    <Card pad="md">
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-soft">
            {t('event')}
          </span>
          <Select value={eventId} onChange={(e) => setEventId(e.target.value)}>
            <option value="">{t('eventNone')}</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </Select>
          <span className="mt-1 block text-xs text-muted">{t('eventHint')}</span>
        </label>

        <fieldset className="rounded-md border border-border p-4">
          <legend className="px-1 text-xs font-medium uppercase tracking-wider text-ink-soft">
            {t('type')}
          </legend>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={type === 'ALBUM_LINK'}
              onChange={() => setType('ALBUM_LINK')}
            />
            {t('albumLink')}
          </label>
          <label className="mt-1 flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={type === 'IMAGE_GALLERY'}
              onChange={() => setType('IMAGE_GALLERY')}
            />
            {t('imageGallery')}
          </label>
        </fieldset>

        {type === 'ALBUM_LINK' && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-soft">
              {t('externalUrl')}
            </span>
            <Input
              type="url"
              required
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://facebook.com/album/…"
            />
            <span className="mt-1 block text-xs text-muted">{t('externalUrlHint')}</span>
          </label>
        )}

        {type === 'IMAGE_GALLERY' && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-soft">
              {t('images')}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onPickFiles}
              className="block w-full text-sm text-ink"
            />
            <span className="mt-1 block text-xs text-muted">{t('imagesHint', { max: MAX_IMAGES })}</span>
            {files.length > 0 && (
              <p className="mt-2 text-xs text-ink-soft">
                {t('selectedCount', { count: files.length })}
              </p>
            )}
          </label>
        )}

        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-soft">
            {t('caption')}
          </span>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            className="block w-full rounded-md border border-border bg-bg p-3 text-sm text-ink"
          />
        </label>

        {progress && (
          <p className="text-sm text-ink-soft">
            {t('uploading', { done: progress.done, total: progress.total })}
          </p>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? t('saving') : t('save')}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t('cancel')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
