import { ChurchRepository } from '@/application/ports/ChurchRepository';
import { EventRepository } from '@/application/ports/EventRepository';
import { ProfileRepository } from '@/application/ports/ProfileRepository';
import { VolunteerRepository } from '@/application/ports/VolunteerRepository';
import { NotifyChurchAdmins } from '@/application/use-cases/NotifyChurchAdmins';
import { VolunteerApplication } from '@/domain/entities/VolunteerApplication';
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@/domain/errors/DomainError';
import { Principal } from '@/domain/policies/access';
import { randomUUID } from '@/shared/uuid';
import { normalizeWhatsapp } from '@/shared/whatsapp';

export interface ApplyAsVolunteerInput {
  eventId: string;
  offeredRole: string;
  coverMessage?: string;
  applicantName?: string;
  /**
   * If omitted, falls back to the user's profile WhatsApp.
   * Pass the empty string to explicitly opt OUT of sharing it.
   */
  applicantWhatsapp?: string;
}

export class ApplyAsVolunteer {
  constructor(
    private readonly volunteers: VolunteerRepository,
    private readonly events: EventRepository,
    private readonly churches: ChurchRepository,
    private readonly profiles: ProfileRepository,
    private readonly notifyAdmins: NotifyChurchAdmins,
  ) {}

  async execute(
    principal: Principal | null,
    input: ApplyAsVolunteerInput,
  ): Promise<VolunteerApplication> {
    if (!principal) throw new UnauthorizedError('Login required to volunteer.');
    if (input.offeredRole.trim().length < 2) {
      throw new ValidationError('Tell us what role you are offering.');
    }

    const event = await this.events.findById(input.eventId);
    if (!event) throw new NotFoundError('Event', input.eventId);
    if (!event.acceptingVolunteers) {
      throw new ValidationError('This event is not accepting volunteers.');
    }

    // If the user already has an application — even cancelled — re-use the row
    // by re-opening it. `hasApplied` returns true for any status, which made
    // this branch friendly when CANCELLED was added.
    const existing = await this.volunteers.findByEventAndUser(event.id, principal.userId);
    if (existing && existing.status !== 'CANCELLED') {
      throw new ValidationError('You have already applied to this event.');
    }

    // Resolve WhatsApp: explicit input wins; empty string opts out; fallback
    // to the user's profile.
    let applicantWhatsapp: string | undefined;
    if (input.applicantWhatsapp !== undefined) {
      applicantWhatsapp = input.applicantWhatsapp.trim()
        ? normalizeWhatsapp(input.applicantWhatsapp)
        : undefined;
    } else {
      const profile = await this.profiles.findByUserId(principal.userId);
      applicantWhatsapp = profile?.whatsappNumber;
    }

    const now = new Date();
    const application: VolunteerApplication = {
      id: existing?.id ?? randomUUID(),
      eventId: event.id,
      churchId: event.churchId,
      applicantUserId: principal.userId,
      applicantEmail: principal.email,
      applicantName: input.applicantName?.trim() || existing?.applicantName,
      applicantWhatsapp,
      offeredRole: input.offeredRole.trim(),
      coverMessage: input.coverMessage?.trim() || undefined,
      status: 'SUBMITTED',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await this.volunteers.save(application);

    const church = await this.churches.findById(event.churchId);
    await this.notifyAdmins.execute({
      churchId: event.churchId,
      type: 'VOLUNTEER_APPLICATION_NEW',
      title: `${input.applicantName ?? principal.email} se ofereceu como ${input.offeredRole.trim()}`,
      body: event.title,
      href: church ? `/painel/${church.slug}/voluntarios` : undefined,
      payload: { applicationId: application.id, eventId: event.id },
    });

    return application;
  }
}
