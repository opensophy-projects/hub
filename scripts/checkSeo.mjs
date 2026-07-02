import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const checks = [];

function ok(name, condition, details = '') {
  checks.push({ name, condition, details });
}

function readIfExists(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, 'utf-8') : '';
}

const requiredPublicFiles = [
  'public/robots.txt',
  'public/sitemap.xml',
  'public/llm.txt',
  'public/llms.txt',
];
for (const file of requiredPublicFiles) {
  ok(`${file} exists`, existsSync(path.join(root, file)));
}

const robots = readIfExists(path.join(root, 'public/robots.txt'));
ok('robots.txt allows crawling', /User-agent:\s*\*/i.test(robots) && /Allow:\s*\//i.test(robots));
ok('robots.txt points to sitemap', /Sitemap:\s*https:\/\/opensophy\.com\/sitemap\.xml/i.test(robots));

const sitemap = readIfExists(path.join(root, 'public/sitemap.xml'));
ok('sitemap contains homepage', /<loc>https:\/\/opensophy\.com\/<\/loc>/.test(sitemap));
ok('sitemap contains article pages', /<loc>https:\/\/opensophy\.com\/article\//.test(sitemap));
ok('sitemap contains category pages', /<loc>https:\/\/opensophy\.com\/article\/.+\/<\/loc>/.test(sitemap));

const llm = readIfExists(path.join(root, 'public/llm.txt'));
const llms = readIfExists(path.join(root, 'public/llms.txt'));
ok('llm.txt mentions Astro 6', /Astro 6/.test(llm));
ok('llm.txt mentions React 18', /React 18/.test(llm));
ok('llms.txt mirrors llm context', llms.includes('# Opensophy') && /Astro 6/.test(llms) && /React 18/.test(llms));

if (existsSync(dist)) {
  const homeHtml = readIfExists(path.join(dist, 'index.html'));
  ok('dist homepage has description meta', /<meta name="description"\s+content="[^"]+"/.test(homeHtml));
  ok('dist homepage has canonical link', /<link rel="canonical"\s+href="https:\/\/opensophy\.com\/"/.test(homeHtml));
  ok('dist homepage renders static app shell', /<main|<nav|astro-island/i.test(homeHtml));

  const manifest = JSON.parse(readIfExists(path.join(root, 'public/data/docs/manifest.json')) || '[]');
  const doc = manifest.find((item) => item.slug && !item.custom);
  if (doc) {
    const docHtml = readIfExists(path.join(dist, doc.slug, 'index.html'));
    ok(`dist doc page renders article content statically: ${doc.slug}`, /<article|data-article-content/i.test(docHtml));
    ok(`dist doc page has non-empty author meta: ${doc.slug}`, /<meta name="author"\s+content="(?!\s*")[^"]+"/.test(docHtml));
    ok(`dist doc page has Article JSON-LD: ${doc.slug}`, /application\/ld\+json/.test(docHtml) && /"@type":"Article"/.test(docHtml));
  }
} else {
  ok('dist checks skipped until build exists', true, 'Run npm run build before npm run seo:check for HTML checks.');
}

const failures = checks.filter((check) => !check.condition);
for (const check of checks) {
  const prefix = check.condition ? '✓' : '✗';
  console.log(`${prefix} ${check.name}${check.details ? ` (${check.details})` : ''}`);
}

assert.equal(failures.length, 0, `${failures.length} SEO/LLM checks failed`);
