import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

import { auth } from '@/auth';
import { container } from '@/infrastructure/di/container';
import { NotFoundError } from '@/domain/errors/DomainError';

import { Container } from '@/presentation/components/ui/Container';
import { PageHero } from '@/presentation/components/ui/PageHero';
import { SectionHeading } from '@/presentation/components/ui/SectionHeading';
import { Card } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Badge } from '@/presentation/components/ui/Badge';

import { ServiceList } from '@/presentation/components/ServiceList';
import { EventList } from '@/presentation/components/EventList';
import { SocialLinks } from '@/presentation/components/SocialLinks';
import { SupportBlock } from '@/presentation/components/SupportBlock';
import { FavoriteButton } from '@/presentation/components/FavoriteButton';
import { MediaPostFeed } from '@/presentation/components/MediaPostFeed';
import { AdminContacts } from '@/presentation/components/AdminContacts';
import { getTranslations as getT } from 'next-intl/server';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { church } = await container.getChurchBySlug().execute(slug);
    return {
      title: church.name,
      description:
        church.description ??
        `${church.name} — ${church.city}, ${church.country}. Cultos, transmissões e eventos.`,
      openGraph: { title: church.name, type: 'website' },
    };
  } catch {
    return { title: 'Igreja não encontrada' };
  }
}

export default async function ChurchPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('church');

  let church;
  let services;
  let upcomingEvents;
  try {
    ({ church, services, upcomingEvents } = await container.getChurchBySlug().execute(slug));
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;
  const isMasterAdmin = Boolean(session?.user?.isMasterAdmin);
  const isFavorited = userId
    ? await container.favorites.isFavorited(userId, church.id)
    : false;

  // Does this user have an editor role on this church?
  const role = userId
    ? await container.roles.findByUserAndChurch(userId, church.id)
    : null;
  const canEditPanel =
    isMasterAdmin || role?.roleType === 'OWNER' || role?.roleType === 'EDITOR_ADMIN';

  // The current user's applications for this church's events (any status).
  const myApplications = userId
    ? (await container.volunteers.listByChurch(church.id)).filter(
        (v) => v.applicantUserId === userId,
      )
    : [];
  const applicationsByEventId = new Map(myApplications.map((a) => [a.eventId, a]));

  // Pre-fill the volunteer form with the user's WhatsApp from their profile.
  const myProfile = userId ? await container.profiles.findByUserId(userId) : null;

  const recentPosts = await container.mediaPosts.listByChurch(church.id, 12);

  // Admin contacts (OWNER + EDITOR_ADMIN) for the public page.
  const churchRoles = await container.roles.listByChurch(church.id);
  const adminRoles = churchRoles.filter(
    (r) => r.roleType === 'OWNER' || r.roleType === 'EDITOR_ADMIN',
  );
  const adminProfiles = await container.profiles.findManyByUserIds(
    adminRoles.map((r) => r.userId),
  );
  const profileById = new Map(adminProfiles.map((p) => [p.userId, p]));

  // Has the current user already submitted a pending claim?
  const tClaim = await getT('claim');
  const claimsForThisChurch = userId
    ? await container.claims.listByChurch(church.id)
    : [];
  const myPendingClaim = userId
    ? claimsForThisChurch.find((c) => c.claimantUserId === userId && c.status === 'PENDING')
    : null;
  const showClaimCTA =
    church.ownershipStatus !== 'CLAIMED' && !myPendingClaim && !canEditPanel;

  // Schema.org JSON-LD: Church for the venue + Event entries for each upcoming event.
  const churchJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Church',
    name: church.name,
    description: church.description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: church.physicalAddress,
      addressLocality: church.city,
      addressCountry: church.country,
    },
    geo: church.coords
      ? { '@type': 'GeoCoordinates', latitude: church.coords.lat, longitude: church.coords.lng }
      : undefined,
    url: church.social.websiteUrl,
    sameAs: [church.social.youtubeUrl, church.social.instagramUrl, church.social.facebookUrl].filter(
      Boolean,
    ),
    // OpeningHoursSpecification only models weekly cadence — we drop monthly
    // recurrences from the structured data; they still render for humans.
    openingHoursSpecification: services
      .filter((s) => s.recurrence.kind === 'WEEKLY')
      .map((s) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: dayName(s.recurrence.dayOfWeek),
        opens: s.startTime,
        closes: s.endTime ?? s.startTime,
        name: s.label,
      })),
  };

  const eventsJsonLd = upcomingEvents.map((ev) => ({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: ev.title,
    description: ev.description,
    startDate: ev.startDatetime.toISOString(),
    endDate: ev.endDatetime?.toISOString(),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: ev.eventLocation ?? church.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: church.physicalAddress,
        addressLocality: church.city,
        addressCountry: church.country,
      },
    },
    organizer: { '@type': 'Organization', name: church.name },
  }));

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(churchJsonLd) }}
      />
      {eventsJsonLd.map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ))}

      <PageHero
        kicker={`${church.city} · ${church.country}`}
        title={church.name}
        subtitle={church.description}
        trailing={
          <FavoriteButton
            churchId={church.id}
            initialFavorited={isFavorited}
            isAuthenticated={Boolean(userId)}
            size="md"
            callbackUrl={`/${locale}/igreja/${church.slug}`}
          />
        }
      />

      <Container as="div" pad="page">
        {canEditPanel && (
          <Card pad="md" className="mb-6 flex flex-wrap items-center justify-between gap-3 border-gold">
            <div>
              <p className="font-medium text-ink">{tClaim('panelCta.title')}</p>
              <p className="mt-1 text-sm text-ink-soft">{tClaim('panelCta.subtitle')}</p>
            </div>
            <Button href={`/${locale}/painel/${church.slug}`} variant="primary" size="sm">
              {tClaim('panelCta.button')}
            </Button>
          </Card>
        )}
        {showClaimCTA && (
          <Card pad="md" className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-ink">{tClaim('cta.title')}</p>
              <p className="mt-1 text-sm text-ink-soft">{tClaim('cta.subtitle')}</p>
            </div>
            <Button href={`/${locale}/reivindicar/${church.slug}`} variant="primary" size="sm">
              {tClaim('cta.button')}
            </Button>
          </Card>
        )}
        {myPendingClaim && (
          <Card pad="md" className="mb-6">
            <Badge tone="gold">{tClaim('cta.pendingBadge')}</Badge>
            <p className="mt-2 text-sm text-ink-soft">{tClaim('cta.pendingDesc')}</p>
          </Card>
        )}
        <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-10">
            <section>
              <SectionHeading title={t('schedule')} level={3} />
              <div className="mt-4">
                <ServiceList services={services} />
              </div>
            </section>

            <section>
              <SectionHeading title={t('upcomingEvents')} level={3} />
              <div className="mt-4">
                <EventList
                  events={upcomingEvents}
                  churchSlug={church.slug}
                  locale={locale}
                  isAuthenticated={Boolean(userId)}
                  applicationsByEventId={applicationsByEventId}
                  defaultWhatsapp={myProfile?.whatsappNumber}
                />
              </div>
            </section>

            {recentPosts.length > 0 && (
              <section>
                <SectionHeading title={t('mediaTitle')} level={3} />
                <div className="mt-4">
                  <MediaPostFeed
                    posts={recentPosts}
                    locale={locale}
                    churchSlug={church.slug}
                  />
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6">
            <Card pad="md">
              <SectionHeading title={t('address')} level={3} />
              <p className="mt-2 text-sm text-ink-soft">{church.physicalAddress}</p>
              <p className="mt-1 text-sm text-muted">
                {church.city} · {church.country}
              </p>
            </Card>

            <AdminContacts
              roles={adminRoles}
              profiles={profileById}
              whatsappPreset={`Olá! Vi a igreja ${church.name} no Portal Noiva.`}
            />

            {(church.social.websiteUrl ||
              church.social.youtubeUrl ||
              church.social.instagramUrl ||
              church.social.facebookUrl) && (
              <Card pad="md">
                <SectionHeading title={t('social')} level={3} />
                <div className="mt-2">
                  <SocialLinks social={church.social} />
                </div>
              </Card>
            )}

            {(church.pix.pixKey || church.pix.pixQrcodeImageUrl) && (
              <Card pad="md">
                <SectionHeading title={t('support')} level={3} />
                <div className="mt-2">
                  <SupportBlock pix={church.pix} />
                </div>
              </Card>
            )}
          </aside>
        </div>
      </Container>
    </article>
  );
}

function dayName(d: number): string {
  return [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ][d] ?? 'Sunday';
}
