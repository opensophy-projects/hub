import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const docsDir      = path.join(__dirname, '../Docs');
const outputDir    = path.join(__dirname, '../public/data/docs');
const manifestFile = path.join(outputDir, 'manifest.json');

marked.setOptions({ breaks: true, gfm: true });

// ─── Preprocessing ────────────────────────────────────────────────────────────

function preprocessAlerts(content) {
  const codeBlocks = [];
  const codeBlockPattern = /```[\s\S]*?```/g;
  const alertPattern = /^:::(note|tip|important|warning|caution)\n([\s\S]*?)^:::$/gm;

  const protected1 = content.replaceAll(codeBlockPattern, (match) => {
    codeBlocks.push(match);
    return `___CODE_BLOCK_${codeBlocks.length - 1}___`;
  });

  const protected2 = protected1.replaceAll(alertPattern, (_match, type, alertContent) =>
    `<div class="custom-alert" data-alert-type="${type}">\n${alertContent.trim()}\n</div>`
  );

  return protected2.replaceAll(/___CODE_BLOCK_(\d+)___/g, (_match, index) =>
    codeBlocks[Number.parseInt(index, 10)]
  );
}

// ─── Front Matter ─────────────────────────────────────────────────────────────

function extractFrontMatter(content) {
  const frontMatterRegex = /^---\n([\s\S]*?)\n---\n/;
  const match = content.match(frontMatterRegex);

  if (!match) return { metadata: {}, content };

  const metadata = {};
  for (const line of match[1].split('\n')) {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      metadata[key.trim()] = valueParts.join(':').trim().replace(/^['"]/, '').replace(/['"]$/, '');
    }
  }

  return { metadata, content: content.replace(frontMatterRegex, '') };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function processImageSyntax(content) {
  return content.replaceAll(/\[([^\]]{1,500}\.(?:png|jpg|jpeg|gif|webp|svg))\]/gi, '![](/assets/$1)');
}

function getFirstParagraph(content) {
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (
      trimmed &&
      !trimmed.startsWith('#') &&
      !trimmed.startsWith('*') &&
      !trimmed.startsWith('!') &&
      !trimmed.startsWith(':')
    ) {
      return trimmed.substring(0, 160);
    }
  }
  return '';
}

/**
 * Обрезает дефисы с начала и конца строки без regex,
 * чтобы избежать S5852 (ReDoS hotspot).
 */
function trimDashes(str) {
  let start = 0;
  let end = str.length;
  while (start < end && str[start] === '-') start++;
  while (end > start && str[end - 1] === '-') end--;
  return str.slice(start, end);
}

function generateSlug(fileName, canonical) {
  if (canonical && canonical !== 'null') {
    return canonical.replace(/^\/+/, '');
  }

  const cleaned = fileName
    .replace('.md', '')
    .toLowerCase()
    .replaceAll(/[^\w\s-]/g, '')
    .replaceAll(/\s+/g, '-')
    .replaceAll(/-+/g, '-');

  return trimDashes(cleaned);
}

// ─── Scanner ──────────────────────────────────────────────────────────────────

/**
 * Возвращает { meta, content } раздельно,
 * чтобы не создавать неиспользуемых переменных при деструктуризации.
 */
function buildDoc(fullPath) {
  const raw = fs.readFileSync(fullPath, 'utf-8');
  const { metadata, content: cleanContent } = extractFrontMatter(raw);

  const processedContent = processImageSyntax(cleanContent);
  const htmlContent      = marked(preprocessAlerts(processedContent));
  const fileName         = path.basename(fullPath, '.md');
  const slug             = generateSlug(fileName, metadata.canonical);

  const meta = {
    id:          slug,
    title:       metadata.title       || fileName,
    slug,
    description: metadata.description || getFirstParagraph(processedContent),
    type:        metadata.type        || '',
    typename:    metadata.typename    || '',
    author:      metadata.author      || '',
    date:        metadata.date        || new Date().toISOString().split('T')[0],
    tags:        metadata.tags ? metadata.tags.split(',').map((t) => t.trim()) : [],
    keywords:    metadata.keywords    || (metadata.tags ?? ''),
    canonical:   metadata.canonical   || null,
    robots:      metadata.robots      || 'index, follow',
    lang:        metadata.lang        || 'ru',
  };

  return { meta, content: htmlContent };
}

function scanDocs(dir) {
  const manifest = [];

  function scan(currentPath) {
    if (!fs.existsSync(currentPath)) {
      console.warn(`Directory not found: ${currentPath}`);
      return;
    }

    for (const item of fs.readdirSync(currentPath)) {
      const fullPath = path.join(currentPath, item);

      if (fs.statSync(fullPath).isDirectory()) {
        scan(fullPath);
        continue;
      }

      if (!item.endsWith('.md') || item === 'README.md') continue;

      const { meta, content } = buildDoc(fullPath);

      fs.writeFileSync(
        path.join(outputDir, `${meta.slug}.json`),
        JSON.stringify({ ...meta, content }, null, 2)
      );

      manifest.push(meta);
    }
  }

  scan(dir);
  return manifest;
}

// ─── Entry point ──────────────────────────────────────────────────────────────

function generateDocs() {
  console.log('🔄 Generating individual doc files...');

  if (!fs.existsSync(docsDir)) {
    console.error(`❌ Docs directory not found: ${docsDir}`);
    return;
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const manifest = scanDocs(docsDir).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));

  console.log(`✅ Generated ${manifest.length} individual doc files`);
  console.log('✅ Generated manifest.json');
  manifest.forEach((doc) =>
    console.log(`  - ${doc.title} (${doc.type || 'no-category'}) - slug: ${doc.slug}`)
  );
}

generateDocs();
