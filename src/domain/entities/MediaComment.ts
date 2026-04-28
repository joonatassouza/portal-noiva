/**
 * A simple comment on a MediaPost. No replies, no likes, no mentions.
 * Hard-capped at 500 characters.
 */
export const MEDIA_COMMENT_MAX_LENGTH = 500;

export interface MediaComment {
  id: string;
  mediaPostId: string;
  authorUserId: string;
  /** Author's display name at time of writing — denormalized for rendering. */
  authorName?: string;
  body: string;
  createdAt: Date;
}
