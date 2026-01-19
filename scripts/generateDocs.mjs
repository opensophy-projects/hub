import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docsDir = path.join(__dirname, '../Docs');
const outputFile = path.join(__dirname, '../src/data/docs.json');

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
      const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
      metadata[key.trim()] = value;
    }
  }

  const contentWithoutFrontMatter = content.replace(frontMatterRegex, '');
  return { metadata, content: contentWithoutFrontMatter };
}

function processImageSyntax(content) {
  return content.replace(/\[([^\]]+\.(png|jpg|jpeg|gif|webp|svg))\]/gi, '![](/assets/$1)');
}

function getFirstParagraph(content) {
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('*') && !trimmed.startsWith('!')) {
      return trimmed.substring(0, 160);
    }
  }
  return '';
}

function generateSlug(fileName) {
  return fileName
    .replace('.md', '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .replace(/--+/g, '-');
}

function scanDocs(dir) {
  const docs = [];
  
  function scan(currentPath, currentCategory = null) {
    if (!fs.existsSync(currentPath)) {
      console.warn(`Directory not found: ${currentPath}`);
      return;
    }

    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scan(fullPath, item);
      } else if (item.endsWith('.md') && item !== 'README.md') {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const { metadata, content: cleanContent } = extractFrontMatter(content);

        const processedContent = processImageSyntax(cleanContent);

        const fileName = path.basename(fullPath, '.md');
        const slug = generateSlug(fileName);
        
        const title = metadata.title || fileName;
        const description = metadata.description || getFirstParagraph(processedContent);
        const type = metadata.type || 'docs';
        const category = metadata.category || currentCategory || 'Прочие';
        const bannercolor = metadata.bannercolor || '#3b82f6';
        const bannertext = metadata.bannertext || title;
        const author = metadata.author || 'VeilStack';
        const date = metadata.date || new Date().toISOString().split('T')[0];
        const tags = metadata.tags ? metadata.tags.split(',').map(t => t.trim()) : [];
        const keywords = metadata.keywords || tags.join(', ');
        const canonical = metadata.canonical || null;
        const robots = metadata.robots || 'index, follow';
        const lang = metadata.lang || 'ru';

        docs.push({
          id: slug,
          title,
          slug,
          description,
          type,
          category,
          bannercolor,
          bannertext,
          author,
          date,
          tags,
          keywords,
          canonical,
          robots,
          lang,
          content: processedContent,
        });
      }
    }
  }

  scan(dir);
  return docs;
}

function generateDocs() {
  console.log('🔄 Generating docs...');

  if (!fs.existsSync(docsDir)) {
    console.error(`❌ Docs directory not found: ${docsDir}`);
    return;
  }

  const docs = scanDocs(docsDir);

  docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, JSON.stringify(docs, null, 2));
  console.log(`✅ Generated docs.json with ${docs.length} documents`);
  
  docs.forEach(doc => {
    console.log(`  - ${doc.title} (${doc.type}) - slug: ${doc.slug}`);
  });
}

generateDocs();
