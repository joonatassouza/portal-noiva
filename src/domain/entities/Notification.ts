/**
 * In-app notification. No e-mail, no push, no SMS.
 * Read either via polling or (later) via Supabase realtime.
 */
export type NotificationType =
  | 'OWNERSHIP_CLAIM_SUBMITTED'
  | 'OWNERSHIP_CLAIM_APPROVED'
  | 'OWNERSHIP_CLAIM_REJECTED'
  | 'VOLUNTEER_APPLICATION_NEW'
  | 'VOLUNTEER_STATUS_CHANGED'
  | 'INVITATION_ACCEPTED'
  | 'ROLE_GRANTED'
  | 'MEDIA_COMMENT_NEW'
  | 'MEDIA_POST_REPORT';

export interface Notification {
  id: string;
  recipientUserId: string;
  type: NotificationType;
  /** Pre-translated title shown in the bell drawer. */
  title: string;
  /** Optional one-line body. */
  body?: string;
  /** Optional in-app deep link (e.g. /admin/claims, /painel/.../eventos/...). */
  href?: string;
  /** Free-form payload — useful for future re-rendering / analytics. */
  payload?: Record<string, unknown>;
  readAt?: Date;
  createdAt: Date;
}
