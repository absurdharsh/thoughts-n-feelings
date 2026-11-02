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
        antique: ['"Antique"', '"Cinzel Decorative"', '"Cinzel"', 'serif'],
        display: ['"Cinzel Decorative"', '"Cinzel"', '"Times New Roman"', 'serif'],
        serif: ['"EB Garamond"', '"Cormorant Garamond"', 'Garamond', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', '"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      colors: {
        // Specimen Palette from 18935121.jpg & Antique Typeface
        antique: {
          slate: '#222325',         // Chipped slate slab body
          slateDark: '#1a1b1d',     // Deepest tablet shadow
          basalt: '#141516',        // Subterranean background void
          limestone: '#e4e2dd',     // Chiseled bone-white upper letterform facet
          olive: '#9c9679',         // Muted olive-stone lower bevel shading
          bronze: '#6a6344',        // Deep bronze-earth drop-relief outline
          ash: '#8c867a',           // Weathered marginalia & ASCII
          chalk: '#d8d2c4',         // Classical reading text
          border: '#36373b',        // Stone fracture line
          borderSubtle: '#2a2b2f',  // Incised demarcation
        },
      },
      boxShadow: {
        'stele-slab': 'inset 1px 1px 0 rgba(255,255,255,0.06), inset -1px -1px 0 rgba(0,0,0,0.88), 0 35px 90px -20px rgba(0,0,0,0.98)',
        'stele-relief': '0 2px 0 #4a452d, 0 3px 0 #2b2819, 0 8px 16px rgba(0,0,0,0.95)',
        'stone-inlay': 'inset 0 2px 6px rgba(0,0,0,0.9), inset 0 0 1px rgba(0,0,0,0.95)',
        'stone-press': 'inset -1px -1px 0 rgba(255,255,255,0.04), inset 1px 1px 0 rgba(0,0,0,0.92), 0 1px 2px rgba(0,0,0,0.85)',
      },
    },
  },
  plugins: [],
}
