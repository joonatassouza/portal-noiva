import { ClaimStatus, OwnershipClaim } from '@/domain/entities/OwnershipClaim';

export interface ClaimRepository {
  findById(id: string): Promise<OwnershipClaim | null>;
  listPending(): Promise<OwnershipClaim[]>;
  listByChurch(churchId: string): Promise<OwnershipClaim[]>;
  hasPendingForChurch(churchId: string): Promise<boolean>;
  save(claim: OwnershipClaim): Promise<void>;
  updateStatus(id: string, status: ClaimStatus, reviewerId: string, notes?: string): Promise<void>;
}
