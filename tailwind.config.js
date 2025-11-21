/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          900: '#0B1220',
          800: '#111A2B',
          700: '#132033'
        }
      },
      boxShadow: {
        card: '0 12px 30px rgba(0,0,0,0.35)'
      }
    }
  },
  plugins: []
}
