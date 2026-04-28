import { CSSProperties } from 'react';

interface LogoProps {
  size?: number;          // height in px
  showWordmark?: boolean;
  className?: string;
}

/**
 * Brand mark: arched portal with a flame inside.
 * Colors come from CSS tokens — designer can re-skin without touching this file
 * (just edit tokens.css).
 */
export function Logo({ size = 40, showWordmark = true, className }: LogoProps) {
  const w = showWordmark ? size * 4.5 : size;
  const style: CSSProperties = { height: size, width: w };

  return (
    <span className={className} style={style} aria-label="Portal Noiva">
      <svg
        viewBox={showWordmark ? '0 0 320 96' : '0 0 96 96'}
        width="100%"
        height="100%"
        role="img"
        aria-hidden="true"
      >
        <g transform={showWordmark ? 'translate(8, 8)' : 'translate(8, 8)'}>
          <path
            d="M 6 76 L 6 38 A 34 34 0 0 1 74 38 L 74 76"
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="0" y1="76" x2="80" y2="76" stroke="var(--color-ink)" strokeWidth={5} strokeLinecap="round" />
          <path
            d="M 40 28 C 30 40, 30 50, 40 60 C 50 50, 50 40, 40 28 Z"
            fill="var(--color-gold)"
          />
          <path
            d="M 40 38 C 35 45, 35 52, 40 58 C 45 52, 45 45, 40 38 Z"
            fill="#ffffff"
            opacity={0.55}
          />
        </g>
        {showWordmark && (
          <g transform="translate(110, 0)">
            <text
              x="0"
              y="58"
              fontFamily="var(--font-serif)"
              fontWeight={500}
              fontSize="34"
              fill="var(--color-ink)"
              style={{ letterSpacing: '0.04em' }}
            >
              Portal Noiva
            </text>
          </g>
        )}
      </svg>
    </span>
  );
}
