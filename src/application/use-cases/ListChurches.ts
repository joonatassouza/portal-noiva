import { ChurchRepository, ChurchListOptions } from '@/application/ports/ChurchRepository';
import { Church } from '@/domain/entities/Church';

export class ListChurches {
  constructor(private readonly churches: ChurchRepository) {}

  async execute(opts: ChurchListOptions = {}): Promise<{ items: Church[]; total: number }> {
    const [items, total] = await Promise.all([
      this.churches.list({ limit: 24, ...opts }),
      this.churches.count({ country: opts.country, search: opts.search }),
    ]);
    return { items, total };
  }
}
