import { ServiceRepository } from '@/application/ports/ServiceRepository';
import { RoleRepository } from '@/application/ports/RoleRepository';
import {
  Service,
  ServiceCancelRule,
  ServiceException,
  ServiceRecurrence,
} from '@/domain/entities/Service';
import { ValidationError } from '@/domain/errors/DomainError';
import { assertChurchAccess, Principal } from '@/domain/policies/access';
import { randomUUID } from '@/shared/uuid';

export interface UpsertServiceInput {
  id?: string;
  churchId: string;
  label: string;
  startTime: string; // HH:mm
  endTime?: string;
  hasLiveStream: boolean;
  recurrence: ServiceRecurrence;
  exceptions?: ServiceException[];
  cancelRules?: ServiceCancelRule[];
}

export class UpsertService {
  constructor(
    private readonly services: ServiceRepository,
    private readonly roles: RoleRepository,
  ) {}

  async execute(principal: Principal | null, input: UpsertServiceInput): Promise<Service> {
    if (!principal) throw new Error('Login required.');
    const role = await this.roles.findByUserAndChurch(principal.userId, input.churchId);
    assertChurchAccess(principal, role, 'EDITOR_ADMIN');

    if (!/^\d{2}:\d{2}$/.test(input.startTime)) {
      throw new ValidationError('Invalid start time. Use HH:mm.');
    }
    if (input.endTime && !/^\d{2}:\d{2}$/.test(input.endTime)) {
      throw new ValidationError('Invalid end time.');
    }
    if (!input.label.trim()) throw new ValidationError('Label is required.');

    const id = input.id ?? randomUUID();

    // Validate cancel rules: trigger services must exist, belong to the same
    // church, and never be the service itself (to prevent cycles).
    const cancelRules: ServiceCancelRule[] = [];
    if (input.cancelRules && input.cancelRules.length > 0) {
      const peers = await this.services.listByChurch(input.churchId);
      const peerIds = new Set(peers.map((p) => p.id));
      for (const rule of input.cancelRules) {
        if (rule.triggerServiceId === id) {
          throw new ValidationError('A service cannot cancel itself.');
        }
        if (!peerIds.has(rule.triggerServiceId)) {
          throw new ValidationError('Trigger service must belong to the same church.');
        }
        if (!Number.isFinite(rule.daysOffset)) {
          throw new ValidationError('Invalid daysOffset on cancel rule.');
        }
        cancelRules.push({
          triggerServiceId: rule.triggerServiceId,
          daysOffset: Math.trunc(rule.daysOffset),
          reason: rule.reason?.trim() || undefined,
        });
      }
    }

    const service: Service = {
      id,
      churchId: input.churchId,
      label: input.label.trim(),
      startTime: input.startTime,
      endTime: input.endTime || undefined,
      hasLiveStream: Boolean(input.hasLiveStream),
      recurrence: input.recurrence,
      exceptions: input.exceptions ?? [],
      cancelRules,
    };
    await this.services.save(service);
    return service;
  }
}
