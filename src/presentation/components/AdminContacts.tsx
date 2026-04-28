import { useTranslations } from 'next-intl';

import { Profile } from '@/domain/entities/Profile';
import { ChurchRole } from '@/domain/entities/ChurchRole';
import { Card } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';
import { displayWhatsapp, whatsappLink } from '@/shared/whatsapp';

interface AdminContactsProps {
  /** Roles to render (OWNER and/or EDITOR_ADMIN, deduped to one per user). */
  roles: ChurchRole[];
  /** Profiles keyed by userId. Roles without a profile fall back to a generic name. */
  profiles: Map<string, Profile>;
  /** Pre-prepared WhatsApp link template message (church name etc.) — optional. */
  whatsappPreset?: string;
}

/**
 * Public contact list shown on the church page. Each card has the admin's
 * display name, role badge and a WhatsApp action when the admin filled it in.
 */
export function AdminContacts({ roles, profiles, whatsappPreset }: AdminContactsProps) {
  const t = useTranslations('church.admins');

  // Dedupe by userId; OWNER beats EDITOR_ADMIN if a user holds both somehow.
  const byUser = new Map<string, ChurchRole>();
  for (const r of roles) {
    const existing = byUser.get(r.userId);
    if (!existing || r.roleType === 'OWNER') byUser.set(r.userId, r);
  }
  const ordered = Array.from(byUser.values()).sort((a, b) =>
    a.roleType === 'OWNER' ? -1 : b.roleType === 'OWNER' ? 1 : 0,
  );

  if (ordered.length === 0) return null;

  const visible = ordered.filter((r) => {
    const p = profiles.get(r.userId);
    // Only show admins that have at least filled WhatsApp; without it there's
    // nothing actionable to display publicly.
    return Boolean(p?.whatsappNumber);
  });

  if (visible.length === 0) {
    return (
      <Card pad="md">
        <p className="font-medium text-ink">{t('title')}</p>
        <p className="mt-2 text-xs text-muted">{t('emptyHint')}</p>
      </Card>
    );
  }

  return (
    <Card pad="md" className="space-y-3">
      <p className="font-medium text-ink">{t('title')}</p>
      <ul className="space-y-2">
        {visible.map((r) => {
          const p = profiles.get(r.userId);
          const link = whatsappLink(p?.whatsappNumber);
          const url = link
            ? whatsappPreset
              ? `${link}?text=${encodeURIComponent(whatsappPreset)}`
              : link
            : null;
          return (
            <li key={r.userId} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm text-ink">
                  {p?.displayName ?? t('genericName')}
                </p>
                <p className="text-xs text-muted">
                  <Badge tone={r.roleType === 'OWNER' ? 'gold' : 'neutral'}>{r.roleType}</Badge>
                  {p?.whatsappNumber && (
                    <span className="ml-2 font-mono text-[11px]">
                      {displayWhatsapp(p.whatsappNumber)}
                    </span>
                  )}
                </p>
              </div>
              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-success/15 px-2 py-1 text-xs font-medium text-success hover:bg-success/25 hover:no-underline"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M20.52 3.48A11.83 11.83 0 0 0 12.05 0C5.49 0 .14 5.34.14 11.91c0 2.1.55 4.15 1.59 5.96L0 24l6.27-1.65a11.92 11.92 0 0 0 5.78 1.47h.01c6.56 0 11.91-5.34 11.91-11.91 0-3.18-1.24-6.17-3.45-8.43ZM12.06 21.8h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.72.98.99-3.62-.23-.37a9.86 9.86 0 0 1-1.51-5.27c0-5.46 4.45-9.91 9.92-9.91 2.65 0 5.14 1.03 7.01 2.91a9.85 9.85 0 0 1 2.91 7.01c0 5.46-4.45 9.86-9.96 9.86Zm5.46-7.42c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.18.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.49-.9-.8-1.5-1.79-1.68-2.09-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.06 2.89 1.21 3.09c.15.2 2.09 3.19 5.06 4.47.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z" />
                  </svg>
                  {t('whatsapp')}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
