export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      colors: {
        ink: {
          950: '#0F0F0F',
          925: '#111111',
          900: '#1A1A1A',
          850: '#242424',
          800: '#2E2E2E'
        }
      },
      animation: {
        'fade-in': 'fadeIn 180ms ease-out',
        'modal-in': 'modalIn 150ms ease-out',
        'slide-in': 'slideIn 220ms ease-out',
        drift: 'drift 16s ease-in-out infinite alternate'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        modalIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(28px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        drift: {
          '0%': { transform: 'translate3d(-10%, -6%, 0) scale(1)' },
          '100%': { transform: 'translate3d(8%, 10%, 0) scale(1.18)' }
        }
      }
    }
  },
  plugins: []
};
