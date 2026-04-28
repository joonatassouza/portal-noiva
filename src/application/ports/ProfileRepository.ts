import { Profile } from '@/domain/entities/Profile';

export interface ProfileRepository {
  findByUserId(userId: string): Promise<Profile | null>;
  /** Bulk fetch — used by the church page to render every admin contact. */
  findManyByUserIds(userIds: string[]): Promise<Profile[]>;
  /** Idempotent upsert. */
  save(profile: Profile): Promise<void>;
}
