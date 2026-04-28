import { Church } from '@/domain/entities/Church';
import { Event } from '@/domain/entities/Event';
import { Service } from '@/domain/entities/Service';
import { makeCoordinates } from '@/domain/value-objects/Coordinates';

/**
 * Domain <-> Mongo document mappers.
 * Mongo-specific shape (e.g. GeoJSON `geo` field) lives ONLY here.
 */

export interface ChurchDoc {
  _id: string;            // we use string ids (uuid) instead of ObjectId
  slug: string;
  name: string;
  description?: string;
  physicalAddress: string;
  city: string;
  country: string;
  geo?: { type: 'Point'; coordinates: [number, number] }; // [lng, lat]
  social?: {
    youtubeUrl?: string;
    instagramUrl?: string;
    facebookUrl?: string;
    websiteUrl?: string;
  };
  pix?: { pixKey?: string; pixQrcodeImageUrl?: string };
  ownershipStatus: 'UNCLAIMED' | 'PENDING_REVIEW' | 'CLAIMED';
  createdAt: Date;
  updatedAt: Date;
}

export function toChurchDoc(c: Church): ChurchDoc {
  return {
    _id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    physicalAddress: c.physicalAddress,
    city: c.city,
    country: c.country,
    geo: c.coords
      ? { type: 'Point', coordinates: [c.coords.lng, c.coords.lat] }
      : undefined,
    social: c.social,
    pix: c.pix,
    ownershipStatus: c.ownershipStatus,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

export function fromChurchDoc(d: ChurchDoc): Church {
  return {
    id: d._id,
    slug: d.slug,
    name: d.name,
    description: d.description,
    physicalAddress: d.physicalAddress,
    city: d.city,
    country: d.country,
    coords: d.geo
      ? makeCoordinates(d.geo.coordinates[1], d.geo.coordinates[0])
      : undefined,
    social: d.social ?? {},
    pix: d.pix ?? {},
    ownershipStatus: d.ownershipStatus,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

export interface ServiceDoc {
  _id: string;
  churchId: string;
  label: string;
  startTime: string;
  endTime?: string;
  hasLiveStream: boolean;
  /** Optional in storage to tolerate documents from the previous schema. */
  recurrence?:
    | { kind: 'WEEKLY'; dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6 }
    | {
        kind: 'MONTHLY_NTH_WEEKDAY';
        nth: 1 | 2 | 3 | 4 | -1;
        dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
      };
  exceptions?: Array<{
    date: string;
    kind: 'CANCEL' | 'OVERRIDE';
    reason?: string;
    override?: {
      startTime?: string;
      endTime?: string;
      label?: string;
      hasLiveStream?: boolean;
    };
  }>;
  cancelRules?: Array<{
    triggerServiceId: string;
    daysOffset: number;
    reason?: string;
  }>;
  /** Legacy field — earlier schema had dayOfWeek at the root. */
  dayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
}

export function toServiceDoc(s: Service): ServiceDoc {
  return {
    _id: s.id,
    churchId: s.churchId,
    label: s.label,
    startTime: s.startTime,
    endTime: s.endTime,
    hasLiveStream: s.hasLiveStream,
    recurrence: s.recurrence,
    exceptions: s.exceptions ?? [],
    cancelRules: s.cancelRules ?? [],
  };
}

/**
 * Reads a Service document, transparently up-migrating legacy shapes.
 * Old documents had `dayOfWeek` at the root and no `recurrence`/`exceptions`/`cancelRules`.
 */
export function fromServiceDoc(d: ServiceDoc): Service {
  const recurrence =
    d.recurrence ??
    (d.dayOfWeek !== undefined
      ? ({ kind: 'WEEKLY', dayOfWeek: d.dayOfWeek } as const)
      : ({ kind: 'WEEKLY', dayOfWeek: 0 } as const)); // last-resort default

  return {
    id: d._id,
    churchId: d.churchId,
    label: d.label,
    startTime: d.startTime,
    endTime: d.endTime,
    hasLiveStream: d.hasLiveStream,
    recurrence,
    exceptions: d.exceptions ?? [],
    cancelRules: d.cancelRules ?? [],
  };
}

export interface EventDoc {
  _id: string;
  churchId: string;
  slug: string;
  title: string;
  description?: string;
  startDatetime: Date;
  endDatetime?: Date;
  eventLocation?: string;
  acceptingVolunteers: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function toEventDoc(e: Event): EventDoc {
  return {
    _id: e.id,
    churchId: e.churchId,
    slug: e.slug,
    title: e.title,
    description: e.description,
    startDatetime: e.startDatetime,
    endDatetime: e.endDatetime,
    eventLocation: e.eventLocation,
    acceptingVolunteers: e.acceptingVolunteers,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
}

export function fromEventDoc(d: EventDoc): Event {
  return {
    id: d._id,
    churchId: d.churchId,
    slug: d.slug,
    title: d.title,
    description: d.description,
    startDatetime: d.startDatetime,
    endDatetime: d.endDatetime,
    eventLocation: d.eventLocation,
    acceptingVolunteers: d.acceptingVolunteers,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}
