import type { Config } from 'tailwindcss'
import { join } from 'path'

const here = __dirname

const config: Config = {
  content: [
    join(here, 'src/pages/**/*.{js,ts,jsx,tsx,mdx}'),
    join(here, 'src/components/**/*.{js,ts,jsx,tsx,mdx}'),
    join(here, 'src/app/**/*.{js,ts,jsx,tsx,mdx}'),
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e', // Classic Turf Green
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        accent: {
          50: '#fdfbe8',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Trophy Gold
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          emerald: '#34D399', // V3 brand emerald (brighter, used as punctuation)
          'emerald-2': '#1FA877',
          blue: '#3b82f6',
          amber: '#E6B84E', // V3 gold (Pro tier)
          gold: '#E6B84E',
          coral: '#F2786B', // V3 negative
          teal: '#14b8a6',
        },
        // Body text scale used across post-login pages
        text: {
          primary: '#f1f5f9',
          secondary: '#94a3b8',
          muted: '#64748b',
        },
        // Extra slate stops referenced in the codebase (350 / 450)
        slate: {
          350: '#a8b3c4',
          450: '#7a8699',
        },
        // App-shell surfaces ("ink" series — near-black, matching .card tone)
        ink: {
          0: '#080b14', // sidebar / outer shell
          1: '#0b0f17', // AnalystPanel base — matches .card
          2: '#141a26', // bubbles + inputs inside panels (one notch lighter so they read)
        },
        // Page base background used in some legacy classes
        base: '#060b18',
        // Surface used by sub-tiles INSIDE cards (MiniStat blocks, inline chips, etc.)
        // — slightly lighter than card so tiles read distinctly on the card.
        surface: '#161c2a',
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          850: '#131e32', // Stadium Navy shadow
          900: '#0b1324',
          950: '#050a14', // Deepest Stadium Blue
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['var(--font-serif)', 'Georgia', 'serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'progress': 'progress 1s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(34, 197, 94, 0.1)' },
          '50%': { boxShadow: '0 0 30px rgba(34, 197, 94, 0.3)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        progress: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--progress-width)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(5, 10, 20, 0.75), rgba(5, 10, 20, 0.6))',
        'card-gradient': 'linear-gradient(135deg, rgba(15, 25, 45, 0.9), rgba(5, 10, 20, 0.95))',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.5)',
        'glass-sm': '0 4px 16px rgba(0, 0, 0, 0.4)',
        'glow': '0 0 20px rgba(34, 197, 94, 0.25)',
        'glow-accent': '0 0 20px rgba(245, 158, 11, 0.25)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [],
}
export default config
