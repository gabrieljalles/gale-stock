import type { Config } from "tailwindcss";

import { withUt } from "uploadthing/tw";
const config: Config = {
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
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px 4px rgba(34,197,94,0.55)" },
          "50%": { boxShadow: "0 0 34px 10px rgba(34,197,94,0.85)" },
        },
      },
      colors: {
        background: "var(--color-bg)",
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        // As shades abaixo sobrescrevem a paleta padrão do Tailwind para
        // que classes já usadas no projeto (ex: text-red-500, bg-gray-100)
        // passem a ler de app/globals.css, o painel único de cores.
        gray: {
          50: "var(--color-gray-50)",
          100: "var(--color-gray-100)",
          200: "var(--color-gray-200)",
          300: "var(--color-gray-300)",
          400: "var(--color-gray-400)",
          500: "var(--color-gray-500)",
          600: "var(--color-gray-600)",
          700: "var(--color-gray-700)",
          800: "var(--color-gray-800)",
          900: "var(--color-gray-900)",
        },
        slate: {
          50: "var(--color-slate-50)",
        },
        red: {
          50: "var(--color-red-50)",
          100: "var(--color-red-100)",
          500: "var(--color-red-500)",
          600: "var(--color-red-600)",
          700: "var(--color-red-700)",
          800: "var(--color-red-800)",
          900: "var(--color-red-900)",
        },
        green: {
          100: "var(--color-green-100)",
          500: "var(--color-green-500)",
          600: "var(--color-green-600)",
          800: "var(--color-green-800)",
        },
        blue: {
          50: "var(--color-blue-50)",
          500: "var(--color-blue-500)",
          600: "var(--color-blue-600)",
          700: "var(--color-blue-700)",
          900: "var(--color-blue-900)",
        },
        yellow: {
          100: "var(--color-yellow-100)",
          500: "var(--color-yellow-500)",
          600: "var(--color-yellow-600)",
          800: "var(--color-yellow-800)",
        },
        orange: {
          500: "var(--color-orange-500)",
          600: "var(--color-orange-600)",
        },
        purple: {
          600: "var(--color-purple-600)",
        },
      },
      animation: {
        pop: "pop 300ms ease-out forwards",
        float: "float 3s ease-in-out infinite",
        slowSpin: "spin 5s linear infinite",
        glowPulse: "glowPulse 2.2s ease-in-out infinite",
      },
      fontFamily: {
        sans: ['"Roboto"', "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default withUt(config);
