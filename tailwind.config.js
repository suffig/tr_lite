/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        primary: {
          green: '#10B981',
          'green-dark': '#059669',
          'green-light': '#34D399',
        },
        accent: {
          orange: '#F59E0B',
          red: '#EF4444',
          blue: '#3B82F6',
        },
        bg: {
          primary: 'var(--color-background, #F8FAFC)',
          secondary: 'var(--color-surface, #FFFFFF)',
          tertiary: '#F1F5F9',
        },
        text: {
          primary: 'var(--color-text, #1E293B)',
          secondary: 'var(--color-textSecondary, #475569)',
          muted: '#64748B',
        },
        border: {
          light: '#E2E8F0',
          medium: '#CBD5E1',
          dark: '#94A3B8',
        },
        // Team specific colors
        team: {
          aek: '#004C8C',
          real: '#FFFFFF',
          barcelona: '#A50044',
          bayern: '#DC143C',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'theme': '0 0 20px var(--color-primary, #10B981)',
      },
      borderRadius: {
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
      },
      transitionTimingFunction: {
        'fast': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'normal': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '250ms',
      },
      animation: {
        'slot-spin': 'spin 0.5s linear infinite',
        'theme-pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'live-indicator': 'pulse 1s ease-in-out infinite',
      },
      keyframes: {
        'theme-pulse': {
          '0%, 100%': { 
            opacity: 1,
            transform: 'scale(1)',
          },
          '50%': { 
            opacity: 0.8,
            transform: 'scale(1.05)',
          },
        }
      },
      backgroundImage: {
        'gradient-team': 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
        'gradient-performance-good': 'linear-gradient(135deg, #10B981, #34D399)',
        'gradient-performance-bad': 'linear-gradient(135deg, #EF4444, #F87171)',
      }
    },
  },
  plugins: [],
}