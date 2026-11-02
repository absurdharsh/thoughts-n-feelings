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
        editorial: ['"Instrument Serif"', 'Georgia', 'serif'],
        handwritten: ['"Caveat"', 'cursive'],
        doodle: ['"Gloria Hallelujah"', 'cursive'],
        body: ['"Patrick Hand"', '"Caveat"', 'cursive'],
        scribble: ['"Reenie Beanie"', 'cursive'],
      },
      colors: {
        // Strictly Binary Ink & Paper
        paper: '#FFFFFF',
        ink: '#000000',
        darkPaper: '#000000',
        darkInk: '#FFFFFF',
      },
    },
  },
  plugins: [],
}
