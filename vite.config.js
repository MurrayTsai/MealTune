import { defineConfig } from 'vite';

export default defineConfig({
  base: '/MealTune/',

  root: '.',
  publicDir: 'public',

  build: {
    outDir: 'dist',
    assetsInlineLimit: 4096,
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  },

  server: {
    port: 3000,
    strictPort: false
  }
});