/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        pop: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.10)" },
          "100%": { transform: "scale(1.03)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-8px) rotate(2deg)" },
        },
      },
      colors: {
        background: "var(--color-bg)",
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
      },
      animation: {
        pop: "pop 300ms ease-out forwards",
        float: "float 3s ease-in-out infinite",
      },
      fontFamily: {
        sans: ['"Roboto"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
