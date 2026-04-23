import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// ─── Dev Bridge Integration ────────────────────────────────────────────────────
// Подключается ТОЛЬКО в dev-режиме (process.env.NODE_ENV !== 'production').
// В `astro build` этот блок не выполняется → WebSocket сервер не стартует.

const devIntegrations = [];
const enableDevBridge = process.env.NODE_ENV !== 'production' && process.env.HUB_DEV_BRIDGE === '1';

if (enableDevBridge) {
  try {
    const { devBridgeIntegration } = await import('./scripts/devBridge.mjs');
    devIntegrations.push(devBridgeIntegration());
  } catch (e) {
    // ws не установлен — предупреждаем, но не ломаем дев-сервер
    console.warn('[hub-dev] devBridge not loaded:', e.message);
    console.warn('[hub-dev] Run: npm install ws');
  }
}

export default defineConfig({
  integrations: [react(), ...devIntegrations],

  site: 'https://opensophy.com',
  trailingSlash: 'always',
  output: 'static',
  srcDir: './src/app',

  build: {
    assets: 'assets',
  },

  vite: {
    server: {
      watch: {
        ignored: [
          '**/tsconfig.json',
          '**/src/app/content.config.mjs',
        ],
      },
    },

    ssr: {
      external: ['isomorphic-dompurify'],
    },

    optimizeDeps: {
      include: ['react', 'react-dom', 'marked', 'framer-motion', 'lucide-react', 'recharts'],
    },

    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash][extname]',
          manualChunks(id) {
            // Dev panel → отдельный чанк (в prod его нет в бандле)
            if (id.includes('dev-panel'))                    return 'dev-panel';
            if (id.includes('node_modules/lucide-react'))    return 'lucide';
            if (id.includes('node_modules/react-dom'))       return 'vendor-react';
            if (id.includes('node_modules/react/'))          return 'vendor-react';
            if (id.includes('node_modules/framer-motion'))   return 'vendor-motion';
            if (
              id.includes('node_modules/marked') ||
              id.includes('node_modules/isomorphic-dompurify')
            ) return 'vendor-markdown';
            if (
              id.includes('node_modules/recharts') ||
              id.includes('node_modules/d3-')      ||
              id.includes('node_modules/victory-vendor')
            ) return 'vendor-charts';
          },
        },
      },
    },
  },
});
