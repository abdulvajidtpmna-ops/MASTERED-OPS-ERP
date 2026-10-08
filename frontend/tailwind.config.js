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
          900: '#061B4D',
          700: '#0A3FB5',
          500: '#0B5FFF',
          300: '#5B9BFF',
          100: '#E9F1FF',
          50: '#F4F7FD',
        },
        gold: {
          600: '#C9930A',
          500: '#F5B921',
          400: '#FFD257',
          300: '#FFE08A',
          100: '#FEF3C7',
          50: '#FFFBEB',
        },
        ink: '#0B1530',
        canvas: '#F4F7FD',
      },
      backgroundImage: {
        'blue-shine': 'linear-gradient(135deg, #061B4D, #0B5FFF 60%, #5B9BFF)',
        'gold-shine': 'linear-gradient(135deg, #C9930A, #F5B921 45%, #FFE08A 70%, #F5B921)',
        'card-gloss': 'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,1) 100%)',
      },
      borderRadius: {
        'xl': '14px',
        '2xl': '18px',
        '3xl': '24px',
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft-blue': '0 8px 24px -4px rgba(6, 27, 77, 0.08), 0 4px 12px -2px rgba(6, 27, 77, 0.04)',
        'gold-glow': '0 6px 20px -2px rgba(245, 185, 33, 0.35)',
        'blue-glow': '0 8px 25px -3px rgba(11, 95, 255, 0.35)',
        'card-highlight': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.9), 0 4px 16px rgba(6, 27, 77, 0.06)',
      }
    },
  },
  plugins: [],
}
