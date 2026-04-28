import { ButtonHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import { cx } from './cx';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md';

const base =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50';

const variantMap: Record<Variant, string> = {
  primary: 'bg-ink text-bg hover:bg-ink/90',
  secondary: 'border border-ink text-ink hover:bg-ink hover:text-bg',
  ghost: 'text-ink hover:bg-surface',
};

const sizeMap: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

type ButtonAsButton = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

interface ButtonAsLink extends CommonProps {
  href: string;
  prefetch?: boolean;
}

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = 'primary', size = 'md', className, children } = props;
  const classes = cx(base, variantMap[variant], sizeMap[size], 'hover:no-underline', className);

  if ('href' in props && props.href) {
    return (
      <Link href={props.href} prefetch={props.prefetch} className={classes}>
        {children}
      </Link>
    );
  }
  const { variant: _v, size: _s, className: _c, children: _ch, href: _h, ...rest } =
    props as ButtonAsButton;
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
