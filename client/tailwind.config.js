/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        toast: {
          gold: '#D4A843',
          brown: '#8B6914',
          cream: '#FFF8E7',
          charcoal: '#2C2C2C',
          warmWhite: '#FFFDF5',
        },
        fresh: '#4CAF50',
        lightAmber: '#FFB74D',
        crispyOrange: '#FF7043',
        burntRed: '#E74C3C',
        confidenceHigh: '#2196F3',
        confidenceMedium: '#FF9800',
        confidenceLow: '#9E9E9E',
      },
      fontFamily: {
        heading: ['"Baloo 2"', 'cursive'],
        body: ['Nunito', 'sans-serif'],
      },
      keyframes: {
        glow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { transform: 'translateY(0) scaleX(1)', opacity: '0.3' },
          '50%': { transform: 'translateY(-8px) scaleX(1.1)', opacity: '0.6' },
          '100%': { transform: 'translateY(-16px) scaleX(0.9)', opacity: '0' },
        },
        popUp: {
          '0%': { transform: 'translateY(40px)', opacity: '0' },
          '60%': { transform: 'translateY(-10px)', opacity: '1' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        glow: 'glow 1.5s ease-in-out infinite',
        shimmer: 'shimmer 2s ease-in-out infinite',
        popUp: 'popUp 0.6s ease-out',
        float: 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
