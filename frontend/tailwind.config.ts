import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          950: '#070812',
          900: '#0B0D1A',
          850: '#0F1022',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
        },
        primary: 'var(--color-primary, #4A90D9)', // Adding fallback
        skeuo: {
          base: '#F7F3EE',
          navy: '#1A1A2E',
          accent: '#4A90D9',
          teal: '#2DD4BF',
          purple: '#A855F7',
          amber: '#F59E0B',
          coral: '#FB7185',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['"Playfair Display"', 'serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(120, 100, 255, 0.18), 0 10px 40px rgba(120, 100, 255, 0.12)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
