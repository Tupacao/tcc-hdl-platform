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
    // RNF02-I01: piso de compatibilidade (README, "Compatibilidade"). Mudar exige mudar a lista
    // TESTED_BROWSERS em features/browser-support/utils/messages.ts.
    target: ['chrome120', 'firefox121', 'edge120', 'safari17'],
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
