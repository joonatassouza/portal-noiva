import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { container } from '@/infrastructure/di/container';
import { getPrincipal } from '@/presentation/lib/principal';

import { Container } from '@/presentation/components/ui/Container';
import { PageHero } from '@/presentation/components/ui/PageHero';
import { Card } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';
import { ExternalLink } from '@/presentation/components/ui/ExternalLink';
import { CommentList } from '@/presentation/components/CommentList';
import { CommentForm } from '@/presentation/components/CommentForm';
import { ShareLinkButton } from '@/presentation/components/ShareLinkButton';
import { ReportPostButton } from '@/presentation/components/ReportPostButton';

interface PageProps {
  params: Promise<{ locale: string; slug: string; postId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { postId } = await params;
  const post = await container.mediaPosts.findById(postId);
  if (!post) return { title: 'Post não encontrado' };
  const church = await container.churches.findById(post.churchId);
  return {
    title: post.caption?.slice(0, 80) ?? 'Post',
    description:
      post.caption ?? (church ? `Mídia de ${church.name}` : 'Mídia de igreja da Mensagem'),
    openGraph: {
      title: post.caption?.slice(0, 80) ?? 'Post',
      description: post.caption,
      images: post.images[0]?.url ? [post.images[0].url] : undefined,
    },
  };
}

export default async function MediaPostPage({ params }: PageProps) {
  const { locale, slug, postId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('post');

  const post = await container.mediaPosts.findById(postId);
  if (!post) notFound();
  const church = await container.churches.findBySlug(slug);
  if (!church || church.id !== post.churchId) notFound();

  const event = post.eventId ? await container.events.findById(post.eventId) : null;
  const comments = await container.mediaComments.listByPost(post.id);
  const principal = await getPrincipal();
  const isAuthor = principal?.userId === post.authorUserId;

  let canModerate = isAuthor || Boolean(principal?.isMasterAdmin);
  if (principal && !canModerate) {
    const role = await container.roles.findByUserAndChurch(principal.userId, post.churchId);
    canModerate = role?.roleType === 'OWNER' || role?.roleType === 'EDITOR_ADMIN';
  }

  return (
    <article>
      <PageHero
        kicker={church.name}
        title={post.caption ?? t('genericTitle')}
        subtitle={event?.title}
      />
      <Container as="section" pad="page">
        <div className="grid gap-6 lg:grid-cols-[3fr,2fr]">
          <Card pad="md" className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge tone={post.type === 'ALBUM_LINK' ? 'neutral' : 'gold'}>
                {t(`type.${post.type}` as 'type.ALBUM_LINK')}
              </Badge>
              <div className="flex items-center gap-1">
                <ShareLinkButton path={`/${locale}/igreja/${slug}/post/${post.id}`} />
                <ReportPostButton
                  postId={post.id}
                  isAuthenticated={Boolean(principal)}
                  callbackUrl={`/${locale}/igreja/${slug}/post/${post.id}`}
                />
              </div>
            </div>

            {post.type === 'ALBUM_LINK' && post.externalUrl && (
              <div>
                <p className="text-sm text-ink-soft">{t('albumLinkHint')}</p>
                <ExternalLink href={post.externalUrl}>{post.externalUrl}</ExternalLink>
              </div>
            )}

            {post.type === 'IMAGE_GALLERY' && post.images.length > 0 && (
              <ul className="grid gap-2 sm:grid-cols-2">
                {post.images.map((img, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <li key={img.url} className="overflow-hidden rounded-md border border-border bg-bg">
                    {/* Native <img> avoids configuring remotePatterns for arbitrary S3 buckets. */}
                    <img
                      src={img.url}
                      alt={img.alt ?? `${post.caption ?? 'imagem'} ${i + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </li>
                ))}
              </ul>
            )}

            {post.caption && <p className="whitespace-pre-wrap text-sm text-ink">{post.caption}</p>}
          </Card>

          <div id="comentarios" />
          <Card pad="md" className="space-y-4">
            <h2 className="font-serif text-lg text-ink">
              {t('comments', { count: comments.length })}
            </h2>
            <CommentList
              comments={comments}
              currentUserId={principal?.userId}
              canModerate={canModerate}
              locale={locale}
              churchSlug={slug}
              postId={post.id}
            />
            <CommentForm
              postId={post.id}
              isAuthenticated={Boolean(principal)}
              callbackUrl={`/${locale}/igreja/${slug}/post/${post.id}`}
              locale={locale}
              churchSlug={slug}
            />
          </Card>
        </div>
      </Container>
    </article>
  );
}
