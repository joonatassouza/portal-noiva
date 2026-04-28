'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { Button } from '@/presentation/components/ui/Button';
import { SearchInput } from '@/presentation/components/ui/SearchInput';

interface HomeSearchFormProps {
  locale: string;
}

/**
 * Google-style search form for the home hero.
 * Submits to /{locale}/igrejas?q=... so the listing page does the actual search.
 */
export function HomeSearchForm({ locale }: HomeSearchFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [value, setValue] = useState('');

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = value.trim();
    const target = q
      ? `/${locale}/igrejas?q=${encodeURIComponent(q)}`
      : `/${locale}/igrejas`;
    router.push(target);
  }

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      aria-label={t('home.searchAria')}
      className="flex w-full max-w-2xl flex-col gap-2 sm:flex-row sm:items-center"
    >
      <div className="flex-1">
        <label htmlFor="home-search" className="sr-only">
          {t('home.searchPlaceholder')}
        </label>
        <SearchInput
          id="home-search"
          name="q"
          autoComplete="off"
          enterKeyHint="search"
          placeholder={t('home.searchPlaceholder')}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <Button type="submit" variant="primary" size="md">
        {t('home.searchSubmit')}
      </Button>
    </form>
  );
}
