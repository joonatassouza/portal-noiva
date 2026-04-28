import createMiddleware from 'next-intl/middleware';
import { defaultLocale, locales } from '@/presentation/i18n/config';

export default createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
});

export const config = {
  // Match all paths except Next internals, files with an extension, and api.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
