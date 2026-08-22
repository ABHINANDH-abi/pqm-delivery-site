/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff5f2',
          100: '#ffede6',
          200: '#ffd5c2',
          300: '#ffb899',
          400: '#ff8a5c',
          500: '#ff5722',
          600: '#e64a19',
          700: '#c43a12',
          800: '#9c2e0d',
          900: '#7a240b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
