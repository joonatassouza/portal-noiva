import { VolunteerRepository } from '@/application/ports/VolunteerRepository';
import { VolunteerApplication } from '@/domain/entities/VolunteerApplication';
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@/domain/errors/DomainError';
import { Principal } from '@/domain/policies/access';
import { normalizeWhatsapp } from '@/shared/whatsapp';

/**
 * Volunteer-side edit. Only the applicant can change their own application,
 * and only while the church team hasn't moved it to ACCEPTED/REJECTED — those
 * outcomes are owned by the team and shouldn't be re-opened by the applicant.
 */
export class UpdateMyVolunteerApplication {
  constructor(private readonly volunteers: VolunteerRepository) {}

  async execute(
    principal: Principal | null,
    args: {
      applicationId: string;
      offeredRole?: string;
      coverMessage?: string;
      applicantName?: string;
      /** Empty string clears it. */
      applicantWhatsapp?: string;
    },
  ): Promise<VolunteerApplication> {
    if (!principal) throw new UnauthorizedError('Login required.');

    const app = await this.volunteers.findById(args.applicationId);
    if (!app) throw new NotFoundError('VolunteerApplication', args.applicationId);
    if (app.applicantUserId !== principal.userId) {
      throw new UnauthorizedError('You can only edit your own application.');
    }
    if (app.status === 'ACCEPTED' || app.status === 'REJECTED') {
      throw new ValidationError(
        'This application has already been reviewed. Contact the church directly to change anything.',
      );
    }

    if (args.offeredRole !== undefined && args.offeredRole.trim().length < 2) {
      throw new ValidationError('Offered role is too short.');
    }

    const next: VolunteerApplication = {
      ...app,
      offeredRole: args.offeredRole?.trim() || app.offeredRole,
      coverMessage:
        args.coverMessage !== undefined
          ? args.coverMessage.trim() || undefined
          : app.coverMessage,
      applicantName:
        args.applicantName !== undefined
          ? args.applicantName.trim() || undefined
          : app.applicantName,
      applicantWhatsapp:
        args.applicantWhatsapp !== undefined
          ? args.applicantWhatsapp.trim()
            ? normalizeWhatsapp(args.applicantWhatsapp)
            : undefined
          : app.applicantWhatsapp,
      // Re-open if the church team had already marked CONTACTED — they can flip back.
      status: app.status === 'CANCELLED' ? 'SUBMITTED' : app.status,
      updatedAt: new Date(),
    };
    await this.volunteers.save(next);
    return next;
  }
}
