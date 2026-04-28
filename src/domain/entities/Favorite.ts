/**
 * A user's "I want to keep an eye on this church" mark.
 * Lives in its own entity so the join table stays clean and indexable.
 */
export interface Favorite {
  userId: string;
  churchId: string;
  createdAt: Date;
}
