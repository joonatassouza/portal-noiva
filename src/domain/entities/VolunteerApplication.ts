/**
 * Someone offering to volunteer at a specific Event
 * (e.g. photographer for an Easter conference).
 *
 * The platform doesn't manage assignments — the church team contacts the
 * applicant offline. We just track the lifecycle for transparency.
 */
export type VolunteerStatus =
  | 'SUBMITTED'
  | 'CONTACTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'; // self-cancelled by the applicant

export interface VolunteerApplication {
  id: string;
  eventId: string;
  /** Denormalized for owner-side filtering and notifications. */
  churchId: string;
  applicantUserId: string;
  applicantEmail: string;
  applicantName?: string;
  /**
   * Snapshot of the applicant's WhatsApp at the moment of applying. Optional
   * — applicant decides whether to share. Stored on the application itself so
   * the church team sees the contact even if the user later edits their profile.
   */
  applicantWhatsapp?: string;
  /** Free text — "Photographer", "Sound engineer", "Cleaning", etc. */
  offeredRole: string;
  coverMessage?: string;
  status: VolunteerStatus;
  /** Notes the church team writes to coordinate with the applicant offline. */
  reviewerNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
