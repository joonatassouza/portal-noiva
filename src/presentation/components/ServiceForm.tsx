'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';

import type {
  DayOfWeek,
  Service,
  ServiceCancelRule,
  ServiceRecurrence,
} from '@/domain/entities/Service';
import type { Church } from '@/domain/entities/Church';

import { Button } from '@/presentation/components/ui/Button';
import { Input } from '@/presentation/components/ui/Input';
import { Select } from '@/presentation/components/ui/Select';
import { Card } from '@/presentation/components/ui/Card';
import { saveServiceAction } from '@/app/_actions/owner';

interface ServiceFormProps {
  locale: string;
  church: Church;
  initial?: Service;
  /** Other services in the same church — used as candidates for cancel rules. */
  peers: Service[];
  onCancel: () => void;
  onSaved: () => void;
}

export function ServiceForm({
  locale,
  church,
  initial,
  peers,
  onCancel,
  onSaved,
}: ServiceFormProps) {
  const t = useTranslations('panel.services.form');
  const [label, setLabel] = useState(initial?.label ?? '');
  const [startTime, setStartTime] = useState(initial?.startTime ?? '19:00');
  const [endTime, setEndTime] = useState(initial?.endTime ?? '');
  const [hasLiveStream, setHasLiveStream] = useState(Boolean(initial?.hasLiveStream));
  const [kind, setKind] = useState<ServiceRecurrence['kind']>(
    initial?.recurrence.kind ?? 'WEEKLY',
  );
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(
    initial?.recurrence.dayOfWeek ?? 0,
  );
  const [nth, setNth] = useState<1 | 2 | 3 | 4 | -1>(
    initial?.recurrence.kind === 'MONTHLY_NTH_WEEKDAY' ? initial.recurrence.nth : 2,
  );
  const [cancelRules, setCancelRules] = useState<ServiceCancelRule[]>(
    initial?.cancelRules ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Triggers must come from peers OTHER than the service being edited.
  const candidatePeers = peers.filter((p) => p.id !== initial?.id);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const recurrence: ServiceRecurrence =
      kind === 'WEEKLY'
        ? { kind: 'WEEKLY', dayOfWeek }
        : { kind: 'MONTHLY_NTH_WEEKDAY', nth, dayOfWeek };

    startTransition(async () => {
      try {
        await saveServiceAction(
          {
            id: initial?.id,
            churchId: church.id,
            label,
            startTime,
            endTime: endTime || undefined,
            hasLiveStream,
            recurrence,
            cancelRules: cancelRules.filter((r) => r.triggerServiceId),
          },
          locale,
          church.slug,
        );
        onSaved();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  }

  function addRule() {
    setCancelRules((rules) => [
      ...rules,
      { triggerServiceId: '', daysOffset: 1, reason: '' },
    ]);
  }
  function updateRule(idx: number, patch: Partial<ServiceCancelRule>) {
    setCancelRules((rules) => rules.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }
  function removeRule(idx: number) {
    setCancelRules((rules) => rules.filter((_, i) => i !== idx));
  }

  return (
    <Card pad="md">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-soft">
              {t('label')}
            </span>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} required />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-soft">
              {t('startTime')}
            </span>
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-soft">
              {t('endTime')}
            </span>
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </label>
        </div>

        <fieldset className="rounded-md border border-border p-4">
          <legend className="px-1 text-xs font-medium uppercase tracking-wider text-ink-soft">
            {t('recurrence')}
          </legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            <label>
              <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-soft">
                {t('kind')}
              </span>
              <Select value={kind} onChange={(e) => setKind(e.target.value as ServiceRecurrence['kind'])}>
                <option value="WEEKLY">{t('weekly')}</option>
                <option value="MONTHLY_NTH_WEEKDAY">{t('monthly')}</option>
              </Select>
            </label>

            {kind === 'MONTHLY_NTH_WEEKDAY' && (
              <label>
                <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-soft">
                  {t('nth')}
                </span>
                <Select value={String(nth)} onChange={(e) => setNth(Number(e.target.value) as 1)}>
                  <option value="1">{t('nthOptions.1')}</option>
                  <option value="2">{t('nthOptions.2')}</option>
                  <option value="3">{t('nthOptions.3')}</option>
                  <option value="4">{t('nthOptions.4')}</option>
                  <option value="-1">{t('nthOptions.last')}</option>
                </Select>
              </label>
            )}

            <label>
              <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-soft">
                {t('dayOfWeek')}
              </span>
              <Select
                value={String(dayOfWeek)}
                onChange={(e) => setDayOfWeek(Number(e.target.value) as DayOfWeek)}
              >
                {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                  <option key={d} value={d}>
                    {t(`day.${d}` as 'day.0')}
                  </option>
                ))}
              </Select>
            </label>
          </div>
        </fieldset>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={hasLiveStream}
            onChange={(e) => setHasLiveStream(e.target.checked)}
          />
          {t('hasLiveStream')}
        </label>

        <fieldset className="rounded-md border border-border p-4">
          <legend className="px-1 text-xs font-medium uppercase tracking-wider text-ink-soft">
            {t('rules.title')}
          </legend>
          <p className="mt-2 text-xs text-muted">{t('rules.hint')}</p>

          {candidatePeers.length === 0 && (
            <p className="mt-3 text-xs text-ink-soft">{t('rules.noPeers')}</p>
          )}

          {cancelRules.length > 0 && (
            <ul className="mt-3 space-y-3">
              {cancelRules.map((rule, idx) => (
                <li key={idx} className="grid gap-2 rounded-md border border-border bg-bg p-3 sm:grid-cols-[2fr,1fr,2fr,auto]">
                  <Select
                    value={rule.triggerServiceId}
                    onChange={(e) => updateRule(idx, { triggerServiceId: e.target.value })}
                  >
                    <option value="">{t('rules.selectTrigger')}</option>
                    {candidatePeers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </Select>
                  <Input
                    type="number"
                    value={String(rule.daysOffset)}
                    onChange={(e) => updateRule(idx, { daysOffset: Number(e.target.value) })}
                    placeholder={t('rules.offsetPlaceholder')}
                  />
                  <Input
                    value={rule.reason ?? ''}
                    onChange={(e) => updateRule(idx, { reason: e.target.value })}
                    placeholder={t('rules.reasonPlaceholder')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRule(idx)}
                  >
                    {t('rules.remove')}
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {candidatePeers.length > 0 && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addRule}
              className="mt-3"
            >
              {t('rules.add')}
            </Button>
          )}
        </fieldset>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? t('saving') : t('save')}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t('cancel')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
