import { redirect } from 'next/navigation';
import { defaultLocale } from '@/presentation/i18n/config';

// Root path -> redirect to default locale.
// (Middleware also handles this, but having a fallback avoids edge cases.)
export default function RootIndex() {
  redirect(`/${defaultLocale}`);
}
