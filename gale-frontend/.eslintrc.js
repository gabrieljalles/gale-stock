module.exports = {
    parser: "@typescript-eslint/parser",
    plugins: ["tailwindcss"],
    extends: [
      "plugin:tailwindcss/recommended",
      "prettier"
    ],
    rules: {
      // força a ordem correta
      "tailwindcss/classnames-order": "error"
    },
  };