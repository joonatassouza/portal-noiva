import { ChurchRole, ChurchRoleType } from '@/domain/entities/ChurchRole';

export interface RoleRepository {
  findByUserAndChurch(userId: string, churchId: string): Promise<ChurchRole | null>;
  listByChurch(churchId: string): Promise<ChurchRole[]>;
  listChurchIdsByUser(userId: string): Promise<string[]>;
  /** Idempotent: if user already has a role on this church it's overwritten. */
  upsert(role: Omit<ChurchRole, 'id' | 'createdAt'> & { id?: string }): Promise<ChurchRole>;
  remove(churchId: string, userId: string): Promise<void>;
}

export type { ChurchRoleType };
