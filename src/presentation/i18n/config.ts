export const locales = ['pt-BR', 'es-LA'] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = 'pt-BR';

export function isAppLocale(value: string): value is AppLocale {
  return (locales as readonly string[]).includes(value);
}
