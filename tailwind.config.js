import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.{js,ts,jsx,tsx}",
    "./main.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f5f7ff",
          100: "#e6ebff",
          200: "#cdd6ff",
          300: "#aabaff",
          400: "#8096ff",
          500: "#4a67ee",
          600: "#3447e4",
          700: "#2a3ad1",
          800: "#1f2da8",
          900: "#1a2485",
          950: "#161a4f",
        },

        secondary: "#16a34a",
        danger: "#dc2626",
        warning: "#f59e0b",
        info: "#0ea5e9",

        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
      },

      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          "Inter",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          '"Fira Code"',
          "JetBrains Mono",
          "monospace",
        ],
      },

      boxShadow: {
        card: "0 4px 20px rgba(0,0,0,0.08)",
        soft: "0 2px 8px rgba(0,0,0,0.06)",
        premium: "0 20px 50px rgba(0,0,0,0.05)",
        "premium-hover": "0 30px 60px rgba(99,102,241,0.12)",
      },

      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },

      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        fadeIn: {
          "0%": {
            opacity: "0",
            transform: "translateY(12px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },

      animation: {
        float: "float 6s ease-in-out infinite",
        fade: "fadeIn 0.3s ease-out",
        fadeIn: "fadeIn 0.5s ease-out both",
        "spin-slow": "spin 12s linear infinite",
      },
    },
  },

  plugins: [typography],
}
