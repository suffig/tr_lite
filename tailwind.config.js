/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        // iOS System Colors
        system: {
          blue: 'var(--system-blue)',
          green: 'var(--system-green)',
          indigo: 'var(--system-indigo)',
          orange: 'var(--system-orange)',
          pink: 'var(--system-pink)',
          purple: 'var(--system-purple)',
          red: 'var(--system-red)',
          teal: 'var(--system-teal)',
          yellow: 'var(--system-yellow)',
        },
        // FIFA Brand Colors
        fifa: {
          blue: 'var(--fifa-blue)',
          red: 'var(--fifa-red)',
          green: 'var(--fifa-green)',
        },
        // Legacy support (gradually migrate away from these)
        primary: {
          green: 'var(--fifa-green)',
          'green-dark': 'var(--system-green)',
          'green-light': 'var(--system-teal)',
        },
        accent: {
          orange: 'var(--system-orange)',
          red: 'var(--system-red)',
          blue: 'var(--system-blue)',
        },
        // Semantic colors using CSS variables
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          elevated: 'var(--bg-elevated)',
          grouped: 'var(--bg-grouped)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          quaternary: 'var(--text-quaternary)',
          muted: 'var(--text-muted)',
        },
        border: {
          light: 'var(--border-light)',
          medium: 'var(--border-medium)',
          strong: 'var(--border-strong)',
        },
        separator: 'var(--separator)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'headline': ['34px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'title1': ['28px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'title2': ['22px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        'title3': ['20px', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body': ['17px', { lineHeight: '1.4', fontWeight: '400' }],
        'callout': ['16px', { lineHeight: '1.4', fontWeight: '400' }],
        'subhead': ['15px', { lineHeight: '1.4', fontWeight: '400' }],
        'footnote': ['13px', { lineHeight: '1.4', fontWeight: '400' }],
        'caption1': ['12px', { lineHeight: '1.3', fontWeight: '400' }],
        'caption2': ['11px', { lineHeight: '1.3', fontWeight: '400' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'ios': '12px',
        'ios-lg': '16px',
        'ios-xl': '20px',
        'ios-2xl': '24px',
      },
      boxShadow: {
        'ios-sm': 'var(--shadow-sm)',
        'ios-md': 'var(--shadow-md)',
        'ios-lg': 'var(--shadow-lg)',
        'ios-xl': 'var(--shadow-xl)',
      },
      backdropBlur: {
        'ios-sm': 'var(--blur-sm)',
        'ios-md': 'var(--blur-md)',
        'ios-lg': 'var(--blur-lg)',
      },
      transitionTimingFunction: {
        'ios': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'ios-spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      transitionDuration: {
        'ios': '200ms',
        'ios-slow': '300ms',
      },
      animation: {
        'bounce-gentle': 'bounceGentle 1.5s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
        'pulse-gentle': 'pulseGentle 2s ease-in-out infinite',
        'success-flash': 'successFlash 0.6s ease-out',
        'error-shake': 'errorShake 0.5s ease-out',
      },
    },
  },
  plugins: [],
}