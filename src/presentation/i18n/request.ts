import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, isAppLocale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested && isAppLocale(requested) ? requested : defaultLocale;
  const messages = (await import(`../../../messages/${locale}.json`)).default;
  return { locale, messages };
});
