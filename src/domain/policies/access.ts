import { ChurchRole, ChurchRoleType } from '@/domain/entities/ChurchRole';
import { UnauthorizedError } from '@/domain/errors/DomainError';

export interface Principal {
  userId: string;
  email: string;
  isMasterAdmin: boolean;
}

const RANK: Record<ChurchRoleType, number> = {
  MEDIA_EDITOR: 1,
  EDITOR_ADMIN: 2,
  OWNER: 3,
};

export function hasAtLeast(role: ChurchRoleType | null | undefined, minimum: ChurchRoleType): boolean {
  if (!role) return false;
  return RANK[role] >= RANK[minimum];
}

/** Throws unless principal is master admin OR holds at least the minimum role. */
export function assertChurchAccess(
  principal: Principal | null,
  role: ChurchRole | null,
  minimum: ChurchRoleType,
): asserts principal is Principal {
  if (!principal) throw new UnauthorizedError('Login required.');
  if (principal.isMasterAdmin) return;
  if (!role || role.userId !== principal.userId) {
    throw new UnauthorizedError('You are not a member of this church.');
  }
  if (!hasAtLeast(role.roleType, minimum)) {
    throw new UnauthorizedError(`This action requires at least ${minimum}.`);
  }
}

export function assertMasterAdmin(principal: Principal | null): asserts principal is Principal {
  if (!principal) throw new UnauthorizedError('Login required.');
  if (!principal.isMasterAdmin) throw new UnauthorizedError('Master admin only.');
}
