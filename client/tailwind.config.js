/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Outfit"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(99, 102, 241, 0.35)',
      },
    },
  },
  plugins: [],
};
