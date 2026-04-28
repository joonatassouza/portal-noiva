import { MediaComment } from '@/domain/entities/MediaComment';

export interface MediaCommentRepository {
  findById(id: string): Promise<MediaComment | null>;
  listByPost(postId: string): Promise<MediaComment[]>;
  countByPost(postId: string): Promise<number>;
  save(comment: MediaComment): Promise<void>;
  deleteById(id: string): Promise<void>;
}
