import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';

marked.setOptions({ breaks: true, gfm: true });

export function scanDocsDirectoryRecursive(baseDir) {
  const results = [];

  function scan(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    for (const item of fs.readdirSync(currentDir)) {
      const fullPath = path.join(currentDir, item);
      if (fs.statSync(fullPath).isDirectory()) {
        scan(fullPath);
      } else if (item.endsWith('.md') && item !== 'README.md') {
        results.push(fullPath);
      }
    }
  }

  scan(baseDir);
  return results;
}

export function slugify(str) {
  return str
    .toLowerCase()
    .replaceAll(/[^\w\s-]/g, '')
    .replaceAll(/\s+/g, '-')
    .replaceAll(/-+/g, '-');
}

export function parseCategoryName(folderName) {
  const match = folderName.match(/^(.+?)\{([^}]+)\}$/);
  if (match) return { title: match[1].trim(), slug: match[2].trim() };
  return { title: folderName, slug: slugify(folderName) };
}

export function extractFrontMatter(content) {
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

export function preprocessAlerts(content) {
  const codeBlocks = [];
  const codeBlockPattern = /```[\s\S]*?```/g;
  const alertPattern = /^:::(note|tip|important|warning|caution)\n([\s\S]*?)^:::$/gm;

  const protected1 = content.replaceAll(codeBlockPattern, (match) => {
    codeBlocks.push(match);
    return `___CODE_BLOCK_${codeBlocks.length - 1}___`;
  });

  const protected2 = protected1.replaceAll(alertPattern, (_match, type, alertContent) => {
    const parsedContent = marked.parse(alertContent.trim());
    return `<div class="custom-alert" data-alert-type="${type}">\n${parsedContent}\n</div>`;
  });

  return protected2.replaceAll(/___CODE_BLOCK_(\d+)___/g, (_match, index) =>
    codeBlocks[Number.parseInt(index, 10)]
  );
}

export function processImageSyntax(content) {
  return content.replaceAll(/\[([^\]]{1,500}\.(?:png|jpg|jpeg|gif|webp|svg))\]/gi, '![](/assets/$1)');
}

export function getFirstParagraph(content) {
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('*') && !trimmed.startsWith('!') && !trimmed.startsWith(':')) {
      return trimmed.substring(0, 160);
    }
  }
  return '';
}

export function getCategoryInfo(fullPath, docsDir) {
  const relativePath = path.relative(docsDir, fullPath);
  const dir = path.dirname(relativePath);
  if (dir === '.' || dir === '') return { typename: '' };
  const parts = dir.split(path.sep);
  const { title } = parseCategoryName(parts[parts.length - 1]);
  return { typename: title };
}

export function generateSlugFromPath(fullPath, docsDir) {
  const relativePath = path.relative(docsDir, fullPath);
  const dir = path.dirname(relativePath);
  const fileName = path.basename(fullPath, '.md');

  if (dir === '.' && fileName === 'welcome') return null;
  if (dir === '.' || dir === '') return slugify(fileName);

  const parts = dir.split(path.sep);
  const slugParts = parts.map((part) => parseCategoryName(part).slug);
  return [...slugParts, slugify(fileName)].join('/');
}

export function buildDocFromPath(mdPath, docsDir) {
  const rawContent = fs.readFileSync(mdPath, 'utf-8');
  const { metadata, content: cleanContent } = extractFrontMatter(rawContent);
  const processed = processImageSyntax(cleanContent);
  const htmlContent = marked(preprocessAlerts(processed));
  const slug = generateSlugFromPath(mdPath, docsDir);
  const { typename } = getCategoryInfo(mdPath, docsDir);
  const fileName = path.basename(mdPath, '.md');

  return {
    id: slug || 'welcome',
    title: metadata.title || fileName,
    slug: slug || '',
    description: metadata.description || getFirstParagraph(processed),
    content: htmlContent,
    typename: metadata.typename || typename,
    author: metadata.author || '',
    date: metadata.date || new Date().toISOString().split('T')[0],
    tags: metadata.tags ? metadata.tags.split(',').map((t) => t.trim()) : [],
    lang: metadata.lang || 'ru',
    keywords: metadata.keywords || '',
    robots: metadata.robots || 'index, follow',
  };
}
