import { ReactNode } from 'react';
import { cx } from './cx';

interface SectionHeadingProps {
  title: ReactNode;
  description?: ReactNode;
  /** Right-side slot (e.g. "see all" link, filter button). */
  trailing?: ReactNode;
  level?: 2 | 3;
  className?: string;
}

/** A section title with optional description and trailing slot. */
export function SectionHeading({
  title,
  description,
  trailing,
  level = 2,
  className,
}: SectionHeadingProps) {
  const Tag = level === 2 ? 'h2' : 'h3';
  return (
    <header className={cx('flex items-end justify-between gap-4', className)}>
      <div>
        <Tag
          className={cx(
            'font-serif text-ink',
            level === 2 ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl',
          )}
        >
          {title}
        </Tag>
        {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </header>
  );
}
