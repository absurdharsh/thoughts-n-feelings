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
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
        display: ['Cinzel', '"Times New Roman"', 'Georgia', 'serif'],
        serif: ['"Cormorant Garamond"', 'Garamond', 'Georgia', 'serif'],
        retro: ['"Share Tech Mono"', '"VT323"', 'monospace'],
      },
      colors: {
        parchment: {
          50: '#fcfaf6',
          100: '#f8f4eb',
          200: '#f0e8d5',
          300: '#e5d7ba',
          400: '#d7c197',
          500: '#c5a059',
          600: '#9e782f',
          700: '#7a5a22',
          800: '#5c431d',
          900: '#3a2b13',
          950: '#1e160a',
        },
        terminal: {
          dark: '#0a0c10',
          darker: '#060709',
          surface: '#11141a',
          border: '#232936',
          green: '#00ff66',
          amber: '#ffb000',
          cyan: '#00e5ff',
          dim: '#5c6370',
        }
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.96' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.85' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      },
      animation: {
        scanline: 'scanline 8s linear infinite',
        flicker: 'flicker 0.15s infinite',
        pulseSlow: 'pulseSlow 4s ease-in-out infinite',
        marquee: 'marquee 25s linear infinite',
      }
    },
  },
  plugins: [],
}

