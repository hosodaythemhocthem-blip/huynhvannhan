/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],

  theme: {
    extend: {
      /* =========================
         COLOR SYSTEM (LMS + EDU)
      ========================= */
      colors: {
        primary: {
          DEFAULT: "#2563eb", // blue-600
          light: "#3b82f6",
          dark: "#1e40af",
        },
        secondary: "#16a34a", // green-600 (đạt chuẩn / đúng)
        danger: "#dc2626",    // red-600
        warning: "#f59e0b",   // amber-500
        info: "#0ea5e9",      // sky-500
      },

      /* =========================
         FONT SYSTEM
      ========================= */
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },

      /* =========================
         DASHBOARD & CARD
      ========================= */
      boxShadow: {
        card: "0 4px 20px rgba(0,0,0,0.08)",
        soft: "0 2px 8px rgba(0,0,0,0.06)",
      },

      borderRadius: {
        xl: "1rem",
        '2xl': "1.25rem",
      },

      /* =========================
         LMS ANIMATION
      ========================= */
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },

      animation: {
        fade: "fadeIn 0.3s ease-out",
      },
    },
  },

  plugins: [
    // Dùng cho typography (markdown, latex giải toán)
    require("@tailwindcss/typography"),
  ],
};
