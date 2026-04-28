import { ReactNode } from 'react';
import { cx } from './cx';

interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Friendly empty/zero-results state. */
export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cx(
        'rounded-lg border border-dashed border-border bg-surface p-6 text-center sm:p-10',
        className,
      )}
    >
      <p className="font-serif text-lg text-ink sm:text-xl">{title}</p>
      {description && <p className="mt-2 text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
