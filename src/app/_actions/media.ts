'use server';

import { revalidatePath } from 'next/cache';

import { container } from '@/infrastructure/di/container';
import { getPrincipal } from '@/presentation/lib/principal';
import type { MediaImage, MediaPostType } from '@/domain/entities/MediaPost';
import type { UpcomingPage } from '@/application/ports/EventRepository';
import type { MediaFeedItem } from '@/application/use-cases/ListGlobalMediaFeed';

export async function presignMediaUploadAction(args: {
  churchId: string;
  contentType: string;
  sizeBytes: number;
  extension?: string;
}): Promise<{ uploadUrl: string; publicUrl: string }> {
  const principal = await getPrincipal();
  return container.presignMediaUpload().execute(principal, args);
}

export async function createMediaPostAction(args: {
  churchId: string;
  eventId?: string;
  type: MediaPostType;
  externalUrl?: string;
  images?: MediaImage[];
  caption?: string;
  locale: string;
  churchSlug: string;
}) {
  const principal = await getPrincipal();
  await container.createMediaPost().execute(principal, {
    churchId: args.churchId,
    eventId: args.eventId,
    type: args.type,
    externalUrl: args.externalUrl,
    images: args.images,
    caption: args.caption,
  });
  revalidatePath(`/${args.locale}/painel/${args.churchSlug}/midia`);
  revalidatePath(`/${args.locale}/igreja/${args.churchSlug}`);
  revalidatePath(`/${args.locale}`);
}

export async function deleteMediaPostAction(args: {
  postId: string;
  locale: string;
  churchSlug: string;
}) {
  const principal = await getPrincipal();
  await container.deleteMediaPost().execute(principal, args.postId);
  revalidatePath(`/${args.locale}/painel/${args.churchSlug}/midia`);
  revalidatePath(`/${args.locale}/igreja/${args.churchSlug}`);
}

export async function addMediaCommentAction(args: {
  postId: string;
  body: string;
  authorName?: string;
  locale: string;
  churchSlug: string;
}) {
  const principal = await getPrincipal();
  await container.addMediaComment().execute(principal, {
    postId: args.postId,
    body: args.body,
    authorName: args.authorName,
  });
  revalidatePath(`/${args.locale}/igreja/${args.churchSlug}/post/${args.postId}`);
}

export async function deleteMediaCommentAction(args: {
  commentId: string;
  postId: string;
  locale: string;
  churchSlug: string;
}) {
  const principal = await getPrincipal();
  await container.deleteMediaComment().execute(principal, args.commentId);
  revalidatePath(`/${args.locale}/igreja/${args.churchSlug}/post/${args.postId}`);
}

export async function fetchMediaFeedAction(
  cursor?: string,
): Promise<UpcomingPage<MediaFeedItem>> {
  return container.listGlobalMediaFeed().execute({ cursor, limit: 10 });
}

export async function reportMediaPostAction(args: {
  postId: string;
  reason?: string;
}): Promise<{ ok: true } | { ok: false; requiresLogin?: boolean; error?: string }> {
  const principal = await getPrincipal();
  if (!principal) return { ok: false, requiresLogin: true };
  try {
    await container.reportMediaPost().execute(principal, {
      postId: args.postId,
      reason: args.reason,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
