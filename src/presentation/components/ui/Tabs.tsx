'use client';

import { ReactNode, useState, useId } from 'react';
import { cx } from './cx';

export interface TabDef {
  /** Stable id used internally and as a hash route. */
  id: string;
  label: ReactNode;
  /** Optional badge/count next to label. */
  count?: number;
}

interface TabsProps {
  tabs: TabDef[];
  initialTabId?: string;
  /** Render-prop receiving the active tab id. */
  children: (activeTabId: string) => ReactNode;
  className?: string;
}

/** Minimal accessible tab list. State is local; URL sync is opt-in by the parent. */
export function Tabs({ tabs, initialTabId, children, className }: TabsProps) {
  const fallback = tabs[0]?.id ?? '';
  const [active, setActive] = useState(initialTabId ?? fallback);
  const groupId = useId();

  return (
    <div className={className}>
      <div role="tablist" aria-label="Sections" className="flex gap-2 border-b border-border">
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              id={`${groupId}-tab-${tab.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${groupId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              className={cx(
                'relative -mb-px px-3 py-2 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40',
                'rounded-t-md',
                selected
                  ? 'border-b-2 border-gold font-medium text-ink'
                  : 'text-ink-soft hover:text-ink',
              )}
            >
              {tab.label}
              {typeof tab.count === 'number' && (
                <span className="ml-2 inline-flex items-center rounded-sm bg-bg px-1.5 py-0.5 text-xs text-ink-soft">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        id={`${groupId}-panel-${active}`}
        role="tabpanel"
        aria-labelledby={`${groupId}-tab-${active}`}
        className="pt-4"
      >
        {children(active)}
      </div>
    </div>
  );
}
