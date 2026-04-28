import { AnchorHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';

type ExternalLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  /** Show the trailing arrow glyph. Defaults to true. */
  showArrow?: boolean;
};

/** Anchor tag for external URLs — adds rel/target and a small arrow glyph. */
export function ExternalLink({
  children,
  className,
  showArrow = true,
  ...rest
}: ExternalLinkProps) {
  return (
    <a
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
