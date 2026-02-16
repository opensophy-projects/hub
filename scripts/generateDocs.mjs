import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docsDir = path.join(__dirname, '../Docs');
const outputDir = path.join(__dirname, '../public/data/docs');
const manifestFile = path.join(outputDir, 'manifest.json');

// Настройка marked с расширениями
marked.setOptions({
  breaks: true,
  gfm: true,
});

// Добавляем расширения для strikethrough и task lists
marked.use({
  extensions: [
    {
      name: 'strikethrough',
      level: 'inline',
      start(src) { return src.match(/~~/)?.index; },
      tokenizer(src) {
        const match = src.match(/^~~([^~]+)~~/);
        if (match) {
          return {
            type: 'strikethrough',
            raw: match[0],
            text: match[1],
          };
        }
      },
      renderer(token) {
        return `<del>${token.text}</del>`;
      }
    }
  ]
});

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
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('*') && !trimmed.startsWith('!')) {
      return trimmed.substring(0, 160);
    }
  }
  return '';
}

function generateSlug(fileName) {
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

        const docData = {
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
        };

        const docFilePath = path.join(outputDir, `${slug}.json`);
        fs.writeFileSync(docFilePath, JSON.stringify(docData, null, 2));

        manifest.push({
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
    console.log(`  - ${doc.title} (${doc.type}) - slug: ${doc.slug}`);
  });
}

generateDocs();
