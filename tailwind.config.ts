import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background:  'var(--background)',
        foreground:  'var(--foreground)',
        card:        'var(--card)',
        border:      'var(--border)',
        input:       'var(--input)',
        ring:        'var(--ring)',
        primary: {
          DEFAULT:    'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT:    'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT:    'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        destructive: {
          DEFAULT:    'var(--destructive)',
        },
      },
      borderRadius: {
        pill: 'var(--radius-pill)',
        m:    'var(--radius-m)',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Geist', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
