import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The Go function serves the build from /app/ (static/app). The page routes
// (/, /login, /register, /ideas, /admin/users) return the same index.html.
export default defineConfig({
  base: '/app/',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../static/app',
    emptyOutDir: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
    css: false,
  },
})
