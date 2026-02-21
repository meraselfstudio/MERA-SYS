/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        // ── Background & Surfaces ───────────────────────────────────────
        background: 'var(--color-bg)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          dark: 'var(--color-primary-dark)',
          light: 'var(--color-accent)',
        },
        surface: {
          50: 'var(--color-surface-2)',
          100: '#FFE4E6',
          200: '#FECDD3',
          300: '#FDA4AF',
          400: '#FB7185',
          500: '#F43F5E',
          600: '#E11D48',
          700: 'var(--color-surface-3)',
          800: 'var(--color-surface-2)',
          900: 'var(--color-surface)',
          950: 'var(--color-bg)',
        },
        glass: {
          border: 'var(--glass-border)',
          bg: 'var(--glass-bg)',
          shine: 'var(--glass-shine)',
        },
        accent: 'var(--color-accent)',

        // Semantic Colors
        success: '#10B981',
        error: '#EF4444',
        info: '#3B82F6',
        warning: '#F59E0B',
      },
      boxShadow: {
        // Layered glass depth shadows
        'glass-sm': '0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glass': '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
        'glass-lg': '0 20px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.10)',
        'glass-xl': '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.12)',
        'glow': '0 0 20px rgba(217,22,54,0.3)',
        'glow-lg': '0 0 40px rgba(217,22,54,0.4)',
        'inner-top': 'inset 0 1px 0 rgba(255,255,255,0.10)',
      },
      backdropBlur: {
        xs: '2px',
        sm: '8px',
        DEFAULT: '12px',
        md: '16px',
        lg: '24px',
        xl: '40px',
      },
      backgroundImage: {
        'glass-surface': 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        'glass-card': 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 60%, rgba(0,0,0,0.1) 100%)',
        'shimmer': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'glass-shine': 'glassSweep 3s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        glassSweep: {
          '0%, 100%': { backgroundPosition: '-200% center' },
          '50%': { backgroundPosition: '300% center' },
        },
      },
    },
  },
  plugins: [],
}
