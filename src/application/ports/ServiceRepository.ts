import { Service } from '@/domain/entities/Service';

export interface ServiceRepository {
  listByChurch(churchId: string): Promise<Service[]>;
  /**
   * Returns every service in the catalog. Used by the upcoming-services
   * projection, which expands recurrence rules in memory.
   * `limit` defaults to 5000 — the MVP cap.
   */
  listAll(limit?: number): Promise<Service[]>;
  save(service: Service): Promise<void>;
  deleteById(id: string): Promise<void>;
}
