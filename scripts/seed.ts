/**
 * Local seed for the Mongo development database.
 *
 *   pnpm seed
 *
 * Idempotent: re-running upserts the same fixtures.
 * Uses ONLY the application/domain layer (no driver-specific code here),
 * which proves the agnostic boundary works.
 */

import { randomUUID } from 'node:crypto';

// Env is loaded by tsx via `--env-file=.env.local` (see the pnpm script).
// Defaults in client.ts also match a local Mongo on 127.0.0.1:27017 with no auth.

import { Church } from '../src/domain/entities/Church';
import { Event } from '../src/domain/entities/Event';
import {
  Service,
  ServiceCancelRule,
  ServiceException,
  ServiceRecurrence,
} from '../src/domain/entities/Service';
import { makeCoordinates } from '../src/domain/value-objects/Coordinates';
import { container } from '../src/infrastructure/di/container';
import { ensureIndexes, closeMongo } from '../src/infrastructure/mongo/client';
import { slugify } from '../src/shared/slug';

interface FixtureService {
  label: string;
  startTime: string;
  endTime?: string;
  hasLiveStream?: boolean;
  recurrence: ServiceRecurrence;
  /** One-off date exceptions (rare). */
  exceptions?: ServiceException[];
  /**
   * Permanent dependent rule: cancel this service whenever another service
   * (referenced by its fixture label) occurs, with optional day offset.
   */
  cancelWhen?: { triggerLabel: string; daysOffset: number; reason?: string }[];
}

interface Fixture {
  name: string;
  city: string;
  country: string;
  address: string;
  lat: number;
  lng: number;
  description?: string;
  youtube?: string;
  instagram?: string;
  website?: string;
  services: FixtureService[];
  events?: Array<{
    title: string;
    description?: string;
    /** Days from "now" — keeps fixtures in the future across reruns. */
    inDays: number;
    /** Local time HH:mm. */
    startTime: string;
    durationHours?: number;
    location?: string;
    acceptingVolunteers?: boolean;
  }>;
}

const FIXTURES: Fixture[] = [
  {
    name: 'Tabernáculo da Fé Curitiba',
    city: 'Curitiba',
    country: 'Brasil',
    address: 'Rua Exemplo, 100 - Centro, Curitiba - PR',
    lat: -25.4284, lng: -49.2733,
    description: 'Congregação local da Mensagem em Curitiba.',
    youtube: 'https://youtube.com/@example-tab-curitiba',
    services: [
      {
        label: 'Culto de Domingo', startTime: '09:00', endTime: '11:30',
        hasLiveStream: true,
        recurrence: { kind: 'WEEKLY', dayOfWeek: 0 },
        // Permanent rule: no Sunday culto in the week following Santa Ceia.
        cancelWhen: [
          {
            triggerLabel: 'Santa Ceia',
            daysOffset: 1,
            reason: 'Sem culto: Santa Ceia no sábado anterior',
          },
        ],
      },
      {
        label: 'Estudo Bíblico', startTime: '19:30', endTime: '21:00',
        recurrence: { kind: 'WEEKLY', dayOfWeek: 3 },
      },
      {
        label: 'Santa Ceia', startTime: '19:00', endTime: '22:00',
        recurrence: { kind: 'MONTHLY_NTH_WEEKDAY', nth: 2, dayOfWeek: 6 },
      },
    ],
    events: [
      {
        title: 'Conferência Regional Sul',
        description: 'Três dias de pregações com ministros locais.',
        inDays: 45, startTime: '09:00', durationHours: 8,
        acceptingVolunteers: true,
        location: 'Centro de Eventos Exemplo, Curitiba',
      },
    ],
  },
  {
    name: 'Tabernáculo da Mensagem São Paulo',
    city: 'São Paulo',
    country: 'Brasil',
    address: 'Av. Exemplo, 500 - São Paulo - SP',
    lat: -23.5505, lng: -46.6333,
    youtube: 'https://youtube.com/@example-tab-sp',
    instagram: 'https://instagram.com/example-tab-sp',
    services: [
      { label: 'Culto de Domingo', startTime: '09:30', hasLiveStream: true,
        recurrence: { kind: 'WEEKLY', dayOfWeek: 0 } },
      { label: 'Oração', startTime: '20:00',
        recurrence: { kind: 'WEEKLY', dayOfWeek: 2 } },
    ],
  },
  {
    name: 'Tabernáculo Asunción',
    city: 'Asunción',
    country: 'Paraguay',
    address: 'Av. Mariscal López 1234',
    lat: -25.2867, lng: -57.6471,
    services: [
      { label: 'Culto Dominical', startTime: '10:00', hasLiveStream: true,
        recurrence: { kind: 'WEEKLY', dayOfWeek: 0 } },
    ],
    events: [
      {
        title: 'Retiro de Jóvenes',
        description: 'Fin de semana de comunhão para os jovens.',
        inDays: 21, startTime: '08:00', durationHours: 30,
        acceptingVolunteers: true,
      },
    ],
  },
  {
    name: 'Tabernáculo Buenos Aires',
    city: 'Buenos Aires',
    country: 'Argentina',
    address: 'Av. Corrientes 9000',
    lat: -34.6037, lng: -58.3816,
    services: [
      { label: 'Culto Dominical', startTime: '11:00',
        recurrence: { kind: 'WEEKLY', dayOfWeek: 0 } },
      { label: 'Estudio Bíblico', startTime: '20:00',
        recurrence: { kind: 'WEEKLY', dayOfWeek: 4 } },
    ],
  },
  {
    name: 'Tabernáculo Santiago',
    city: 'Santiago',
    country: 'Chile',
    address: 'Calle Ejemplo 700',
    lat: -33.4489, lng: -70.6693,
    youtube: 'https://youtube.com/@example-tab-santiago',
    services: [
      { label: 'Culto Dominical', startTime: '10:30', hasLiveStream: true,
        recurrence: { kind: 'WEEKLY', dayOfWeek: 0 } },
    ],
  },
  {
    name: 'Tabernáculo CDMX',
    city: 'Ciudad de México',
    country: 'México',
    address: 'Calzada Ejemplo 200',
    lat: 19.4326, lng: -99.1332,
    services: [
      { label: 'Culto Dominical', startTime: '10:00',
        recurrence: { kind: 'WEEKLY', dayOfWeek: 0 } },
      { label: 'Estudio', startTime: '19:30',
        recurrence: { kind: 'WEEKLY', dayOfWeek: 3 } },
    ],
  },
];

async function main() {
  const args = new Set(process.argv.slice(2));
  const shouldReset = args.has('--reset') || args.has('-r');

  console.log(`[seed] driver=${container.driver}${shouldReset ? ' (reset mode)' : ''}`);
  await ensureIndexes();

  if (shouldReset) {
    await wipeCollections();
  }

  const now = new Date();

  for (const fx of FIXTURES) {
    const slug = slugify(`${fx.name} ${fx.city}`);
    const churchId = stableIdFromSlug(slug);
    const church: Church = {
      id: churchId,
      slug,
      name: fx.name,
      description: fx.description,
      physicalAddress: fx.address,
      city: fx.city,
      country: fx.country,
      coords: makeCoordinates(fx.lat, fx.lng),
      social: {
        youtubeUrl: fx.youtube,
        instagramUrl: fx.instagram,
        websiteUrl: fx.website,
      },
      pix: {},
      ownershipStatus: 'UNCLAIMED',
      createdAt: now,
      updatedAt: now,
    };

    await container.churches.save(church);
    console.log(`[seed] church upserted: ${church.slug}`);

    // First pass — assign stable ids by fixture label so cross-service rules
    // can resolve references in the second pass.
    const drafts = fx.services.map((s) => ({
      fixture: s,
      draft: {
        id: stableIdFromSlug(`${slug}-${recurrenceKey(s.recurrence)}-${s.startTime}-${s.label}`),
        churchId,
        label: s.label,
        startTime: s.startTime,
        endTime: s.endTime,
        hasLiveStream: Boolean(s.hasLiveStream),
        recurrence: s.recurrence,
        exceptions: [...(s.exceptions ?? [])] as ServiceException[],
        cancelRules: [] as ServiceCancelRule[],
      } satisfies Service,
    }));

    // Second pass — resolve cancelWhen labels to triggerServiceIds.
    for (const d of drafts) {
      for (const rule of d.fixture.cancelWhen ?? []) {
        const source = drafts.find((x) => x.draft.label === rule.triggerLabel);
        if (!source) continue;
        d.draft.cancelRules.push({
          triggerServiceId: source.draft.id,
          daysOffset: rule.daysOffset,
          reason: rule.reason,
        });
      }
    }

    for (const { draft } of drafts) {
      await container.services.save(draft);
    }

    for (const ev of fx.events ?? []) {
      const start = new Date(now);
      start.setDate(start.getDate() + ev.inDays);
      const [h, m] = ev.startTime.split(':').map((s) => Number(s));
      start.setHours(h ?? 0, m ?? 0, 0, 0);

      const end = new Date(start);
      if (ev.durationHours) end.setHours(end.getHours() + ev.durationHours);

      const eventSlug = slugify(ev.title);
      const event: Event = {
        id: stableIdFromSlug(`${slug}-event-${eventSlug}`),
        churchId,
        slug: eventSlug,
        title: ev.title,
        description: ev.description,
        startDatetime: start,
        endDatetime: ev.durationHours ? end : undefined,
        eventLocation: ev.location,
        acceptingVolunteers: Boolean(ev.acceptingVolunteers),
        createdAt: now,
        updatedAt: now,
      };
      await container.events.save(event);
    }
  }

  console.log('[seed] done.');
}

/**
 * Drop everything we own. Used by `pnpm seed:reset` when the schema changed
 * and old documents would otherwise stick around with the previous shape.
 */
async function wipeCollections() {
  const { getDb } = await import('../src/infrastructure/mongo/client');
  const db = await getDb();
  const result = await Promise.all([
    db.collection('services').deleteMany({}),
    db.collection('events').deleteMany({}),
    db.collection('churches').deleteMany({}),
  ]);
  console.log('[seed] wiped:',
    `services=${result[0].deletedCount}`,
    `events=${result[1].deletedCount}`,
    `churches=${result[2].deletedCount}`,
  );
}

function recurrenceKey(r: ServiceRecurrence): string {
  return r.kind === 'WEEKLY' ? `w${r.dayOfWeek}` : `m${r.nth}d${r.dayOfWeek}`;
}

/**
 * Deterministic id from a slug — reruns of the seed don't create duplicates.
 * (Cheap and good enough for fixtures; production code uses uuidv7.)
 */
function stableIdFromSlug(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const hex = h.toString(16).padStart(8, '0');
  return `seed-${hex}-${s.slice(0, 24)}`;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeMongo();
  });

// silence unused warning if randomUUID isn't used (kept for future fixtures)
void randomUUID;
