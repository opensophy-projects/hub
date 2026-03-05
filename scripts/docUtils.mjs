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

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ─── Block extractor: splits content into nested :::tag blocks ──────────────
// Returns array of { tag, params, body } for top-level blocks
function extractBlocks(content, tag) {
  const results = [];
  const openPattern = new RegExp(`^:::${tag}(?:\\[([^\\]]*?)\\])?(?:\\s+(.+?))?\\s*$`, 'm');
  let remaining = content;

  while (true) {
    const startMatch = openPattern.exec(remaining);
    if (!startMatch) break;

    const startIndex = startMatch.index;
    const afterOpen = startMatch.index + startMatch[0].length + 1; // +1 for newline
    const params = startMatch[1] || '';
    const inlineTitle = startMatch[2] || '';

    // Find matching closing ::: by counting nesting
    let depth = 1;
    let pos = afterOpen;
    while (pos < remaining.length && depth > 0) {
      const nextOpen = remaining.indexOf('\n:::', pos);
      if (nextOpen === -1) break;
      const lineStart = nextOpen + 1;
      const lineEnd = remaining.indexOf('\n', lineStart);
      const line = remaining.slice(lineStart, lineEnd === -1 ? undefined : lineEnd).trim();
      if (line === ':::') {
        depth--;
        if (depth === 0) {
          const body = remaining.slice(afterOpen, lineStart - 1);
          results.push({ params, inlineTitle, body, startIndex, endIndex: lineEnd === -1 ? remaining.length : lineEnd + 1 });
          remaining = remaining.slice(0, startIndex) + `\x00BLOCK${results.length - 1}\x00` + remaining.slice(lineEnd === -1 ? remaining.length : lineEnd + 1);
          break;
        }
      } else if (/^:::/.test(line)) {
        depth++;
      }
      pos = lineStart + 1;
    }

    if (depth > 0) break; // malformed block, stop
  }

  return { results, remaining };
}

// ─── Parse params string: "key=value key2=value2" ─────────────────────────────
function parseParams(paramStr) {
  const params = {};
  if (!paramStr) return params;
  const regex = /([a-zA-Z_-]+)=([^\s,]+)/g;
  let m;
  while ((m = regex.exec(paramStr)) !== null) {
    params[m[1]] = m[2];
  }
  return params;
}

// ─── preprocessCards ──────────────────────────────────────────────────────────
// Handles both standalone :::card and :::cards[cols=N] wrappers

function preprocessCards(content) {
  // First handle :::cards[cols=N] wrappers
  const { results: grids, remaining: afterGrids } = extractBlocks(content, 'cards');

  let result = afterGrids;

  for (let gi = 0; gi < grids.length; gi++) {
    const grid = grids[gi];
    const gridParams = parseParams(grid.params);
    const cols = Math.min(3, Math.max(1, parseInt(gridParams.cols || '2', 10)));

    // Parse individual :::card blocks inside the grid body
    const cardHtmls = [];
    let bodyRemaining = grid.body;

    const cardOpenPattern = /^:::card(?:\[([^\]]*?)\])?\s*$/m;
    while (true) {
      const cardMatch = cardOpenPattern.exec(bodyRemaining);
      if (!cardMatch) break;

      const cardParams = parseParams(cardMatch[1] || '');
      const afterCardOpen = cardMatch.index + cardMatch[0].length + 1;

      // Find closing :::
      const closeIndex = bodyRemaining.indexOf('\n:::', afterCardOpen);
      if (closeIndex === -1) break;

      const cardBody = bodyRemaining.slice(afterCardOpen, closeIndex);
      const endIndex = closeIndex + 4; // past \n:::

      cardHtmls.push(buildCardHtml(cardParams, cardBody));

      bodyRemaining = bodyRemaining.slice(0, cardMatch.index) + bodyRemaining.slice(endIndex);
    }

    const gridHtml = `<div class="custom-cardgrid" data-cols="${cols}">${cardHtmls.join('')}</div>`;
    result = result.replace(`\x00BLOCK${gi}\x00`, gridHtml);
  }

  // Now handle standalone :::card blocks
  const { results: cards, remaining: afterCards } = extractBlocks(result, 'card');
  result = afterCards;

  for (let ci = 0; ci < cards.length; ci++) {
    const card = cards[ci];
    const cardParams = parseParams(card.params);
    const cardHtml = buildCardHtml(cardParams, card.body);
    result = result.replace(`\x00BLOCK${ci}\x00`, cardHtml);
  }

  return result;
}

function buildCardHtml(params, body) {
  const color = params.color ? escapeHtml(params.color) : '';

  // Extract [title] and [icon] from body
  let title = '';
  let icon = '';
  let remaining = body;

  const titleMatch = remaining.match(/^\[title\](.+)$/m);
  if (titleMatch) {
    title = escapeHtml(titleMatch[1].trim());
    remaining = remaining.replace(titleMatch[0], '').trim();
  }

  const iconMatch = remaining.match(/^\[icon\](.+)$/m);
  if (iconMatch) {
    icon = escapeHtml(iconMatch[1].trim());
    remaining = remaining.replace(iconMatch[0], '').trim();
  }

  const contentHtml = marked(remaining.trim());

  return `<div class="custom-card" data-color="${color}" data-title="${title}" data-icon="${icon}">${contentHtml}</div>`;
}

// ─── preprocessColumns ────────────────────────────────────────────────────────

function preprocessColumns(content) {
  const { results: colGroups, remaining: afterColGroups } = extractBlocks(content, 'columns');
  let result = afterColGroups;

  for (let gi = 0; gi < colGroups.length; gi++) {
    const group = colGroups[gi];
    const groupParams = parseParams(group.params);
    const layout = groupParams.layout || 'equal';

    // Parse :::col blocks inside
    const colHtmls = [];
    let bodyRemaining = group.body;

    const colOpenPattern = /^:::col\s*$/m;
    while (true) {
      const colMatch = colOpenPattern.exec(bodyRemaining);
      if (!colMatch) break;

      const afterColOpen = colMatch.index + colMatch[0].length + 1;
      const closeIndex = bodyRemaining.indexOf('\n:::', afterColOpen);
      if (closeIndex === -1) break;

      const colBody = bodyRemaining.slice(afterColOpen, closeIndex);
      const endIndex = closeIndex + 4;

      const colContentHtml = marked(colBody.trim());
      colHtmls.push(`<div class="custom-col">${colContentHtml}</div>`);

      bodyRemaining = bodyRemaining.slice(0, colMatch.index) + bodyRemaining.slice(endIndex);
    }

    const columnsHtml = `<div class="custom-columns" data-layout="${escapeHtml(layout)}">${colHtmls.join('')}</div>`;
    result = result.replace(`\x00BLOCK${gi}\x00`, columnsHtml);
  }

  return result;
}

// ─── preprocessSteps ──────────────────────────────────────────────────────────

function preprocessSteps(content) {
  const { results: stepGroups, remaining: afterStepGroups } = extractBlocks(content, 'steps');
  let result = afterStepGroups;

  for (let gi = 0; gi < stepGroups.length; gi++) {
    const group = stepGroups[gi];

    // Parse :::step blocks inside
    const stepHtmls = [];
    let bodyRemaining = group.body;

    // :::step[status=done] Title text  OR  :::step Title text
    const stepOpenPattern = /^:::step(?:\[([^\]]*?)\])?\s+(.+?)\s*$/m;
    while (true) {
      const stepMatch = stepOpenPattern.exec(bodyRemaining);
      if (!stepMatch) break;

      const stepParams = parseParams(stepMatch[1] || '');
      const stepTitle = escapeHtml(stepMatch[2] || '');
      const status = stepParams.status || 'default';

      const afterStepOpen = stepMatch.index + stepMatch[0].length + 1;
      const closeIndex = bodyRemaining.indexOf('\n:::', afterStepOpen);
      if (closeIndex === -1) break;

      const stepBody = bodyRemaining.slice(afterStepOpen, closeIndex);
      const endIndex = closeIndex + 4;

      const stepContentHtml = marked(stepBody.trim());
      stepHtmls.push(`<div class="custom-step" data-status="${escapeHtml(status)}" data-title="${stepTitle}">${stepContentHtml}</div>`);

      bodyRemaining = bodyRemaining.slice(0, stepMatch.index) + bodyRemaining.slice(endIndex);
    }

    const stepsHtml = `<div class="custom-steps">${stepHtmls.join('')}</div>`;
    result = result.replace(`\x00BLOCK${gi}\x00`, stepsHtml);
  }

  return result;
}

// ─── preprocessAlerts (original + new blocks) ─────────────────────────────────

export function preprocessAlerts(content) {
  const codeBlocks = [];
  const codeBlockPattern = /```[\s\S]*?```/g;
  const alertPattern = /^:::(note|tip|important|warning|caution)\n([\s\S]*?)^:::$/gm;

  // Protect code blocks
  const protected1 = content.replaceAll(codeBlockPattern, (match) => {
    codeBlocks.push(match);
    return `___CODE_BLOCK_${codeBlocks.length - 1}___`;
  });

  // Process alerts
  const protected2 = protected1.replaceAll(alertPattern, (_match, type, alertContent) => {
    const parsedContent = marked.parse(alertContent.trim());
    return `<div class="custom-alert" data-alert-type="${type}">\n${parsedContent}\n</div>`;
  });

  // Process new custom blocks
  const protected3 = preprocessCards(protected2);
  const protected4 = preprocessColumns(protected3);
  const protected5 = preprocessSteps(protected4);

  // Restore code blocks
  return protected5.replaceAll(/___CODE_BLOCK_(\d+)___/g, (_match, index) =>
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