import { ChurchRepository, ChurchListOptions } from '@/application/ports/ChurchRepository';
import { Church } from '@/domain/entities/Church';

export interface ChurchesPageData {
  items: Church[];
  total: number;
  countries: string[];
}

/**
 * Loads everything the /igrejas page needs in a single use case:
 * the filtered list, the total count for the active filters, and the
 * full distinct list of countries (used to populate the filter dropdown).
 */
export class ListChurchesPage {
  constructor(private readonly churches: ChurchRepository) {}

  async execute(opts: ChurchListOptions = {}): Promise<ChurchesPageData> {
    const [items, total, countries] = await Promise.all([
      this.churches.list({ limit: 48, ...opts }),
      this.churches.count({ country: opts.country, search: opts.search }),
      this.churches.listCountries(),
    ]);
    return { items, total, countries };
  }
}
