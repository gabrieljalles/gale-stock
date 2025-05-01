/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        pop: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.10)" },
          "100%": { transform: "scale(1.03)" },
        },
      },
      colors: {
        background: "var(--color-background)",
      },
      animation: {
        pop: "pop 300ms ease-out forwards",
      },
      fontFamily: {
        sans: ['"Roboto"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
