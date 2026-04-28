import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

export function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();
  return (
    <footer className="mt-12 border-t border-border bg-surface">
      <div className="container-page py-6 text-xs text-muted sm:flex sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Portal Noiva — {t('rights')}</p>
        <div className="mt-1 flex flex-wrap items-center gap-3 sm:mt-0">
          <Link href={`/${locale}/privacidade`} className="text-ink-soft hover:text-gold">
            {t('privacy')}
          </Link>
          <span aria-hidden>·</span>
          <span>{t('osm')}</span>
        </div>
      </div>
    </footer>
  );
}
