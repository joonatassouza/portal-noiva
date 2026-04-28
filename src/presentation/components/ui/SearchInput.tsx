import { InputHTMLAttributes, forwardRef } from 'react';
import { cx } from './cx';

type SearchInputProps = InputHTMLAttributes<HTMLInputElement>;

/** Search-style input with a leading magnifying glass icon. */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { className, type = 'search', ...rest },
  ref,
) {
  return (
    <div className={cx('relative w-full', className)}>
      <span
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        aria-hidden="true"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
      </span>
      <input
        ref={ref}
        type={type}
        className="block h-10 w-full rounded-md border border-border bg-bg pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
        {...rest}
      />
    </div>
  );
});
