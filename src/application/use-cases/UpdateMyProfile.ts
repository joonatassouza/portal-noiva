import { ProfileRepository } from '@/application/ports/ProfileRepository';
import { Locale, Profile } from '@/domain/entities/Profile';
import { UnauthorizedError } from '@/domain/errors/DomainError';
import { Principal } from '@/domain/policies/access';
import { normalizeWhatsapp } from '@/shared/whatsapp';

export interface UpdateMyProfileInput {
  displayName?: string;
  /** Free text — gets normalized and validated; pass empty string to clear. */
  whatsappNumber?: string;
  locale?: Locale;
}

export class UpdateMyProfile {
  constructor(private readonly profiles: ProfileRepository) {}

  async execute(principal: Principal | null, input: UpdateMyProfileInput): Promise<Profile> {
    if (!principal) throw new UnauthorizedError('Login required.');

    const existing = await this.profiles.findByUserId(principal.userId);
    const now = new Date();

    const next: Profile = {
      userId: principal.userId,
      displayName:
        input.displayName !== undefined
          ? input.displayName.trim() || undefined
          : existing?.displayName,
      whatsappNumber:
        input.whatsappNumber !== undefined
          ? normalizeWhatsapp(input.whatsappNumber)
          : existing?.whatsappNumber,
      locale: input.locale ?? existing?.locale,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await this.profiles.save(next);
    return next;
  }
}
