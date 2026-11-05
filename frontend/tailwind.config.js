/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          200: '#c2d9eb',
          300: '#94bfe0',
          400: '#5f9fd1',
          500: '#3882be',
          600: '#2768a3',
          700: '#205384',
          800: '#1e476d',
          900: '#0a192f', // Deep Navy
          950: '#07101f',
        },
        navy: {
          800: '#0e1d38',
          900: '#0a192f',
          950: '#060e1a',
        }
      },
    },
  },
  plugins: [],
}
