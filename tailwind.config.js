/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        warrior: {
          gold: '#c69b6d',
          dark: '#1e1e24',
        },
      },
    },
  },
  plugins: [],
}
