import type { Config } from 'tailwindcss';

/**
 * Tailwind config — references CSS variables defined in
 *   src/presentation/styles/tokens.css
 *
 * To rebrand (colors, fonts, radii) the designer touches ONLY tokens.css.
 * Do not hardcode hex values here.
 */
const config: Config = {
  // Scan EVERY .ts/.tsx under src so utility classes used in pages
  // (src/app/**) and any future folder are picked up by the JIT compiler.
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--color-ink)',
        'ink-soft': 'var(--color-ink-soft)',
        gold: 'var(--color-gold)',
        ice: 'var(--color-ice)',
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        muted: 'var(--color-muted)',
        border: 'var(--color-border)',
        success: 'var(--color-success)',
        danger: 'var(--color-danger)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      maxWidth: {
        prose: 'var(--container-prose)',
        page: 'var(--container-page)',
      },
      screens: {
        // Mobile-first defaults; xs adds a breakpoint between mobile and sm.
        xs: '420px',
      },
    },
  },
  plugins: [],
};

export default config;
