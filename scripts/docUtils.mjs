import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import katex from 'katex';

marked.setOptions({ breaks: true, gfm: true });

// ─── KaTeX ────────────────────────────────────────────────────────────────────

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

export function preprocessKatex(content) {
  const protected_ = [];

  let result = content.replaceAll(/```[\s\S]*?```/g, (match) => {
    protected_.push(match);
    return `___PROTECTED_${protected_.length - 1}___`;
  });

  result = result.replaceAll(/`[^`\n]+`/g, (match) => {
    protected_.push(match);
    return `___PROTECTED_${protected_.length - 1}___`;
  });

  result = result.replaceAll(/\$\$([\s\S]+?)\$\$/g, (_match, tex) =>
    `<div class="katex-block not-prose">${renderKatex(tex, true)}</div>`
  );

  result = result.replaceAll(/\$([^\s$][^$\n]*?[^\s$]|\S)\$/g, (_match, tex) =>
    `<span class="katex-inline">${renderKatex(tex, false)}</span>`
  );

  return result.replaceAll(/___PROTECTED_(\d+)___/g, (_, i) => protected_[Number.parseInt(i, 10)]);
}

// ─── Slug-генератор ───────────────────────────────────────────────────────────

function toSlug(str) {
  return str
    .toLowerCase()
    .replaceAll(/\s+/g, '-')
    .replaceAll(/[^\w-]/g, '')
    .replaceAll(/-+/g, '-')
    .replaceAll(/^-|-$/g, '');
}

// ─── Парсер имён записей ──────────────────────────────────────────────────────

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
    slug  = toSlug(title);
  }

  return { type: entryType, icon, title, slug };
}

// ─── Парсеры навигации и категорий ───────────────────────────────────────────

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
  if (matchWithIcon) {
    const t = matchWithIcon[2].trim();
    return { title: t, slug: toSlug(t), icon: matchWithIcon[1].trim() };
  }

  const matchSlugOnly = folderName.match(/^([^{]+)\{([^}]+)\}$/);
  if (matchSlugOnly) return { title: matchSlugOnly[1].trim(), slug: matchSlugOnly[2].trim(), icon: null };

  return { title: folderName, slug: toSlug(folderName), icon: null };
}

// ─── Файловая система ─────────────────────────────────────────────────────────

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

// ─── Front matter ─────────────────────────────────────────────────────────────

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

// ─── Вспомогательные функции ──────────────────────────────────────────────────

const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeAttr(str) {
  return String(str).replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char]);
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

function markedWithCodeBlocks(str, codeBlocks) {
  const restored = str.replaceAll(/___CODE_BLOCK_(\d+)___/g, (_, i) => codeBlocks[Number.parseInt(i, 10)]);
  return marked(restored);
}

// ─── Сборщик тела блока ───────────────────────────────────────────────────────

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

// ─── Парсер вложенных блоков ──────────────────────────────────────────────────

function parseInnerBlocks(bodyStr, innerTag) {
  const lines   = bodyStr.split('\n');
  const results = [];
  const openRe  = new RegExp(String.raw`^:::${innerTag}(?:\[([^\]]*)\])?(?:\s+(\S.*))?\s*$`);
  let i = 0;

  while (i < lines.length) {
    const openMatch = openRe.exec(lines[i].trim());
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

// ─── Построитель карточки ─────────────────────────────────────────────────────

function buildCardHtml(params, body, codeBlocks) {
  const color = params.color ? escapeAttr(params.color) : '';
  let remaining = body;

  const titleMatch = remaining.match(/^\[title\]([^\n]+)$/m);
  const title = titleMatch ? escapeAttr(titleMatch[1].trim()) : '';
  if (titleMatch) remaining = remaining.replace(titleMatch[0], '');

  const iconMatch = remaining.match(/^\[icon\]([^\n]+)$/m);
  const icon = iconMatch ? escapeAttr(iconMatch[1].trim()) : '';
  if (iconMatch) remaining = remaining.replace(iconMatch[0], '');

  const imageMatch = remaining.match(/^\[image\]([^\n]+)$/m);
  const image = imageMatch ? escapeAttr(imageMatch[1].trim()) : '';
  if (imageMatch) remaining = remaining.replace(imageMatch[0], '');

  const contentHtml = markedWithCodeBlocks(remaining.trim(), codeBlocks);
  return `<div class="custom-card" data-color="${color}" data-title="${title}" data-icon="${icon}" data-image="${image}">${contentHtml}</div>`;
}

// ─── Обработчики блоков ───────────────────────────────────────────────────────

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
  const bodyLines   = [];
  let j = i + 1;
  while (j < lines.length && lines[j].trim() !== ':::') {
    bodyLines.push(lines[j]);
    j++;
  }

  const rendered = renderKatex(bodyLines.join('\n').trim(), displayMode);
  output.push(
    displayMode
      ? `<div class="katex-block not-prose">${rendered}</div>`
      : `<p><span class="katex-inline">${rendered}</span></p>`
  );
  return j + 1;
}

// ─── Обработчик блока chart ───────────────────────────────────────────────────

function parseChartMeta(bodyLines) {
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

    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^\|[\s\-:|]+\|$/.test(trimmed)) continue;
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) dataLines.push(trimmed);
  }

  return { type, title, colors, dataLines };
}

function parseCellValue(raw, isFirstColumn) {
  if (isFirstColumn) return raw;
  const num = Number(raw);
  return raw !== '' && !Number.isNaN(num) ? num : raw;
}

function parseChartTableData(dataLines) {
  if (dataLines.length < 2) return [];

  const headers = dataLines[0].slice(1, -1).split('|').map(h => h.trim());

  return dataLines.slice(1).map(row => {
    const cells = row.slice(1, -1).split('|').map(c => c.trim());
    const obj   = {};
    headers.forEach((h, idx) => {
      obj[h] = parseCellValue(cells[idx] ?? '', idx === 0);
    });
    return obj;
  });
}

function handleChartBlock(trimmed, lines, i, output) {
  if (!/^:::chart\s*$/.test(trimmed)) return null;

  const { body, endIndex } = collectBlockBody(lines, i + 1);
  const { type, title, colors, dataLines } = parseChartMeta(body.split('\n'));
  const data = parseChartTableData(dataLines);

  let jsonAttr = '[]';
  try {
    jsonAttr = JSON.stringify(data).replaceAll('"', '&quot;');
  } catch { /* оставляем пустой массив */ }

  output.push(
    `<div class="custom-chart" data-type="${escapeAttr(type)}" data-title="${escapeAttr(title)}" data-colors="${escapeAttr(colors)}" data-chart="${jsonAttr}"></div>`
  );
  return endIndex + 1;
}

// ─── Обработчик блока tabs ────────────────────────────────────────────────────

const TAB_OPEN_RE = /^:::tab(?:\[([^\]]*)\])?\s*$/;
const CODE_BLOCK_RE = /^```([^\n]*)\n([\s\S]*?)```\s*$/;

function parseTabEntry(label, bodyLines, codeBlocks) {
  const tabBody = bodyLines.join('\n');
  const restoredBody = tabBody.replaceAll(/___CODE_BLOCK_(\d+)___/g, (_, idx) => codeBlocks[Number.parseInt(idx, 10)] ?? '');

  const codeMatch = CODE_BLOCK_RE.exec(restoredBody.trim());
  if (!codeMatch) {
    return { label, language: '', code: restoredBody.trim() };
  }

  const lang = codeMatch[1].trim();
  let code = codeMatch[2];
  if (code.endsWith('\n')) code = code.slice(0, -1);
  return { label, language: lang, code };
}

function parseTabsFromBody(body, codeBlocks) {
  const tabLines = body.split('\n');
  const tabs = [];
  let j = 0;

  while (j < tabLines.length) {
    const openMatch = TAB_OPEN_RE.exec(tabLines[j].trim());
    if (!openMatch) { j++; continue; }

    const label = openMatch[1]?.trim() ?? `Вкладка ${tabs.length + 1}`;
    j++;

    const bodyLines = [];
    while (j < tabLines.length) {
      if (tabLines[j].trim() === ':::') { j++; break; }
      bodyLines.push(tabLines[j]);
      j++;
    }

    tabs.push(parseTabEntry(label, bodyLines, codeBlocks));
  }

  return tabs;
}

function handleTabsBlock(trimmed, lines, i, codeBlocks, output) {
  if (!/^:::tabs\s*$/.test(trimmed)) return null;
  const { body, endIndex } = collectBlockBody(lines, i + 1);

  const tabs = parseTabsFromBody(body, codeBlocks);
  if (tabs.length === 0) return endIndex + 1;

  let jsonAttr = '[]';
  try {
    jsonAttr = JSON.stringify(tabs).replaceAll('"', '&quot;');
  } catch { /* оставляем пустой массив */ }

  output.push(`<div class="custom-tabs" data-tabs="${jsonAttr}"></div>`);
  return endIndex + 1;
}

// ─── Препроцессор кастомных блоков ───────────────────────────────────────────

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
      handleChartBlock(trimmed, lines, i, output) ??
      handleTabsBlock(trimmed, lines, i, codeBlocks, output);

    if (nextI == null) { output.push(lines[i]); i++; }
    else               { i = nextI; }
  }

  return output.join('\n');
}

// ─── Препроцессор расширений Markdown ────────────────────────────────────────

export function preprocessMarkdownExtensions(content) {
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

  const ALERT_TYPES     = new Set(['note', 'tip', 'important', 'warning', 'caution']);
  const ALERT_PREFIX_RE = /^:::([a-z]+)$/;
  const alertLines      = withoutCode.split('\n');
  const alertOutput     = [];
  let j = 0;

  while (j < alertLines.length) {
    const alertMatch = ALERT_PREFIX_RE.exec(alertLines[j]);
    const alertType  = alertMatch?.[1];

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

  return preprocessCustomBlocks(alertOutput.join('\n'), codeBlocks)
    .replaceAll(/___CODE_BLOCK_(\d+)___/g, (_match, index) => codeBlocks[Number.parseInt(index, 10)]);
}

// ─── Обработка синтаксиса изображений ────────────────────────────────────────

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

// ─── Информация о документе ───────────────────────────────────────────────────

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

// ─── Чтение и сборка документов ───────────────────────────────────────────────

export function readDoc(mdPath) {
  return fs.readFileSync(mdPath, 'utf-8');
}

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

export function buildDocFromPath(mdPath, docsDir) {
  return parseDoc(readDoc(mdPath), mdPath, docsDir);
}

export function renderMarkdownToHtml(markdown) {
  let content = markdown;
  if (content.startsWith('---\n')) {
    const end = content.indexOf('\n---\n', 4);
    if (end !== -1) content = content.slice(end + 5);
  }
  const processed = processImageSyntax(content);
  const withKatex = preprocessKatex(processed);
  return marked(preprocessMarkdownExtensions(withKatex));
}