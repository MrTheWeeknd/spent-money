import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['brand/*/icon.svg', 'brand/*/apple-touch-icon-180x180.png', 'brand/*/favicon.ico'],
      manifest: {
        name: 'Quanto Deu',
        short_name: 'Quanto Deu',
        description: 'A pergunta que todo mundo faz no fim do mês — e o app responde.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        // O manifest é fixo: usa a identidade padrão (Geométrico). No iOS o ícone vem do
        // apple-touch-icon, que acompanha a identidade escolhida no momento da instalação.
        background_color: '#f5efe3',
        theme_color: '#f5efe3',
        icons: [
          { src: 'brand/geometrico/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'brand/geometrico/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'brand/geometrico/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'brand/geometrico/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        // Dados financeiros nunca vão para o cache do service worker.
        runtimeCaching: [{ urlPattern: /\/api\//, handler: 'NetworkOnly' }],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Vendors em chunks próprios: mudam pouco e ficam em cache entre deploys.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          ui: ['vaul', 'sonner', '@radix-ui/react-radio-group', '@radix-ui/react-switch'],
          dates: ['date-fns', '@date-fns/tz'],
        },
      },
    },
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    host: true,
    port: 5173,
    proxy: { '/api': { target: process.env.API_PROXY ?? 'http://localhost:3000', changeOrigin: true } },
  },
});
