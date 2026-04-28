import { ReactNode } from 'react';
import { cx } from './cx';

interface CardProps {
  children: ReactNode;
  /** Tone of the surface. */
  tone?: 'surface' | 'plain';
  /** When true, applies hover affordances (used by clickable cards/links). */
  interactive?: boolean;
  /** Padding preset. */
  pad?: 'sm' | 'md' | 'lg';
  className?: string;
  as?: 'div' | 'article' | 'li' | 'section';
}

const toneMap: Record<NonNullable<CardProps['tone']>, string> = {
  surface: 'bg-surface',
  plain: 'bg-bg',
};

const padMap: Record<NonNullable<CardProps['pad']>, string> = {
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
};

/** Generic surface used by ChurchCard, side-info blocks, etc. */
export function Card({
  children,
  tone = 'surface',
  interactive = false,
  pad = 'md',
  className,
  as: Tag = 'div',
}: CardProps) {
  return (
    <Tag
      className={cx(
        'rounded-lg border border-border',
        toneMap[tone],
        padMap[pad],
        interactive && 'transition hover:border-gold',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
