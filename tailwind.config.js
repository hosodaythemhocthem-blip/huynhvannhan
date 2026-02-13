import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
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
      },
    },
  },

  plugins: [typography],
};
