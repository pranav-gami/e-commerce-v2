/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#ff3f6c",
          hover: "#e8305a",
          light: "#fff0f3",
        },
        brand: {
          dark: "#282c3f",
          gray: "#94969f",
          light: "#f5f5f6",
          border: "#eaeaec",
          muted: "#535665",
        },
      },
      fontFamily: {
        sans: ['"Assistant"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      animation: {
        "fade-up": "fadeUp 0.4s ease-out both",
        "fade-in": "fadeIn 0.3s ease-out both",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
