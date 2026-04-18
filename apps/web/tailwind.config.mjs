import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        paper: 'var(--surface-paper)',
        raised: 'var(--surface-raised)',
        inset: 'var(--surface-inset)',
        rule: 'var(--rule)',
        'rule-subtle': 'var(--rule-subtle)',
        ink: {
          DEFAULT: 'var(--ink-primary)',
          secondary: 'var(--ink-secondary)',
          byline: 'var(--ink-byline)',
          mono: 'var(--ink-mono)',
        },
        signal: {
          flag: 'var(--signal-flag)',
          corroborated: 'var(--signal-corroborated)',
          pending: 'var(--muted-pending)',
          accent: 'var(--accent-signal)',
        },
        destructive: 'var(--destructive)',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui'],
        narrative: ['Newsreader', 'ui-serif', 'Georgia', 'serif'],
        ui: ['"Inter Tight"', ...defaultTheme.fontFamily.sans],
        mono: ['"JetBrains Mono"', ...defaultTheme.fontFamily.mono],
      },
      fontSize: {
        'display-hero': ['clamp(2.5rem, 6vw + 1rem, 4.5rem)', { lineHeight: '1.05', fontWeight: '700' }],
        'display-campaign': ['clamp(1.875rem, 4vw, 3rem)', { lineHeight: '1.05', fontWeight: '700' }],
        'display-section': ['1.5rem', { lineHeight: '1.2', fontWeight: '700' }],
        'narrative-lead': ['1.25rem', { lineHeight: '1.55' }],
        'narrative-body': ['1rem', { lineHeight: '1.6' }],
        'ui-base': ['0.9375rem', { lineHeight: '1.4' }],
        'ui-small': ['0.8125rem', { lineHeight: '1.4' }],
        'ui-micro': ['0.6875rem', { lineHeight: '1.3' }],
        'mono-base': ['0.875rem', { lineHeight: '1.5' }],
        'mono-large': ['1rem', { lineHeight: '1.5' }],
        'mono-small': ['0.75rem', { lineHeight: '1.5' }],
      },
      maxWidth: {
        narrative: '66ch',
        grid: '1400px',
      },
      spacing: {
        section: '5rem',
        'section-hero': '8rem',
        block: '2.5rem',
      },
      borderRadius: {
        DEFAULT: '6px',
        lg: '10px',
      },
    },
  },
  plugins: [],
  darkMode: ['class', '[data-theme="dark"]'], // opt-in, not prefers-color-scheme
};
