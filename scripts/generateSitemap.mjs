import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const manifestPath = path.join(__dirname, '../public/data/docs/manifest.json');
const sitemapPath = path.join(__dirname, '../public/sitemap.xml');

function getTypePrefix(type) {
  switch (type) {
    case 'blog':
      return 'blog';
    case 'news':
      return 'news';
    default:
      return 'docs';
  }
}

function generateSitemap() {
  console.log('🔄 Generating sitemap...');

  if (!fs.existsSync(manifestPath)) {
    console.error(`❌ manifest.json not found at ${manifestPath}`);
    return;
  }

  const docs = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  
  const baseUrl = 'https://hub.opensophy.com';
  const today = new Date().toISOString().split('T')[0];

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  
  <!-- Main page -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Documentation articles -->
`;

  docs.forEach(doc => {
    const typePrefix = getTypePrefix(doc.type);
    let cleanSlug = doc.slug;
    while (cleanSlug.startsWith('-')) {
      cleanSlug = cleanSlug.slice(1);
    }
    while (cleanSlug.endsWith('-')) {
      cleanSlug = cleanSlug.slice(0, -1);
    }
    
    sitemap += `  <url>
    <loc>${baseUrl}/${typePrefix}/${cleanSlug}</loc>
    <lastmod>${doc.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
`;
  });

  sitemap += `</urlset>
`;

  fs.writeFileSync(sitemapPath, sitemap);
  console.log(`✅ Sitemap generated with ${docs.length + 1} URLs at ${sitemapPath}`);
}

generateSitemap();
