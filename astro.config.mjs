import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// ─── Dev Bridge Integration ────────────────────────────────────────────────────
// Подключается ТОЛЬКО в dev-режиме и вешает fetch-only API на тот же порт Astro.

const devIntegrations = [];

if (process.env.NODE_ENV !== 'production') {
  try {
    const { devBridgeIntegration } = await import('./scripts/devBridge.mjs');
    devIntegrations.push(devBridgeIntegration());
  } catch (e) {
    console.warn('[hub-dev] devBridge not loaded:', e.message);
  }
}

export default defineConfig({
  integrations: [react(), ...devIntegrations],

  site: process.env.PUBLIC_SITE_URL || 'http://localhost:4321',
  trailingSlash: 'always',
  output: 'static',
  srcDir: './src/app',

  build: {
    assets: 'assets',
  },

  vite: {
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
