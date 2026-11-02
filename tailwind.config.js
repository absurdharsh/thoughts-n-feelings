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
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'Consolas', 'monospace'],
        display: ['Cinzel', '"Times New Roman"', 'Georgia', 'serif'],
        serif: ['"EB Garamond"', '"Cormorant Garamond"', 'Garamond', 'Georgia', 'serif'],
        cormorant: ['"Cormorant Garamond"', 'Garamond', 'serif'],
      },
      colors: {
        // Ancient Mineral & Lapidary System
        mineral: {
          basalt: '#0a0a09',       // Deepest ancient volcanic rock
          basaltLight: '#111110',  // Elevated stone surface
          slate: '#161616',        // Dark slate tablet body
          slateLight: '#1f1f1e',   // Chiseled slab face
          granite: '#262523',      // Middle stone grain
          stoneBorder: '#32312d',  // Crisp 1px stone demarcation
          stoneLight: '#44423d',   // Beveled stone highlight line
          ash: '#73716b',          // Weathered damp mineral gray
          ashLight: '#94928b',     // Secondary inscriptions
          limestone: '#d8d2c4',    // Aged limestone carvings
          chalk: '#e5e0d8',        // Raw chisel marks & primary glyphs
          obsidian: '#050505',     // Absolute void
        },
      },
      boxShadow: {
        'stone-slab': 'inset 1px 1px 0 rgba(255,255,255,0.07), inset -1px -1px 0 rgba(0,0,0,0.85), 0 20px 45px -15px rgba(0,0,0,0.95)',
        'stone-beveled': 'inset 1px 1px 0 rgba(255,255,255,0.09), inset -1px -1px 0 rgba(0,0,0,0.7)',
        'stone-pressed': 'inset -1px -1px 0 rgba(255,255,255,0.06), inset 1px 1px 0 rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.8)',
        'stone-inset': 'inset 0 2px 6px rgba(0,0,0,0.8), inset 0 0 1px rgba(0,0,0,0.9)',
      },
      keyframes: {
        sedimentDrift: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        chiselGlitch: {
          '0%': { opacity: '0.9', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.002)' },
          '100%': { opacity: '0.95', transform: 'scale(1)' },
        },
      },
      animation: {
        sediment: 'sedimentDrift 8s ease-in-out infinite',
        chisel: 'chiselGlitch 0.2s ease-out',
      }
    },
  },
  plugins: [],
}
