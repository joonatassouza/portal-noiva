/**
 * Membership of a user in a church's administrative team.
 * - OWNER: edits everything, manages PIX, invites editors, transfers ownership.
 * - EDITOR_ADMIN: edits info / services / events. No PIX, no role management.
 * - MEDIA_EDITOR: only creates/edits media posts (Phase 5).
 */
export type ChurchRoleType = 'OWNER' | 'EDITOR_ADMIN' | 'MEDIA_EDITOR';

export interface ChurchRole {
  id: string;
  churchId: string;
  userId: string;
  roleType: ChurchRoleType;
  createdAt: Date;
}
