/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      /* ==================================================
         COLOR SYSTEM – PREMIUM LMS + EDU
      ================================================== */
      colors: {
        /* Core brand */
        primary: {
          50: "#f5f7ff",
          500: "#4a67ee",
          600: "#3447e4",
          950: "#161a4f",
        },

        /* Semantic colors */
        secondary: "#16a34a", // green-600
        danger: "#dc2626",    // red-600
        warning: "#f59e0b",   // amber-500
        info: "#0ea5e9",      // sky-500

        /* Neutral (dashboard, nền, text) */
        slate: {
          50: "#f8fafc",
          900: "#0f172a",
          950: "#020617",
        },
      },

      /* ==================================================
         FONT SYSTEM
      ================================================== */
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "Inter", "system-ui", "sans-serif"],
        mono: ['"Fira Code"', "JetBrains Mono", "monospace"],
      },

      /* ==================================================
         CARD / DASHBOARD / PREMIUM UI
      ================================================== */
      boxShadow: {
        card: "0 4px 20px rgba(0,0,0,0.08)",
        soft: "0 2px 8px rgba(0,0,0,0.06)",
        premium: "0 20px 50px rgba(0,0,0,0.05)",
        "premium-hover": "0 30px 60px rgba(99,102,241,0.1)",
      },

      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },

      /* ==================================================
         ANIMATION – LMS FEELING
      ================================================== */
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-15px)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
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

  plugins: [
    // Markdown, LaTeX, nội dung giải toán
    require("@tailwindcss/typography"),
  ],
};
