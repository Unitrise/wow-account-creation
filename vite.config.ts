import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Polyfill global to avoid crypto errors
    global: {},
    'process.env': {}
  },
  build: {
    // Specify the output directory relative to project root
    outDir: 'dist/client',
    // Empty the output directory before building
    emptyOutDir: true,
    rollupOptions: {
      // Add external dependencies that shouldn't be bundled
      external: ['crypto'],
    }
  },
  resolve: {
    alias: {
      // Handle Node.js modules for browser
      stream: 'stream-browserify',
      path: 'path-browserify',
      fs: 'memfs',
      buffer: 'buffer',
    },
  },
  optimizeDeps: {
    include: ['buffer', 'jsbn']
  }
})
