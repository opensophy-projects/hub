import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const manifestPath = path.join(__dirname, '../public/data/docs/manifest.json');
const sitemapPath  = path.join(__dirname, '../public/sitemap.xml');

const BASE_URL = 'https://opensophy.com';

// ─── Terminal helpers ─────────────────────────────────────────────────────────

const isTTY = process.stdout.isTTY;
const c = { reset: '\x1b[0m', dim: '\x1b[2m', red: '\x1b[31m', green: '\x1b[32m', white: '\x1b[37m' };
const clr = (code, str) => isTTY ? `${code}${str}${c.reset}` : str;

// ─── Main ─────────────────────────────────────────────────────────────────────

function generateSitemap() {
  const start = performance.now();

  if (!fs.existsSync(manifestPath)) {
    process.stdout.write(`  ${clr(c.red, 'error')}  manifest.json not found — run generate:docs first\n\n`);
    process.exit(1);
  }

  const docs = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const today = new Date().toISOString().split('T')[0];

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">

  <!-- Главная страница -->
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
`;

  let urlCount = 1;

  for (const doc of docs) {
    // Пропускаем welcome — главная уже добавлена выше
    if (!doc.slug || doc.slug === 'welcome' || doc.slug === '') continue;

    const url = `${BASE_URL}/${doc.slug}/`;
    const lastmod = doc.updated || doc.date || today;

    sitemap += `
  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
`;
    urlCount++;
  }

  sitemap += `
</urlset>\n`;

  fs.writeFileSync(sitemapPath, sitemap);

  const ms = (performance.now() - start).toFixed(0);
  process.stdout.write(
    `  ${clr(c.dim, 'sitemap'.padEnd(10))}${clr(c.green, urlCount + ' urls')}   ${clr(c.dim, ms + 'ms')}\n`
  );
}

generateSitemap();
