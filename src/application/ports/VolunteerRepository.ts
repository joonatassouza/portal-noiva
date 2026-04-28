import { VolunteerApplication, VolunteerStatus } from '@/domain/entities/VolunteerApplication';

export interface VolunteerRepository {
  findById(id: string): Promise<VolunteerApplication | null>;
  findByEventAndUser(eventId: string, userId: string): Promise<VolunteerApplication | null>;
  listByEvent(eventId: string): Promise<VolunteerApplication[]>;
  listByChurch(churchId: string): Promise<VolunteerApplication[]>;
  hasApplied(eventId: string, userId: string): Promise<boolean>;
  save(application: VolunteerApplication): Promise<void>;
  updateStatus(
    id: string,
    status: VolunteerStatus,
    reviewerId: string,
    notes?: string,
  ): Promise<void>;
}
