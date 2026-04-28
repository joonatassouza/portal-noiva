import { ServiceRepository } from '@/application/ports/ServiceRepository';
import { RoleRepository } from '@/application/ports/RoleRepository';
import { NotFoundError } from '@/domain/errors/DomainError';
import { assertChurchAccess, Principal } from '@/domain/policies/access';

export class DeleteService {
  constructor(
    private readonly services: ServiceRepository,
    private readonly roles: RoleRepository,
  ) {}

  async execute(principal: Principal | null, serviceId: string, churchId: string): Promise<void> {
    if (!principal) throw new Error('Login required.');
    const role = await this.roles.findByUserAndChurch(principal.userId, churchId);
    assertChurchAccess(principal, role, 'EDITOR_ADMIN');

    const list = await this.services.listByChurch(churchId);
    const target = list.find((s) => s.id === serviceId);
    if (!target) throw new NotFoundError('Service', serviceId);

    await this.services.deleteById(serviceId);
  }
}
