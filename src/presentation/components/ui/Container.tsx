import { ReactNode } from 'react';
import { cx } from './cx';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  /** Vertical padding preset. Defaults to 'page'. */
  pad?: 'none' | 'page' | 'tight';
  as?: 'div' | 'section' | 'article' | 'header' | 'main';
}

const padMap: Record<NonNullable<ContainerProps['pad']>, string> = {
  none: '',
  tight: 'py-6 sm:py-8',
  page: 'py-8 sm:py-12',
};

/**
 * Centers content with the standard page max-width and horizontal padding.
 * The `container-page` utility comes from globals.css and respects breakpoints.
 */
export function Container({
  children,
  className,
  pad = 'page',
  as: Tag = 'div',
}: ContainerProps) {
  return <Tag className={cx('container-page', padMap[pad], className)}>{children}</Tag>;
}
