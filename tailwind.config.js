/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Red Hat Display"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Roboto Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ww: {
          blue: '#1861ac',
          'blue-dark': '#144e8c',
          'blue-light': '#aac7fb',
          'gray-bg': '#eeeeee',
          'gray-border': '#d5d5d5',
          peach: '#f8b195',
          green: '#26b050',
          orange: '#ff9800',
        },
      },
    },
  },
  plugins: [],
}