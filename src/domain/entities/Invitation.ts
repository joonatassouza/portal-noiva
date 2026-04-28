import { ChurchRoleType } from './ChurchRole';

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'CANCELLED' | 'EXPIRED';

export interface Invitation {
  id: string;
  /** Random URL-safe token used in /convite/[token]. */
  token: string;
  churchId: string;
  email: string;
  roleType: ChurchRoleType;
  invitedByUserId: string;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt: Date;
  acceptedAt?: Date;
  acceptedByUserId?: string;
}
