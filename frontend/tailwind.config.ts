import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Elyse Design Tokens ──────────────────────────
        background: '#FAF8F5',
        surface: {
          DEFAULT: '#FFFFFF',
          warm: '#F2EDE8',
        },
        'on-surface': '#1A1A1A',
        'on-surface-secondary': '#6B6560',
        primary: '#2D3B2D',
        gold: '#C9A96E',
        terracotta: '#8B5E52',
        divider: '#E8E2DA',

        // ── Legacy compat for old component refs ─────────
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
        },
      },
      fontFamily: {
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
        serif:   ['"Playfair Display"', 'Georgia', 'serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['DM Sans', 'system-ui', 'sans-serif'],
        label:   ['DM Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['96px', { lineHeight: '88px', letterSpacing: '-0.02em' }],
        'headline-lg': ['64px', { lineHeight: '60px', letterSpacing: '-0.02em' }],
        'title-lg':    ['40px', { lineHeight: '44px', letterSpacing: '-0.01em' }],
        'label-caps':  ['10px', { lineHeight: '16px', letterSpacing: '0.25em' }],
        'body-base':   ['15px', { lineHeight: '24px', letterSpacing: '0em' }],
      },
      borderRadius: {
        DEFAULT: '0.125rem',
        lg:      '0.25rem',
        xl:      '0.5rem',
        full:    '9999px',
      },
      boxShadow: {
        card:  '0 4px 24px rgba(0, 0, 0, 0.06)',
        float: '0 8px 40px rgba(0, 0, 0, 0.10)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'elyse-spin': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        'elyse-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
      },
      animation: {
        'elyse-spin':  'elyse-spin 0.8s linear infinite',
        'elyse-pulse': 'elyse-pulse 2s ease infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
