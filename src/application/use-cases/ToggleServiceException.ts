import { ServiceRepository } from '@/application/ports/ServiceRepository';
import { RoleRepository } from '@/application/ports/RoleRepository';
import { NotFoundError } from '@/domain/errors/DomainError';
import { Service, ServiceException } from '@/domain/entities/Service';
import { assertChurchAccess, Principal } from '@/domain/policies/access';

/**
 * Adds or removes a CANCEL exception for a single date on a service.
 * Idempotent: passing the same date twice toggles it off.
 */
export class ToggleServiceException {
  constructor(
    private readonly services: ServiceRepository,
    private readonly roles: RoleRepository,
  ) {}

  async execute(
    principal: Principal | null,
    args: { churchId: string; serviceId: string; date: string; reason?: string },
  ): Promise<Service> {
    if (!principal) throw new Error('Login required.');
    const role = await this.roles.findByUserAndChurch(principal.userId, args.churchId);
    assertChurchAccess(principal, role, 'EDITOR_ADMIN');

    const list = await this.services.listByChurch(args.churchId);
    const svc = list.find((s) => s.id === args.serviceId);
    if (!svc) throw new NotFoundError('Service', args.serviceId);

    const exceptions = svc.exceptions ?? [];
    const existing = exceptions.findIndex((e) => e.date === args.date && e.kind === 'CANCEL');

    let next: ServiceException[];
    if (existing >= 0) {
      next = [...exceptions.slice(0, existing), ...exceptions.slice(existing + 1)];
    } else {
      next = [...exceptions, { date: args.date, kind: 'CANCEL', reason: args.reason }];
    }

    const updated: Service = { ...svc, exceptions: next };
    await this.services.save(updated);
    return updated;
  }
}
