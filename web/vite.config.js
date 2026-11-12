import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Static build. Two entries end up in static/app and are served by the Go function under /app/:
//   main.js  - the Vue app (index.html)
//   auth.js  - Firebase login/registration for the htmx pages
export default defineConfig({
  base: '/app/',
  plugins: [vue()],
  build: {
    outDir: '../static/app',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        auth: fileURLToPath(new URL('./src/auth.js', import.meta.url)),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
})
