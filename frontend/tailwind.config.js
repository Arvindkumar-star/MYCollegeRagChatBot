/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0b1437', 2: '#0f1c4d', 3: '#0d1a45' },
        gold: { DEFAULT: '#c9a84c', light: '#e5c97e', dim: '#a08030' },
        blue: { brand: '#1a4fba', bright: '#2563eb' },
        red: { brand: '#c0392b' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'navy-gradient': 'linear-gradient(135deg, #0b1437 0%, #0d1a45 50%, #0b1437 100%)',
        'gold-gradient': 'linear-gradient(135deg, #c9a84c 0%, #e5c97e 50%, #c9a84c 100%)',
        'blue-gradient': 'linear-gradient(135deg, #1a4fba 0%, #2563eb 100%)',
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease forwards',
        'fade-in': 'fadeIn 0.3s ease forwards',
        'scale-in': 'scaleIn 0.3s ease forwards',
        'float': 'floatOrb 8s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        scaleIn: { from: { opacity: 0, transform: 'scale(0.96)' }, to: { opacity: 1, transform: 'scale(1)' } },
        floatOrb: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(20px, -30px) scale(1.05)' },
          '66%': { transform: 'translate(-15px, 20px) scale(0.95)' },
        },
        shimmer: { '0%': { backgroundPosition: '-200% center' }, '100%': { backgroundPosition: '200% center' } },
        pulseGold: { '0%, 100%': { boxShadow: '0 0 0 0 rgba(201,168,76,0)' }, '50%': { boxShadow: '0 0 20px 4px rgba(201,168,76,0.2)' } },
      },
      backdropBlur: { xs: '4px' },
    },
  },
  plugins: [],
};
