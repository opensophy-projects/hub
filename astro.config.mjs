import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  site: 'https://hub.opensophy.com',
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
            if (id.includes('node_modules/lucide-react'))      return 'lucide';
            if (id.includes('node_modules/react-dom'))         return 'vendor-react';
            if (id.includes('node_modules/react/'))            return 'vendor-react';
            if (id.includes('node_modules/framer-motion'))     return 'vendor-motion';
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