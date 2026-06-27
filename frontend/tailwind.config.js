/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        civic: {
          teal: { DEFAULT: '#0F6E56', light: '#E1F5EE', mid: '#1D9E75' },
          amber: { DEFAULT: '#BA7517', light: '#FAEEDA' },
          red: { DEFAULT: '#A32D2D', light: '#FCEBEB' },
          blue: { DEFAULT: '#185FA5', light: '#E6F1FB' },
          green: { DEFAULT: '#3B6D11', light: '#EAF3DE' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        civic: '10px',
      },
    },
  },
  plugins: [],
};
