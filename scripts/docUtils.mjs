import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import katex from 'katex';

marked.setOptions({ breaks: true, gfm: true });

// ─── § KaTeX renderers ────────────────────────────────────────────────────────

function renderKatex(tex, displayMode) {
  try {
    return katex.renderToString(tex.trim(), {
      displayMode,
      throwOnError: false,
      trust: false,
      strict: 'ignore',
    });
  } catch {
    const tag = displayMode ? 'div' : 'span';
    return `<${tag} class="katex-error"><code>${tex}</code></${tag}>`;
  }
}

/**
 * Renders $...$ (inline) and $$...$$ (block) math via KaTeX.
 * Runs BEFORE marked so markdown doesn't mangle LaTeX syntax.
 * Code blocks are protected first.
 */
export function preprocessKatex(content) {
  const protected_ = [];

  // Protect fenced code blocks
  let result = content.replace(/```[\s\S]*?```/g, (match) => {
    protected_.push(match);
    return `___PROTECTED_${protected_.length - 1}___`;
  });

  // Protect inline code
  result = result.replace(/`[^`\n]+`/g, (match) => {
    protected_.push(match);
    return `___PROTECTED_${protected_.length - 1}___`;
  });

  // Block math $$...$$ — must come before inline $
  result = result.replace(/\$\$([\s\S]+?)\$\$/g, (_match, tex) => {
    return `<div class="katex-block not-prose">${renderKatex(tex, true)}</div>`;
  });

  // Inline math $...$ — non-greedy, avoid currency ($50, 100 $)
  result = result.replace(/\$([^\s$][^$\n]*?[^\s$]|\S)\$/g, (_match, tex) => {
    return `<span class="katex-inline">${renderKatex(tex, false)}</span>`;
  });

  // Restore protected blocks
  result = result.replace(/___PROTECTED_(\d+)___/g, (_, i) => protected_[Number.parseInt(i, 10)]);

  return result;
}

// ─── § Entry name parser ──────────────────────────────────────────────────────

export function parseEntryName(name) {
  const typeMatch = name.match(/^\[([NCA])\]/);
  const entryType = typeMatch ? typeMatch[1] : null;
  const rest      = typeMatch ? name.slice(typeMatch[0].length) : name;

  const iconMatch = rest.match(/^\[([^\]]+)\]/);
  const icon      = iconMatch ? iconMatch[1].trim() : null;
  const afterIcon = iconMatch ? rest.slice(iconMatch[0].length) : rest;

  const slugMatch = afterIcon.match(/^([^{]*)\{([^}]+)\}$/);
  let title, slug;

  if (slugMatch) {
    title = slugMatch[1].trim();
    slug  = slugMatch[2].trim();
  } else {
    title = afterIcon.trim();
    slug  = slugify(title);
  }

  return { type: entryType, icon, title, slug };
}

// ─── § Nav popover / category name parsers ────────────────────────────────────

export function parseNavPopoverFolder(folderName) {
  const entry = parseEntryName(folderName);
  if (entry.type === 'N') {
    return { navIcon: entry.icon ?? '', navTitle: entry.title, navSlug: entry.slug };
  }
  return null;
}

export function parseCategoryName(folderName) {
  const entry = parseEntryName(folderName);
  if (entry.type === 'C') {
    return { title: entry.title, slug: entry.slug, icon: entry.icon };
  }

  const matchWithSlug = folderName.match(/^\[([^\]]+)\]([^{]+)\{([^}]+)\}$/);
  if (matchWithSlug) return { title: matchWithSlug[2].trim(), slug: matchWithSlug[3].trim(), icon: matchWithSlug[1].trim() };

  const matchWithIcon = folderName.match(/^\[([^\]]+)\]([^\n]+)$/);
  if (matchWithIcon) return { title: matchWithIcon[2].trim(), slug: slugify(matchWithIcon[2].trim()), icon: matchWithIcon[1].trim() };

  const matchSlugOnly = folderName.match(/^([^{]+)\{([^}]+)\}$/);
  if (matchSlugOnly) return { title: matchSlugOnly[1].trim(), slug: matchSlugOnly[2].trim(), icon: null };

  return { title: folderName, slug: slugify(folderName), icon: null };
}

// ─── § Slugify ────────────────────────────────────────────────────────────────

const TRANSLIT_MAP = {
  а:'a',  б:'b',  в:'v',  г:'g',  д:'d',  е:'e',  ё:'yo', ж:'zh', з:'z',  и:'i',
  й:'y',  к:'k',  л:'l',  м:'m',  н:'n',  о:'o',  п:'p',  р:'r',  с:'s',  т:'t',
  у:'u',  ф:'f',  х:'kh', ц:'ts', ч:'ch', ш:'sh', щ:'shch', ъ:'', ы:'y',
  ь:'',   э:'e',  ю:'yu', я:'ya',
};

export function slugify(str) {
  return str
    .toLowerCase()
    .replaceAll(/[а-яё]/g, (ch) => TRANSLIT_MAP[ch] ?? ch)
    .replaceAll(/[^\w\s-]/g, '')
    .replaceAll(/\s+/g, '-')
    .replaceAll(/-+/g, '-')
    .replaceAll(/^-|-$/g, '');
}

// ─── § File system ────────────────────────────────────────────────────────────

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

// ─── § Front matter ───────────────────────────────────────────────────────────

export function extractFrontMatter(content) {
  if (!content.startsWith('---\n')) return { metadata: {}, content };
  const closeIndex = content.indexOf('\n---\n', 4);
  if (closeIndex === -1) return { metadata: {}, content };

  const rawBlock = content.slice(4, closeIndex);
  const rest     = content.slice(closeIndex + 5);

  const metadata = {};
  for (const line of rawBlock.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key   = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim().replaceAll(/^['"]|['"]$/g, '');
      metadata[key] = value;
    }
  }

  return { metadata, content: rest };
}

// ─── § Helpers ────────────────────────────────────────────────────────────────

function escapeAttr(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function parseParams(paramStr) {
  const params = {};
  if (!paramStr) return params;
  for (const token of paramStr.split(/[\s,]+/)) {
    const eq = token.indexOf('=');
    if (eq > 0) params[token.slice(0, eq)] = token.slice(eq + 1);
  }
  return params;
}

/** Restores placeholder CODE_BLOCK tokens before running marked. */
function markedWithCodeBlocks(str, codeBlocks) {
  const restored = str.replaceAll(/___CODE_BLOCK_(\d+)___/g, (_, i) => codeBlocks[Number.parseInt(i, 10)]);
  return marked(restored);
}

// ─── § Block body collector ───────────────────────────────────────────────────

function collectBlockBody(lines, startAfterIndex) {
  const bodyLines = [];
  let depth = 1;
  let i = startAfterIndex;

  while (i < lines.length && depth > 0) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith(':::')) {
      if (trimmed === ':::') {
        depth--;
        if (depth === 0) return { body: bodyLines.join('\n'), endIndex: i };
      } else {
        depth++;
      }
      bodyLines.push(lines[i]);
    } else {
      bodyLines.push(lines[i]);
    }
    i++;
  }

  return { body: bodyLines.join('\n'), endIndex: i - 1 };
}

// ─── § Inner block parser ─────────────────────────────────────────────────────

function parseInnerBlocks(bodyStr, innerTag) {
  const lines   = bodyStr.split('\n');
  const results = [];
  const openRe  = new RegExp(String.raw`^:::${innerTag}(?:\[([^\]]*)\])?(?:\s+(\S.*))?\s*$`);
  let i = 0;

  while (i < lines.length) {
    const openMatch = lines[i].trim().match(openRe);
    if (!openMatch) { i++; continue; }

    const params     = parseParams(openMatch[1] ?? '');
    const inlineText = openMatch[2] ?? '';
    i++;

    const bodyLines = [];
    while (i < lines.length) {
      if (lines[i].trim() === ':::') { i++; break; }
      bodyLines.push(lines[i]);
      i++;
    }

    results.push({ params, inlineText, body: bodyLines.join('\n') });
  }

  return results;
}

// ─── § Card builder ───────────────────────────────────────────────────────────

function buildCardHtml(params, body, codeBlocks) {
  const color = params.color ? escapeAttr(params.color) : '';
  let remaining = body;

  const titleMatch = remaining.match(/^\[title\]([^\n]+)$/m);
  const title = titleMatch ? escapeAttr(titleMatch[1].trim()) : '';
  if (titleMatch) remaining = remaining.replace(titleMatch[0], '');

  const iconMatch = remaining.match(/^\[icon\]([^\n]+)$/m);
  const icon = iconMatch ? escapeAttr(iconMatch[1].trim()) : '';
  if (iconMatch) remaining = remaining.replace(iconMatch[0], '');

  const contentHtml = markedWithCodeBlocks(remaining.trim(), codeBlocks);
  return `<div class="custom-card" data-color="${color}" data-title="${title}" data-icon="${icon}">${contentHtml}</div>`;
}

// ─── § Block handlers ─────────────────────────────────────────────────────────

function handleCardsBlock(trimmed, lines, i, codeBlocks, output) {
  const match = trimmed.match(/^:::cards(?:\[([^\]]*)\])?\s*$/);
  if (!match) return null;
  const cols = Math.min(3, Math.max(1, Number.parseInt(parseParams(match[1] ?? '').cols ?? '2', 10)));
  const { body, endIndex } = collectBlockBody(lines, i + 1);
  let html = `<div class="custom-cardgrid" data-cols="${cols}">`;
  for (const card of parseInnerBlocks(body, 'card')) html += buildCardHtml(card.params, card.body, codeBlocks);
  html += '</div>';
  output.push(html);
  return endIndex + 1;
}

function handleCardBlock(trimmed, lines, i, codeBlocks, output) {
  const match = trimmed.match(/^:::card(?:\[([^\]]*)\])?\s*$/);
  if (!match) return null;
  const { body, endIndex } = collectBlockBody(lines, i + 1);
  output.push(buildCardHtml(parseParams(match[1] ?? ''), body, codeBlocks));
  return endIndex + 1;
}

function handleColumnsBlock(trimmed, lines, i, codeBlocks, output) {
  const match = trimmed.match(/^:::columns(?:\[([^\]]*)\])?\s*$/);
  if (!match) return null;
  const layout = escapeAttr(parseParams(match[1] ?? '').layout ?? 'equal');
  const { body, endIndex } = collectBlockBody(lines, i + 1);
  let html = `<div class="custom-columns" data-layout="${layout}">`;
  for (const col of parseInnerBlocks(body, 'col'))
    html += `<div class="custom-col">${markedWithCodeBlocks(col.body.trim(), codeBlocks)}</div>`;
  html += '</div>';
  output.push(html);
  return endIndex + 1;
}

function handleStepsBlock(trimmed, lines, i, codeBlocks, output) {
  if (!/^:::steps\s*$/.test(trimmed)) return null;
  const { body, endIndex } = collectBlockBody(lines, i + 1);
  let html = '<div class="custom-steps">';
  for (const step of parseInnerBlocks(body, 'step')) {
    const status = escapeAttr(step.params.status ?? 'default');
    const title  = escapeAttr(step.inlineText ?? '');
    const color  = step.params.color ? escapeAttr(step.params.color) : '';
    html += `<div class="custom-step" data-status="${status}" data-title="${title}" data-color="${color}">${markedWithCodeBlocks(step.body.trim(), codeBlocks)}</div>`;
  }
  html += '</div>';
  output.push(html);
  return endIndex + 1;
}

function handleMathBlock(trimmed, lines, i, output) {
  const match = trimmed.match(/^:::math(?:\[([^\]]*)\])?\s*$/);
  if (!match) return null;

  const displayMode = (match[1] ?? '').trim() === 'display';

  const bodyLines = [];
  let j = i + 1;
  while (j < lines.length && lines[j].trim() !== ':::') {
    bodyLines.push(lines[j]);
    j++;
  }

  const tex      = bodyLines.join('\n').trim();
  const rendered = renderKatex(tex, displayMode);

  if (displayMode) {
    output.push(`<div class="katex-block not-prose">${rendered}</div>`);
  } else {
    output.push(`<p><span class="katex-inline">${rendered}</span></p>`);
  }

  return j + 1;
}

// ─── § Chart block handler ────────────────────────────────────────────────────

function handleChartBlock(trimmed, lines, i, output) {
  if (!/^:::chart\s*$/.test(trimmed)) return null;

  const { body, endIndex } = collectBlockBody(lines, i + 1);
  const bodyLines = body.split('\n');

  let type   = 'bar';
  let title  = '';
  let colors = '';
  const dataLines = [];

  for (const line of bodyLines) {
    const typeMatch  = line.match(/^\[type\](.+)$/);
    const titleMatch = line.match(/^\[title\](.+)$/);
    const colorMatch = line.match(/^\[colors?\](.+)$/);

    if (typeMatch)  { type   = typeMatch[1].trim();  continue; }
    if (titleMatch) { title  = titleMatch[1].trim();  continue; }
    if (colorMatch) { colors = colorMatch[1].trim();  continue; }

    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    // Пропускаем строку-разделитель |---|---|
    if (/^\|[\s\-:|]+\|$/.test(trimmedLine)) continue;
    // Строки таблицы
    if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
      dataLines.push(trimmedLine);
    }
  }

  // Парсим markdown-таблицу → массив объектов
  let data = [];
  if (dataLines.length >= 2) {
    const headers = dataLines[0]
      .slice(1, -1)
      .split('|')
      .map(h => h.trim());

    for (let r = 1; r < dataLines.length; r++) {
      const cells = dataLines[r]
        .slice(1, -1)
        .split('|')
        .map(c => c.trim());

      const row = {};
      headers.forEach((h, idx) => {
        const raw = cells[idx] ?? '';
        // Первая колонка — строковая метка (ось X), остальные — числа
        row[h] = idx === 0 ? raw : (raw !== '' && !isNaN(Number(raw)) ? Number(raw) : raw);
      });
      data.push(row);
    }
  }

  // JSON в data-атрибут — экранируем только &quot; для HTML-атрибута
  let jsonAttr = '[]';
  try {
    jsonAttr = JSON.stringify(data).replaceAll('"', '&quot;');
  } catch { /* оставляем пустой массив */ }

  output.push(
    `<div class="custom-chart" data-type="${escapeAttr(type)}" data-title="${escapeAttr(title)}" data-colors="${escapeAttr(colors)}" data-chart="${jsonAttr}"></div>`
  );

  return endIndex + 1;
}

// ─── § Custom block preprocessor ─────────────────────────────────────────────

function preprocessCustomBlocks(content, codeBlocks) {
  const lines  = content.split('\n');
  const output = [];
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();
    const nextI =
      handleCardsBlock(trimmed, lines, i, codeBlocks, output) ??
      handleCardBlock(trimmed, lines, i, codeBlocks, output) ??
      handleColumnsBlock(trimmed, lines, i, codeBlocks, output) ??
      handleStepsBlock(trimmed, lines, i, codeBlocks, output) ??
      handleMathBlock(trimmed, lines, i, output) ??
      handleChartBlock(trimmed, lines, i, output);

    if (nextI == null) { output.push(lines[i]); i++; }
    else               { i = nextI; }
  }

  return output.join('\n');
}

// ─── § Markdown extensions preprocessor ──────────────────────────────────────

export function preprocessMarkdownExtensions(content) {
  // ── Step 1: extract code blocks ───────────────────────────────────────────
  const codeBlocks = [];
  let withoutCode  = '';
  let searchFrom   = 0;

  while (true) {
    const open = content.indexOf('```', searchFrom);
    if (open === -1) { withoutCode += content.slice(searchFrom); break; }
    const close = content.indexOf('```', open + 3);
    if (close === -1) { withoutCode += content.slice(searchFrom); break; }
    withoutCode += content.slice(searchFrom, open);
    codeBlocks.push(content.slice(open, close + 3));
    withoutCode += `___CODE_BLOCK_${codeBlocks.length - 1}___`;
    searchFrom = close + 3;
  }

  // ── Step 2: process GitHub-style alert blocks ─────────────────────────────
  const ALERT_TYPES     = new Set(['note', 'tip', 'important', 'warning', 'caution']);
  const ALERT_PREFIX_RE = /^:::([a-z]+)$/;
  const alertLines      = withoutCode.split('\n');
  const alertOutput     = [];
  let j = 0;

  while (j < alertLines.length) {
    const alertType = ALERT_PREFIX_RE.exec(alertLines[j])?.[1];

    if (alertType && ALERT_TYPES.has(alertType)) {
      const bodyLines = [];
      j++;
      while (j < alertLines.length && alertLines[j] !== ':::') {
        bodyLines.push(alertLines[j]);
        j++;
      }
      alertOutput.push(
        `<div class="custom-alert" data-alert-type="${alertType}">\n${marked.parse(bodyLines.join('\n').trim())}\n</div>`
      );
      j++;
    } else {
      alertOutput.push(alertLines[j]);
      j++;
    }
  }

  // ── Step 3: process remaining custom blocks (cards, columns, steps, math, chart)
  // ── Step 4: restore code block placeholders ───────────────────────────────
  return preprocessCustomBlocks(alertOutput.join('\n'), codeBlocks)
    .replaceAll(/___CODE_BLOCK_(\d+)___/g, (_match, index) => codeBlocks[Number.parseInt(index, 10)]);
}

// ─── § Content helpers ────────────────────────────────────────────────────────

export function processImageSyntax(content) {
  return content.replaceAll(
    /\[([^\]]{1,500}\.(?:png|jpg|jpeg|gif|webp|svg))\]/gi,
    '![](/assets/$1)'
  );
}

export function getFirstParagraph(content) {
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('*') && !trimmed.startsWith('!') && !trimmed.startsWith(':'))
      return trimmed.substring(0, 160);
  }
  return '';
}

// ─── § Doc info ───────────────────────────────────────────────────────────────

export function getDocInfo(fullPath, docsDir) {
  const relativePath = path.relative(docsDir, fullPath);
  const parts        = relativePath.split(path.sep);
  const fileName     = path.basename(fullPath, '.md');
  const dirs         = parts.slice(0, -1);

  const fileEntry = parseEntryName(fileName);
  const fileSlug  = fileEntry.slug;
  const fileIcon  = fileEntry.icon;

  if (dirs.length === 0) {
    return {
      slug:         fileName === 'welcome' ? '' : fileSlug,
      navSlug:      '',
      navTitle:     '',
      navIcon:      '',
      typename:     '',
      categoryPath: [],
      fileIcon,
    };
  }

  const firstEntry   = parseEntryName(dirs[0]);
  const isNavPopover = firstEntry.type === 'N';

  if (isNavPopover) {
    const navDef = {
      navIcon:  firstEntry.icon ?? '',
      navTitle: firstEntry.title,
      navSlug:  firstEntry.slug,
    };

    const categoryPath = dirs.slice(1).map((d) => {
      const info = parseCategoryName(d);
      return { slug: info.slug, title: info.title, icon: info.icon };
    });

    const slug    = [navDef.navSlug, ...categoryPath.map(c => c.slug), fileSlug].join('/');
    const lastCat = categoryPath[categoryPath.length - 1] ?? null;

    return {
      slug,
      navSlug:      navDef.navSlug,
      navTitle:     navDef.navTitle,
      navIcon:      navDef.navIcon,
      typename:     lastCat?.title ?? '',
      categoryPath,
      fileIcon,
    };
  }

  const categoryPath = dirs.map((d) => {
    const info = parseCategoryName(d);
    return { slug: info.slug, title: info.title, icon: info.icon };
  });

  const slug    = [...categoryPath.map(c => c.slug), fileSlug].join('/');
  const lastCat = categoryPath[categoryPath.length - 1] ?? null;

  return {
    slug,
    navSlug:      '',
    navTitle:     '',
    navIcon:      '',
    typename:     lastCat?.title ?? '',
    categoryPath,
    fileIcon,
  };
}

// ─── § Doc IO ─────────────────────────────────────────────────────────────────

export function readDoc(mdPath) {
  return fs.readFileSync(mdPath, 'utf-8');
}

// ─── § Doc builder ────────────────────────────────────────────────────────────

export function parseDoc(rawContent, mdPath, docsDir) {
  const { metadata, content: cleanContent } = extractFrontMatter(rawContent);
  const processed                           = processImageSyntax(cleanContent);
  const withKatex                           = preprocessKatex(processed);
  const htmlContent                         = marked(preprocessMarkdownExtensions(withKatex));
  const info                                = getDocInfo(mdPath, docsDir);
  const fileEntry                           = parseEntryName(path.basename(mdPath, '.md'));

  const finalTitle    = metadata.title?.trim()   || fileEntry.title || path.basename(mdPath, '.md');
  const finalTypename = metadata.typename?.trim() || info.typename;
  const finalIcon     = metadata.icon?.trim()    || info.fileIcon || '';

  return {
    id:           info.slug || 'welcome',
    title:        finalTitle,
    slug:         info.slug,
    description:  metadata.description || getFirstParagraph(processed),
    content:      htmlContent,
    typename:     finalTypename,
    categoryPath: info.categoryPath,
    navSlug:      info.navSlug,
    navTitle:     info.navTitle,
    navIcon:      info.navIcon,
    author:       metadata.author   || '',
    date:         metadata.date     || new Date().toISOString().split('T')[0],
    updated:      metadata.updated  || '',
    tags:         metadata.tags ? metadata.tags.split(',').map((t) => t.trim()) : [],
    lang:         metadata.lang     || 'ru',
    keywords:     metadata.keywords || '',
    robots:       metadata.robots   || 'index, follow',
    icon:         finalIcon,
  };
}

/** Convenience wrapper: reads the file and parses it in one call. */
export function buildDocFromPath(mdPath, docsDir) {
  const rawContent = readDoc(mdPath);
  return parseDoc(rawContent, mdPath, docsDir);
}