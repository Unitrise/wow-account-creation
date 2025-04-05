import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Polyfill global to avoid crypto errors
    global: {},
  },
  resolve: {
    alias: {
      // Handle Node.js modules for browser
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      path: 'path-browserify',
      fs: 'memfs',
    },
  },
})
