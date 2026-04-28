import { ChurchProposal, ChurchProposalStatus } from '@/domain/entities/ChurchProposal';

export interface ChurchProposalRepository {
  findById(id: string): Promise<ChurchProposal | null>;
  listPending(): Promise<ChurchProposal[]>;
  listByProposer(userId: string): Promise<ChurchProposal[]>;
  /** Returns true if the same proposer already has a pending proposal for the same name+city. */
  hasPendingDuplicate(args: {
    proposerUserId: string;
    name: string;
    city: string;
  }): Promise<boolean>;
  save(proposal: ChurchProposal): Promise<void>;
  updateStatus(args: {
    id: string;
    status: ChurchProposalStatus;
    reviewerId: string;
    notes?: string;
    createdChurchId?: string;
  }): Promise<void>;
}
