import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateDocs() {
  const { execSync } = await import('child_process');
  try {
    execSync('node scripts/generateDocs.mjs', { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to generate docs:', error);
  }
}

export default defineConfig({
  integrations: [react(), tailwind()],
  site: 'https://hub.opensophy.com',
  vite: {
    ssr: {
      external: ['isomorphic-dompurify'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'marked', 'react-helmet-async', 'framer-motion'],
      exclude: ['lucide-react'],
    },
  },
  hooks: {
    'astro:build:start': async () => {
      await generateDocs();
    },
  },
});
