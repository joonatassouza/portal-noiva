import { MediaStorage, PresignedUpload } from '@/application/ports/MediaStorage';
import { RoleRepository } from '@/application/ports/RoleRepository';
import { ChurchRepository } from '@/application/ports/ChurchRepository';
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@/domain/errors/DomainError';
import { assertChurchAccess, Principal } from '@/domain/policies/access';

const MAX_BYTES_PER_IMAGE = 250 * 1024; // 250 KB ceiling — client compresses to ≤ 200 KB.
const ALLOWED_TYPES = new Set(['image/webp', 'image/jpeg', 'image/png']);

export class PresignMediaUpload {
  constructor(
    private readonly storage: MediaStorage,
    private readonly roles: RoleRepository,
    private readonly churches: ChurchRepository,
  ) {}

  async execute(
    principal: Principal | null,
    args: { churchId: string; contentType: string; sizeBytes: number; extension?: string },
  ): Promise<PresignedUpload> {
    if (!principal) throw new UnauthorizedError('Login required.');
    const church = await this.churches.findById(args.churchId);
    if (!church) throw new NotFoundError('Church', args.churchId);

    const role = await this.roles.findByUserAndChurch(principal.userId, args.churchId);
    assertChurchAccess(principal, role, 'MEDIA_EDITOR');

    if (!ALLOWED_TYPES.has(args.contentType)) {
      throw new ValidationError(`Unsupported content type: ${args.contentType}`);
    }
    if (args.sizeBytes <= 0 || args.sizeBytes > MAX_BYTES_PER_IMAGE) {
      throw new ValidationError(
        `Image too large (${args.sizeBytes} bytes). Compress to ≤ ${MAX_BYTES_PER_IMAGE / 1024} KB before uploading.`,
      );
    }

    return this.storage.presignUpload({
      contentType: args.contentType,
      sizeBytes: args.sizeBytes,
      extension: args.extension,
    });
  }
}
