import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docsDir = path.join(__dirname, '../Docs');
const outputDir = path.join(__dirname, '../public/data/docs');
const manifestFile = path.join(outputDir, 'manifest.json');

marked.setOptions({
  breaks: true,
  gfm: true,
});

function preprocessAlerts(content) {
  const codeBlocks = [];
  const codeBlockPattern = /```[\s\S]*?```/g;
  
  let protectedContent = content.replace(codeBlockPattern, (match) => {
    const index = codeBlocks.length;
    codeBlocks.push(match);
    return `___CODE_BLOCK_${index}___`;
  });
  
  const alertPattern = /^:::(note|tip|important|warning|caution)\n([\s\S]*?)^:::$/gm;
  
  protectedContent = protectedContent.replace(alertPattern, (match, type, alertContent) => {
    const cleanContent = alertContent.trim();
    return `<div class="custom-alert" data-alert-type="${type}">\n${cleanContent}\n</div>`;
  });
  
  protectedContent = protectedContent.replace(/___CODE_BLOCK_(\d+)___/g, (match, index) => {
    return codeBlocks[parseInt(index, 10)];
  });
  
  return protectedContent;
}

function extractFrontMatter(content) {
  const frontMatterRegex = /^---\n([\s\S]*?)\n---\n/;
  const match = content.match(frontMatterRegex);
  
  if (!match) {
    return { metadata: {}, content };
  }

  const metadata = {};
  const lines = match[1].split('\n');

  for (const line of lines) {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      const value = valueParts.join(':').trim().replace(/^['"]/, '').replace(/['"]$/, '');
      metadata[key.trim()] = value;
    }
  }

  const contentWithoutFrontMatter = content.replace(frontMatterRegex, '');
  return { metadata, content: contentWithoutFrontMatter };
}

function processImageSyntax(content) {
  return content.replaceAll(/\[([^\]]{1,500}\.(?:png|jpg|jpeg|gif|webp|svg))\]/gi, '![](/assets/$1)');
}

function getFirstParagraph(content) {
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('*') && !trimmed.startsWith('!') && !trimmed.startsWith(':')) {
      return trimmed.substring(0, 160);
    }
  }
  return '';
}

function generateSlug(fileName, canonical) {
  if (canonical && canonical !== 'null') {
    return canonical.replace(/^\/+/, '');
  }
  
  let slug = fileName
    .replace('.md', '')
    .toLowerCase();
  
  slug = slug.replaceAll(/[^\w\s-]/g, '');
  slug = slug.replaceAll(/\s+/g, '-');
  
  while (slug.startsWith('-') && slug.length > 0) {
    slug = slug.slice(1);
  }
  
  while (slug.endsWith('-') && slug.length > 0) {
    slug = slug.slice(0, -1);
  }
  
  slug = slug.replaceAll(/-+/g, '-');
  
  return slug;
}

function scanDocs(dir) {
  const manifest = [];
  
  function scan(currentPath) {
    if (!fs.existsSync(currentPath)) {
      console.warn(`Directory not found: ${currentPath}`);
      return;
    }

    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (item.endsWith('.md') && item !== 'README.md') {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const { metadata, content: cleanContent } = extractFrontMatter(content);

        const processedContent = processImageSyntax(cleanContent);
        const preprocessedContent = preprocessAlerts(processedContent);
        const htmlContent = marked(preprocessedContent);

        const fileName = path.basename(fullPath, '.md');
        const slug = generateSlug(fileName, metadata.canonical);
        
        const title = metadata.title || fileName;
        const description = metadata.description || getFirstParagraph(processedContent);
        const type = metadata.type || '';
        const typename = metadata.typename || '';
        const author = metadata.author || '';
        const date = metadata.date || new Date().toISOString().split('T')[0];
        const tags = metadata.tags ? metadata.tags.split(',').map(t => t.trim()) : [];
        const keywords = metadata.keywords || tags.join(', ');
        const canonical = metadata.canonical || null;
        const robots = metadata.robots || 'index, follow';
        const lang = metadata.lang || 'ru';

        const docData = {
          id: slug,
          title,
          slug,
          description,
          type,
          typename,
          author,
          date,
          tags,
          keywords,
          canonical,
          robots,
          lang,
          content: htmlContent,
        };

        const docFilePath = path.join(outputDir, `${slug}.json`);
        fs.writeFileSync(docFilePath, JSON.stringify(docData, null, 2));

        manifest.push({
          id: slug,
          title,
          slug,
          description,
          type,
          typename,
          author,
          date,
          tags,
          keywords,
          canonical,
          robots,
          lang,
        });
      }
    }
  }

  scan(dir);
  return manifest;
}

function generateDocs() {
  console.log('🔄 Generating individual doc files...');

  if (!fs.existsSync(docsDir)) {
    console.error(`❌ Docs directory not found: ${docsDir}`);
    return;
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const manifest = scanDocs(docsDir);

  manifest.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
  
  console.log(`✅ Generated ${manifest.length} individual doc files`);
  console.log(`✅ Generated manifest.json`);
  
  manifest.forEach(doc => {
    console.log(`  - ${doc.title} (${doc.type || 'no-category'}) - slug: ${doc.slug}`);
  });
}

generateDocs();
