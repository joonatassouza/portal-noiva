import { Favorite } from '@/domain/entities/Favorite';

export interface FavoriteRepository {
  /** Insert idempotently. Returns the resulting record (whether it existed or not). */
  add(userId: string, churchId: string): Promise<Favorite>;
  remove(userId: string, churchId: string): Promise<void>;
  isFavorited(userId: string, churchId: string): Promise<boolean>;
  /** Returns the church ids the user has favorited, newest first. */
  listChurchIdsByUser(userId: string): Promise<string[]>;
}
