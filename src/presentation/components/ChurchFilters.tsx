'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChangeEvent, FormEvent, useState, useTransition } from 'react';

import { SearchInput } from '@/presentation/components/ui/SearchInput';
import { Select } from '@/presentation/components/ui/Select';
import { Button } from '@/presentation/components/ui/Button';

interface ChurchFiltersProps {
  /** Distinct list of countries available in the catalog. */
  countries: string[];
  /** Current values from the URL — keep the form controlled by the URL. */
  initialCountry?: string;
  initialSearch?: string;
}

/**
 * Filter bar for the /igrejas page.
 * - Updates the URL search params (so server-rendering reads them).
 * - Country select auto-submits on change; search input submits on enter or button.
 */
export function ChurchFilters({
  countries,
  initialCountry = '',
  initialSearch = '',
}: ChurchFiltersProps) {
  const t = useTranslations('churches');
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [pending, startTransition] = useTransition();

  function pushParams(next: { country?: string; q?: string }) {
    const sp = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value && value.length > 0) sp.set(key, value);
      else sp.delete(key);
    }
    startTransition(() => {
      router.push(`?${sp.toString()}`);
    });
  }

  function onCountryChange(e: ChangeEvent<HTMLSelectElement>) {
    pushParams({ country: e.target.value, q: search });
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    pushParams({ country: initialCountry, q: search });
  }

  function onClear() {
    setSearch('');
    pushParams({ country: '', q: '' });
  }

  const hasFilters = (initialCountry?.length ?? 0) > 0 || search.length > 0;

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
      aria-busy={pending}
    >
      <div className="flex-1">
        <label htmlFor="church-search" className="sr-only">
          {t('search.placeholder')}
        </label>
        <SearchInput
          id="church-search"
          name="q"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('search.placeholder')}
        />
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="church-country" className="sr-only">
          {t('filters.country')}
        </label>
        <Select
          id="church-country"
          name="country"
          value={initialCountry}
          onChange={onCountryChange}
        >
          <option value="">{t('filters.allCountries')}</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>

        <Button type="submit" variant="primary" size="md">
          {t('search.placeholder').split(' ')[0]}
        </Button>

        {hasFilters && (
          <Button type="button" variant="ghost" size="md" onClick={onClear}>
            {t('filters.clear')}
          </Button>
        )}
      </div>
    </form>
  );
}
