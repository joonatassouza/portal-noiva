import { Invitation, InvitationStatus } from '@/domain/entities/Invitation';

export interface InvitationRepository {
  findByToken(token: string): Promise<Invitation | null>;
  listByChurch(churchId: string): Promise<Invitation[]>;
  save(invitation: Invitation): Promise<void>;
  updateStatus(
    id: string,
    status: InvitationStatus,
    acceptedByUserId?: string,
  ): Promise<void>;
}
