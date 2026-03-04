import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';

marked.setOptions({ breaks: true, gfm: true });

// ─── Nav-popover folder parser ─────────────────────────────────────────────────
// Синтаксис: [book]Документация{docs}
// → { navIcon: 'book', navTitle: 'Документация', navSlug: 'docs' }

export function parseNavPopoverFolder(folderName) {
  const match = folderName.match(/^\[([^\]]+)\](.+?)\{([^}]+)\}$/);
  if (match) {
    return {
      navIcon: match[1].trim(),
      navTitle: match[2].trim(),
      navSlug: match[3].trim(),
    };
  }
  return null;
}

// ─── Category folder parser ────────────────────────────────────────────────────
// Синтаксис: НазваниеКатегории{slug} или просто НазваниеКатегории
export function parseCategoryName(folderName) {
  const nav = parseNavPopoverFolder(folderName);
  if (nav) return { title: nav.navTitle, slug: nav.navSlug };
  const match = folderName.match(/^(.+?)\{([^}]+)\}$/);
  if (match) return { title: match[1].trim(), slug: match[2].trim() };
  return { title: folderName, slug: slugify(folderName) };
}

// ─── Core utils ────────────────────────────────────────────────────────────────

export function slugify(str) {
  return str
    .toLowerCase()
    .replaceAll(/[^\w\s-]/g, '')
    .replaceAll(/\s+/g, '-')
    .replaceAll(/-+/g, '-');
}

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
  return content.replaceAll(
    /\[([^\]]{1,500}\.(?:png|jpg|jpeg|gif|webp|svg))\]/gi,
    '![](/assets/$1)'
  );
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

/**
 * Генерирует slug и nav-popover информацию для файла.
 *
 * Примеры:
 *   Docs/welcome.md                              → slug: '', navSlug: ''
 *   Docs/master-table.md                         → slug: 'master-table', navSlug: ''
 *   Docs/[book]Документация{docs}/guide.md       → slug: 'docs/guide', navSlug: 'docs'
 *   Docs/[book]Документация{docs}/design/d1.md   → slug: 'docs/design/d1', navSlug: 'docs'
 */
export function getDocInfo(fullPath, docsDir) {
  const relativePath = path.relative(docsDir, fullPath);
  const parts = relativePath.split(path.sep);
  const fileName = path.basename(fullPath, '.md');
  const dirs = parts.slice(0, -1); // без имени файла

  // Корневой файл
  if (dirs.length === 0) {
    const isWelcome = fileName === 'welcome';
    return {
      slug: isWelcome ? '' : slugify(fileName),
      navSlug: '',
      navTitle: '',
      navIcon: '',
      typename: '',
    };
  }

  const firstDir = dirs[0];
  const navDef = parseNavPopoverFolder(firstDir);

  if (navDef) {
    // Файл внутри nav-popover папки
    const subDirs = dirs.slice(1); // категории внутри навпоповера
    const slugParts = [navDef.navSlug, ...subDirs.map((d) => parseCategoryName(d).slug), slugify(fileName)];
    const typename = subDirs.length > 0 ? parseCategoryName(subDirs[subDirs.length - 1]).title : '';

    return {
      slug: slugParts.join('/'),
      navSlug: navDef.navSlug,
      navTitle: navDef.navTitle,
      navIcon: navDef.navIcon,
      typename,
    };
  }

  // Обычная папка (без nav-popover)
  const slugParts = [...dirs.map((d) => parseCategoryName(d).slug), slugify(fileName)];
  const typename = parseCategoryName(dirs[dirs.length - 1]).title;

  return {
    slug: slugParts.join('/'),
    navSlug: '',
    navTitle: '',
    navIcon: '',
    typename,
  };
}

export function buildDocFromPath(mdPath, docsDir) {
  const rawContent = fs.readFileSync(mdPath, 'utf-8');
  const { metadata, content: cleanContent } = extractFrontMatter(rawContent);
  const processed = processImageSyntax(cleanContent);
  const htmlContent = marked(preprocessAlerts(processed));
  const info = getDocInfo(mdPath, docsDir);
  const fileName = path.basename(mdPath, '.md');

  return {
    id: info.slug || 'welcome',
    title: metadata.title || fileName,
    slug: info.slug,
    description: metadata.description || getFirstParagraph(processed),
    content: htmlContent,
    typename: metadata.typename || info.typename,
    navSlug: info.navSlug,
    navTitle: info.navTitle,
    navIcon: info.navIcon,
    author: metadata.author || '',
    date: metadata.date || new Date().toISOString().split('T')[0],
    tags: metadata.tags ? metadata.tags.split(',').map((t) => t.trim()) : [],
    lang: metadata.lang || 'ru',
    keywords: metadata.keywords || '',
    robots: metadata.robots || 'index, follow',
    icon: metadata.icon || '',
  };
}
