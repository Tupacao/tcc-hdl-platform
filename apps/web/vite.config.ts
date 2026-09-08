import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    // O Monaco responde por quase todo o peso do bundle. Isola-lo em um chunk
    // proprio evita invalidar o cache do navegador a cada deploy da aplicacao.
    chunkSizeWarningLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes('monaco-editor') ? 'monaco' : undefined),
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Evita CORS no desenvolvimento: o front chama /api e o Vite repassa a API.
      '/api': { target: 'http://localhost:3333', changeOrigin: true },
    },
  },
});
