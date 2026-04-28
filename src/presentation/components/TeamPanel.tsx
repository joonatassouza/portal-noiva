'use client';

import { useState, useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';

import type { Church } from '@/domain/entities/Church';
import type { ChurchRole, ChurchRoleType } from '@/domain/entities/ChurchRole';
import type { Invitation } from '@/domain/entities/Invitation';

import { Card } from '@/presentation/components/ui/Card';
import { Button } from '@/presentation/components/ui/Button';
import { Input } from '@/presentation/components/ui/Input';
import { Select } from '@/presentation/components/ui/Select';
import { Badge } from '@/presentation/components/ui/Badge';
import { createInvitationAction } from '@/app/_actions/owner';

interface TeamPanelProps {
  locale: string;
  church: Church;
  roles: ChurchRole[];
  invitations: Invitation[];
  siteUrl: string;
}

export function TeamPanel({ locale, church, roles, invitations, siteUrl }: TeamPanelProps) {
  const t = useTranslations('panel.team');
  const intlLocale = useLocale();
  const [email, setEmail] = useState('');
  const [roleType, setRoleType] = useState<ChurchRoleType>('EDITOR_ADMIN');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [issuedToken, setIssuedToken] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIssuedToken(null);
    startTransition(async () => {
      try {
        const r = await createInvitationAction({
          churchId: church.id,
          email,
          roleType,
          locale,
          churchSlug: church.slug,
        });
        setIssuedToken(r.token);
        setEmail('');
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  const inviteUrl = (token: string) => `${siteUrl}/${locale}/convite/${token}`;

  return (
    <div className="space-y-6">
      <Card pad="md">
        <h2 className="font-serif text-xl text-ink">{t('inviteTitle')}</h2>
        <p className="mt-1 text-sm text-ink-soft">{t('inviteSubtitle')}</p>
        <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-[2fr,1fr,auto]">
          <Input
            type="email"
            placeholder={t('emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Select value={roleType} onChange={(e) => setRoleType(e.target.value as ChurchRoleType)}>
            <option value="EDITOR_ADMIN">{t('roles.EDITOR_ADMIN')}</option>
            <option value="MEDIA_EDITOR">{t('roles.MEDIA_EDITOR')}</option>
          </Select>
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? t('generating') : t('generate')}
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        {issuedToken && (
          <InviteShareBox
            url={inviteUrl(issuedToken)}
            churchName={church.name}
            roleLabel={t(`roles.${roleType}` as 'roles.EDITOR_ADMIN')}
          />
        )}
      </Card>

      <Card pad="md">
        <h2 className="font-serif text-xl text-ink">{t('membersTitle')}</h2>
        {roles.length === 0 ? (
          <p className="mt-2 text-sm text-muted">{t('noMembers')}</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {roles.map((r) => (
              <li key={r.id} className="flex items-center justify-between">
                <span className="font-mono text-xs text-ink-soft">{r.userId}</span>
                <Badge tone={r.roleType === 'OWNER' ? 'gold' : 'neutral'}>{r.roleType}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card pad="md">
        <h2 className="font-serif text-xl text-ink">{t('invitationsTitle')}</h2>
        {invitations.length === 0 ? (
          <p className="mt-2 text-sm text-muted">{t('noInvitations')}</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {invitations.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-ink">{inv.email}</p>
                  <p className="text-xs text-muted">
                    {inv.roleType} ·{' '}
                    {new Date(inv.expiresAt).toLocaleString(intlLocale)}
                  </p>
                </div>
                <Badge tone={inv.status === 'PENDING' ? 'gold' : inv.status === 'ACCEPTED' ? 'success' : 'neutral'}>
                  {inv.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function InviteShareBox({ url, churchName, roleLabel }: { url: string; churchName: string; roleLabel: string }) {
  const t = useTranslations('panel.team');
  const [copied, setCopied] = useState(false);
  const message = t('whatsappMessage', { church: churchName, role: roleLabel, url });
  const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <div className="mt-4 rounded-md border border-success bg-success/10 p-3">
      <p className="text-sm text-success">{t('issued')}</p>
      <p className="mt-2 break-all rounded bg-bg p-2 font-mono text-xs text-ink">{url}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? t('copied') : t('copy')}
        </Button>
        <Button href={waUrl} variant="secondary" size="sm">
          {t('openWhatsApp')}
        </Button>
      </div>
    </div>
  );
}
