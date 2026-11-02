import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          vanta: ['vanta/dist/vanta.net.min'],
          gsap: ['gsap', 'gsap/ScrollTrigger'],
          lenis: ['lenis'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
