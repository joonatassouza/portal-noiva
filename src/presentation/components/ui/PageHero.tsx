import { ReactNode } from 'react';
import { Container } from './Container';
import { cx } from './cx';

interface PageHeroProps {
  /** Small uppercase label rendered in gold above the title. */
  kicker?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right-side slot (e.g. CTA button, illustration). */
  trailing?: ReactNode;
  /** Optional slot rendered below the subtitle (e.g. search input, CTA row). */
  children?: ReactNode;
  /** Visual surface. 'ice' (cream) is the default; 'plain' uses the page bg. */
  surface?: 'ice' | 'plain';
  className?: string;
}

const surfaceMap: Record<NonNullable<PageHeroProps['surface']>, string> = {
  ice: 'bg-ice',
  plain: 'bg-bg',
};

/** Hero block used by home, list pages and church pages. */
export function PageHero({
  kicker,
  title,
  subtitle,
  trailing,
  children,
  surface = 'ice',
  className,
}: PageHeroProps) {
  return (
    <section className={cx(surfaceMap[surface], className)}>
      <Container pad="page" as="div" className="sm:py-16">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            {kicker && (
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-gold">
                {kicker}
              </p>
            )}
            <h1 className="mt-3 font-serif text-3xl leading-tight text-ink sm:text-5xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-4 max-w-xl text-base text-ink-soft sm:text-lg">{subtitle}</p>
            )}
            {children && <div className="mt-6">{children}</div>}
          </div>
          {trailing && <div className="shrink-0">{trailing}</div>}
        </div>
      </Container>
    </section>
  );
}
