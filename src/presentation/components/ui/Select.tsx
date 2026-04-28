import { SelectHTMLAttributes, forwardRef } from 'react';
import { cx } from './cx';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

/** Native select with token styling. Use a real <option> list as children. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cx(
        'h-10 rounded-md border border-border bg-bg pl-3 pr-8 text-sm text-ink',
        'focus:border-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40',
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
});
