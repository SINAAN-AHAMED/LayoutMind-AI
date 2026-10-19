import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // base: './' is REQUIRED for Electron — makes asset URLs relative so they
  // resolve correctly when loaded via file:// protocol instead of http://
  base: './',
  server: {
    proxy: {
      '/api': {
        // In dev, proxy directly to the Python FastAPI engine
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
