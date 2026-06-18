import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

// Vite config for the SquidGame100 MineCraft client.
// In dev, /ws proxies to the local server so the browser speaks wss/ws to one origin.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  worker: {
    format: 'es',
  },
});
