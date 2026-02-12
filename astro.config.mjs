import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateDocs() {
  const { execSync } = await import('node:child_process');
  try {
    execSync('node scripts/generateDocs.mjs', { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to generate docs:', error);
  }
}

export default defineConfig({
  integrations: [react(), tailwind()],
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
      include: ['react', 'react-dom', 'marked', 'framer-motion'],
      exclude: ['lucide-react'],
    },
    build: {
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash][extname]',
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-motion': ['framer-motion'],
            'vendor-markdown': ['marked', 'isomorphic-dompurify'],
          },
        },
      },
    },
  },
  hooks: {
    'astro:build:start': async () => {
      await generateDocs();
    },
  },
});
