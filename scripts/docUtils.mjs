import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';

marked.setOptions({ breaks: true, gfm: true });

// ─── Nav-popover folder parser ─────────────────────────────────────────────────────
export function parseNavPopoverFolder(folderName) {
  const match = folderName.match(/^\[([^\]]+)\](.+?)\{([^}]+)\}$/);
  if (match) {
    return { navIcon: match[1].trim(), navTitle: match[2].trim(), navSlug: match[3].trim() };
  }
  return null;
}

// ─── Category folder parser ────────────────────────────────────────────────────
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

// ─── Helpers ───────────────────────────────────────────────────────────────────

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseParams(paramStr) {
  const params = {};
  if (!paramStr) return params;
  const regex = /([a-zA-Z_-]+)=([^\s,\]]+)/g;
  let m;
  while ((m = regex.exec(paramStr)) !== null) {
    params[m[1]] = m[2];
  }
  return params;
}

// ─── collectBlockBody ─────────────────────────────────────────────────────────
// Starting from line index `startAfterIndex`, collects lines until the matching
// closing `:::` is found (depth-aware). Returns body string and the line index
// of the closing `:::`.

function collectBlockBody(lines, startAfterIndex) {
  const bodyLines = [];
  let depth = 1;
  let i = startAfterIndex;

  while (i < lines.length && depth > 0) {
    const trimmed = lines[i].trim();
    if (/^:::/.test(trimmed)) {
      if (trimmed === ':::') {
        depth--;
        if (depth === 0) {
          return { body: bodyLines.join('\n'), endIndex: i };
        }
        // Still inside — keep as body (nested closer that belongs to an inner block)
        bodyLines.push(lines[i]);
      } else {
        // Opening of a nested block — increase depth
        depth++;
        bodyLines.push(lines[i]);
      }
    } else {
      bodyLines.push(lines[i]);
    }
    i++;
  }

  return { body: bodyLines.join('\n'), endIndex: i - 1 };
}

// ─── parseInnerBlocks ────────────────────────────────────────────────────────
// Parses flat (non-nested) inner blocks like :::card, :::col, :::step.
// Each block ends with its own `:::`.

function parseInnerBlocks(bodyStr, innerTag) {
  const lines = bodyStr.split('\n');
  const results = [];
  let i = 0;

  while (i < lines.length) {
    const openMatch = lines[i].trim().match(
      new RegExp(`^:::${innerTag}(?:\\[([^\\]]*?)\\])?(?:\\s+(.+?))?\\s*$`)
    );

    if (!openMatch) {
      i++;
      continue;
    }

    const params = parseParams(openMatch[1] || '');
    const inlineText = openMatch[2] || '';
    i++;

    const bodyLines = [];
    while (i < lines.length) {
      if (lines[i].trim() === ':::') {
        i++;
        break;
      }
      bodyLines.push(lines[i]);
      i++;
    }

    results.push({ params, inlineText, body: bodyLines.join('\n') });
  }

  return results;
}

// ─── buildCardHtml ────────────────────────────────────────────────────────────

function buildCardHtml(params, body) {
  const color = params.color ? escapeAttr(params.color) : '';

  let remaining = body;

  const titleMatch = remaining.match(/^\[title\](.+)$/m);
  const title = titleMatch ? escapeAttr(titleMatch[1].trim()) : '';
  if (titleMatch) remaining = remaining.replace(titleMatch[0], '');

  const iconMatch = remaining.match(/^\[icon\](.+)$/m);
  const icon = iconMatch ? escapeAttr(iconMatch[1].trim()) : '';
  if (iconMatch) remaining = remaining.replace(iconMatch[0], '');

  const contentHtml = marked(remaining.trim());
  return `<div class="custom-card" data-color="${color}" data-title="${title}" data-icon="${icon}">${contentHtml}</div>`;
}

// ─── preprocessCustomBlocks ───────────────────────────────────────────────────
// Line-by-line processor. Replaces :::cards, :::card, :::columns, :::steps
// with HTML div placeholders that the React parser picks up.

function preprocessCustomBlocks(content) {
  const lines = content.split('\n');
  const output = [];
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    // ── :::cards[cols=N] ──────────────────────────────────────────────────────
    const cardsMatch = trimmed.match(/^:::cards(?:\[([^\]]*?)\])?\s*$/);
    if (cardsMatch) {
      const gridParams = parseParams(cardsMatch[1] || '');
      const cols = Math.min(3, Math.max(1, parseInt(gridParams.cols || '2', 10)));

      const { body, endIndex } = collectBlockBody(lines, i + 1);
      i = endIndex + 1;

      const cards = parseInnerBlocks(body, 'card');
      let html = `<div class="custom-cardgrid" data-cols="${cols}">`;
      for (const card of cards) {
        html += buildCardHtml(card.params, card.body);
      }
      html += '</div>';
      output.push(html);
      continue;
    }

    // ── :::card[color=...] standalone ────────────────────────────────────────
    const cardMatch = trimmed.match(/^:::card(?:\[([^\]]*?)\])?\s*$/);
    if (cardMatch) {
      const cardParams = parseParams(cardMatch[1] || '');

      const { body, endIndex } = collectBlockBody(lines, i + 1);
      i = endIndex + 1;

      output.push(buildCardHtml(cardParams, body));
      continue;
    }

    // ── :::columns[layout=...] ────────────────────────────────────────────────
    const columnsMatch = trimmed.match(/^:::columns(?:\[([^\]]*?)\])?\s*$/);
    if (columnsMatch) {
      const colsParams = parseParams(columnsMatch[1] || '');
      const layout = escapeAttr(colsParams.layout || 'equal');

      const { body, endIndex } = collectBlockBody(lines, i + 1);
      i = endIndex + 1;

      const cols = parseInnerBlocks(body, 'col');
      let html = `<div class="custom-columns" data-layout="${layout}">`;
      for (const col of cols) {
        html += `<div class="custom-col">${marked(col.body.trim())}</div>`;
      }
      html += '</div>';
      output.push(html);
      continue;
    }

    // ── :::steps ──────────────────────────────────────────────────────────────
    const stepsMatch = trimmed.match(/^:::steps\s*$/);
    if (stepsMatch) {
      const { body, endIndex } = collectBlockBody(lines, i + 1);
      i = endIndex + 1;

      const steps = parseInnerBlocks(body, 'step');
      let html = '<div class="custom-steps">';
      for (const step of steps) {
        const status = escapeAttr(step.params.status || 'default');
        const title = escapeAttr(step.inlineText || '');
        const contentHtml = marked(step.body.trim());
        html += `<div class="custom-step" data-status="${status}" data-title="${title}">${contentHtml}</div>`;
      }
      html += '</div>';
      output.push(html);
      continue;
    }

    output.push(lines[i]);
    i++;
  }

  return output.join('\n');
}

// ─── preprocessAlerts ─────────────────────────────────────────────────────────

export function preprocessAlerts(content) {
  const codeBlocks = [];
  const codeBlockPattern = /```[\s\S]*?```/g;
  const alertPattern = /^:::(note|tip|important|warning|caution)\n([\s\S]*?)^:::$/gm;

  // Protect code blocks from being touched by block parsers
  const protected1 = content.replaceAll(codeBlockPattern, (match) => {
    codeBlocks.push(match);
    return `___CODE_BLOCK_${codeBlocks.length - 1}___`;
  });

  // Process GitHub-style alerts (note/tip/important/warning/caution)
  const protected2 = protected1.replaceAll(alertPattern, (_match, type, alertContent) => {
    const parsedContent = marked.parse(alertContent.trim());
    return `<div class="custom-alert" data-alert-type="${type}">\n${parsedContent}\n</div>`;
  });

  // Process custom blocks: cards, columns, steps
  const protected3 = preprocessCustomBlocks(protected2);

  // Restore code blocks
  return protected3.replaceAll(/___CODE_BLOCK_(\d+)___/g, (_match, index) =>
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

export function getDocInfo(fullPath, docsDir) {
  const relativePath = path.relative(docsDir, fullPath);
  const parts = relativePath.split(path.sep);
  const fileName = path.basename(fullPath, '.md');
  const dirs = parts.slice(0, -1);

  if (dirs.length === 0) {
    const isWelcome = fileName === 'welcome';
    return { slug: isWelcome ? '' : slugify(fileName), navSlug: '', navTitle: '', navIcon: '', typename: '' };
  }

  const firstDir = dirs[0];
  const navDef = parseNavPopoverFolder(firstDir);

  if (navDef) {
    const subDirs = dirs.slice(1);
    const slugParts = [navDef.navSlug, ...subDirs.map((d) => parseCategoryName(d).slug), slugify(fileName)];
    const typename = subDirs.length > 0 ? parseCategoryName(subDirs[subDirs.length - 1]).title : '';
    return { slug: slugParts.join('/'), navSlug: navDef.navSlug, navTitle: navDef.navTitle, navIcon: navDef.navIcon, typename };
  }

  const slugParts = [...dirs.map((d) => parseCategoryName(d).slug), slugify(fileName)];
  const typename = parseCategoryName(dirs[dirs.length - 1]).title;
  return { slug: slugParts.join('/'), navSlug: '', navTitle: '', navIcon: '', typename };
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