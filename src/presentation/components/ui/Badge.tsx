import { ReactNode } from 'react';
import { cx } from './cx';

type Tone = 'neutral' | 'gold' | 'success' | 'danger';

const toneMap: Record<Tone, string> = {
  neutral: 'bg-bg text-ink-soft',
  gold: 'bg-gold/15 text-gold',
  success: 'bg-success/15 text-success',
  danger: 'bg-danger/15 text-danger',
};

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

/** Small label/chip. Used for "Live", "YouTube", country tags, etc. */
export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium',
        toneMap[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
