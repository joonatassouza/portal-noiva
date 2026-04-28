import { AnchorHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';
import { toExternalHref } from '@/shared/url';

type ExternalLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  /** Show the trailing arrow glyph. Defaults to true. */
  showArrow?: boolean;
};

/**
 * Anchor tag for external URLs.
 * Defensive: normalizes the href so callers can pass user-typed values like
 * `youtube.com/@foo` without producing a broken relative path.
 */
export function ExternalLink({
  children,
  className,
  showArrow = true,
  href,
  ...rest
}: ExternalLinkProps) {
  const safeHref = toExternalHref(typeof href === 'string' ? href : undefined);
  return (
    <a
      href={safeHref}
      target="_blank"
      rel="noopener noreferrer"
      className={cx('text-ink underline-offset-4 hover:text-gold', className)}
      {...rest}
    >
      {children}
      {showArrow && (
        <span aria-hidden="true" className="ml-0.5">
          ↗
        </span>
      )}
    </a>
  );
}
