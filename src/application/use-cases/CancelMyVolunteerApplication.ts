import { VolunteerRepository } from '@/application/ports/VolunteerRepository';
import { VolunteerApplication } from '@/domain/entities/VolunteerApplication';
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@/domain/errors/DomainError';
import { Principal } from '@/domain/policies/access';

/**
 * Self-cancel an application. Cancelling is allowed at any stage except
 * REJECTED (already a terminal outcome). Cancelled applications stick around
 * with status=CANCELLED so the church team has the audit trail; re-applying
 * to the same event re-uses the same row.
 */
export class CancelMyVolunteerApplication {
  constructor(private readonly volunteers: VolunteerRepository) {}

  async execute(
    principal: Principal | null,
    applicationId: string,
  ): Promise<VolunteerApplication> {
    if (!principal) throw new UnauthorizedError('Login required.');

    const app = await this.volunteers.findById(applicationId);
    if (!app) throw new NotFoundError('VolunteerApplication', applicationId);
    if (app.applicantUserId !== principal.userId) {
      throw new UnauthorizedError('You can only cancel your own application.');
    }
    if (app.status === 'REJECTED') {
      throw new ValidationError('This application was already rejected.');
    }
    if (app.status === 'CANCELLED') return app;

    const next: VolunteerApplication = {
      ...app,
      status: 'CANCELLED',
      updatedAt: new Date(),
    };
    await this.volunteers.save(next);
    return next;
  }
}
