/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",

  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./data/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },

    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
        math: ['KaTeX_Main', 'serif']
      },

      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebf0fe',
          200: '#ced9fd',
          300: '#a3b6fb',
          400: '#7188f7',
          500: '#4f46e5',
          600: '#3e31d6',
          700: '#3226c1',
          800: '#2a20a2',
          900: '#272081',
          950: '#17124b',
        },

        success: {
          DEFAULT: '#16a34a',
          light: '#dcfce7'
        },

        warning: {
          DEFAULT: '#f59e0b',
          light: '#fef3c7'
        },

        danger: {
          DEFAULT: '#ef4444',
          light: '#fee2e2'
        },

        slate: {
          950: '#020617',
        }
      },

      borderRadius: {
        '4xl': '2rem',
        '5xl': '3rem',
        '6xl': '4rem',
      },

      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'bounce-soft': 'bounce-soft 2s ease-in-out infinite',
      },

      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(2deg)' },
        },

        'pulse-soft': {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.8, transform: 'scale(0.98)' },
        },

        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },

        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },

        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },

        'bounce-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },

      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
        'premium-mesh': 'radial-gradient(at 0% 0%, rgba(79, 70, 229, 0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(147, 51, 234, 0.1) 0px, transparent 50%)',
      },

      boxShadow: {
        'premium': '0 20px 50px -12px rgba(79, 70, 229, 0.2)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
        'glass': '0 8px 32px rgba(0,0,0,0.08)'
      },

      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            maxWidth: "100%",
            color: theme('colors.slate.800'),
            h1: { fontWeight: '700' },
            h2: { fontWeight: '600' },
            code: {
              backgroundColor: theme('colors.slate.100'),
              padding: "0.25rem 0.5rem",
              borderRadius: "0.5rem"
            },
            blockquote: {
              borderLeftColor: theme('colors.primary.500')
            }
          }
        }
      })
    },
  },

  plugins: [
    require('@tailwindcss/typography'),
  ],
};
