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
        sans: ['"Plus Jakarta Sans"', 'Roboto', 'system-ui', 'sans-serif'],
        body: ['Roboto', 'system-ui', 'sans-serif'],
        mono: ['"Roboto Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        m3: {
          surface: '#111318',
          'surface-low': '#191c20',
          'surface-container': '#1d2024',
          'surface-high': '#282a2f',
          'surface-highest': '#33353a',
          primary: '#a8c7fa',
          'on-primary': '#062e6f',
          'primary-container': '#284777',
          'on-primary-container': '#d6e3ff',
          secondary: '#bec6dc',
          'secondary-container': '#3e4759',
          'on-secondary-container': '#dae2f9',
          tertiary: '#d4bbff',
          'tertiary-container': '#4f378b',
          'on-tertiary-container': '#eddcff',
          positive: '#81c995',
          'positive-container': '#0f5223',
          'on-positive-container': '#a6f4bc',
          negative: '#f28b82',
          'negative-container': '#8c1d18',
          'on-negative-container': '#fce8e6',
          outline: '#44474e',
          'outline-variant': '#44474e80',
          text: '#e2e2e9',
          'text-muted': '#8e9099',
          'text-subtle': '#c4c6d0',
        },
      },
      borderRadius: {
        '3xl': '24px',
        '2xl': '16px',
        'xl': '12px',
      },
    },
  },
  plugins: [],
}