import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';

marked.setOptions({ breaks: true, gfm: true });

// ─── Slug / Name parsers ──────────────────────────────────────────────────────

/**
 * Парсит имя папки/файла по новой схеме:
 *   [N][icon]Title{slug}  — Nav Popover
 *   [C][icon]Title{slug}  — Категория
 *   [A][icon]Title{slug}  — Статья (md-файл без расширения)
 *
 * {slug} опционален — если не указан, генерируется из Title через slugify.
 * [icon] опционален.
 *
 * Возвращает: { type: 'N'|'C'|'A'|null, icon: string|null, title: string, slug: string }
 */
export function parseEntryName(name) {
  // Определяем тип: N, C или A
  const typeMatch = name.match(/^\[([NCA])\]/);
  const entryType = typeMatch ? typeMatch[1] : null;
  const rest      = typeMatch ? name.slice(typeMatch[0].length) : name;

  // Извлекаем иконку [icon]
  const iconMatch = rest.match(/^\[([^\]]+)\]/);
  const icon      = iconMatch ? iconMatch[1].trim() : null;
  const afterIcon = iconMatch ? rest.slice(iconMatch[0].length) : rest;

  // Извлекаем slug {slug}
  // [^{]* вместо .*? — исключает backtracking (ReDoS)
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

/** Обратная совместимость — парсер navPopover (поддерживает и старый, и новый форматы) */
export function parseNavPopoverFolder(folderName) {
  // Новая схема: [N][icon]Title{slug}
  const entry = parseEntryName(folderName);
  if (entry.type === 'N') {
    return { navIcon: entry.icon ?? '', navTitle: entry.title, navSlug: entry.slug };
  }

  // Старая схема: [icon]Title{slug}
  const match = folderName.match(/^\[([^\]]+)\]([^{]+)\{([^}]+)\}$/);
  if (match) return { navIcon: match[1].trim(), navTitle: match[2].trim(), navSlug: match[3].trim() };

  return null;
}

/** Парсит имя папки-категории (поддерживает [C] и старые форматы) */
export function parseCategoryName(folderName) {
  // Новая схема: [C][icon]Title{slug}
  const entry = parseEntryName(folderName);
  if (entry.type === 'C') {
    return { title: entry.title, slug: entry.slug, icon: entry.icon };
  }

  // Старые схемы (обратная совместимость)
  const matchWithSlug = folderName.match(/^\[([^\]]+)\]([^{]+)\{([^}]+)\}$/);
  if (matchWithSlug) return { title: matchWithSlug[2].trim(), slug: matchWithSlug[3].trim(), icon: matchWithSlug[1].trim() };

  const matchWithIcon = folderName.match(/^\[([^\]]+)\]([^\n]+)$/);
  if (matchWithIcon) return { title: matchWithIcon[2].trim(), slug: slugify(matchWithIcon[2].trim()), icon: matchWithIcon[1].trim() };

  const matchSlugOnly = folderName.match(/^([^{]+)\{([^}]+)\}$/);
  if (matchSlugOnly) return { title: matchSlugOnly[1].trim(), slug: matchSlugOnly[2].trim(), icon: null };

  return { title: folderName, slug: slugify(folderName), icon: null };
}

const TRANSLIT_MAP = {
  а:'a',  б:'b',  в:'v',  г:'g',  д:'d',  е:'e',  ё:'yo', ж:'zh', з:'z',  и:'i',
  й:'y',  к:'k',  л:'l',  м:'m',  н:'n',  о:'o',  п:'p',  р:'r',  с:'s',  т:'t',
  у:'u',  ф:'f',  х:'kh', ц:'ts', ч:'ch', ш:'sh', щ:'shch', ъ:'', ы:'y',
  ь:'',   э:'e',  ю:'yu', я:'ya',
};

export function slugify(str) {
  return str
    .toLowerCase()
    .replaceAll(/[а-яёъь]/g, (ch) => TRANSLIT_MAP[ch] ?? ch)
    .replaceAll(/[^\w\s-]/g, '')
    .replaceAll(/\s+/g, '-')
    .replaceAll(/-+/g, '-')
    .replaceAll(/^-|-$/g, '');
}

// ─── File system ──────────────────────────────────────────────────────────────

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
  // Ищем закрывающий --- без [\s\S]*? (ReDoS).
  // Проверяем что контент начинается с ---, затем ищем следующую строку ---.
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function markedWithCodeBlocks(str, codeBlocks) {
  const restored = str.replaceAll(/___CODE_BLOCK_(\d+)___/g, (_, i) => codeBlocks[Number.parseInt(i, 10)]);
  return marked(restored);
}

// ─── Block body collector ─────────────────────────────────────────────────────

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

// ─── Inner block parser ───────────────────────────────────────────────────────

function parseInnerBlocks(bodyStr, innerTag) {
  const lines   = bodyStr.split('\n');
  const results = [];
  // (?:\s+([^\s].*?))? → (?:\s+(\S[^]*))?  — захватываем всё после пробела без backtracking
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

// ─── Card builder ─────────────────────────────────────────────────────────────

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

// ─── Block handlers ───────────────────────────────────────────────────────────

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
    html += `<div class="custom-step" data-status="${status}" data-title="${title}">${markedWithCodeBlocks(step.body.trim(), codeBlocks)}</div>`;
  }
  html += '</div>';
  output.push(html);
  return endIndex + 1;
}

function handleDiagramBlock(trimmed, lines, i, output) {
  const match = trimmed.match(/^:::diagram(?:\[([^\]]*)\])?\s*$/);
  if (!match) return null;
  const diagramParams = parseParams(match[1] ?? '');
  const color = escapeAttr(diagramParams.color ?? diagramParams.borderColor ?? '');
  const { body, endIndex } = collectBlockBody(lines, i + 1);
  const encodedCode = Buffer.from(body.trim(), 'utf8').toString('base64');
  output.push(`<div class="custom-diagram" data-color="${color}" data-code="${encodedCode}"></div>`);
  return endIndex + 1;
}

// ─── Custom block preprocessor ────────────────────────────────────────────────

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
      handleDiagramBlock(trimmed, lines, i, output);

    if (nextI == null) { output.push(lines[i]); i++; }
    else               { i = nextI; }
  }

  return output.join('\n');
}

// ─── Alert preprocessor ───────────────────────────────────────────────────────

export function preprocessAlerts(content) {
  const codeBlocks = [];

  // Заменяем code blocks без regex [\s\S]*? (ReDoS) — используем indexOf
  let withoutCode = '';
  let searchFrom  = 0;
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

  // ALERT_RE: ([\s\S]*?) заменяем — ищем ::: через indexOf построчно
  const ALERT_TYPES = new Set(['note', 'tip', 'important', 'warning', 'caution']);
  const alertLines  = withoutCode.split('\n');
  const alertOutput = [];
  let j = 0;

  while (j < alertLines.length) {
    const line        = alertLines[j];
    const alertPrefix = line.match(/^:::([a-z]+)$/);
    const alertType   = alertPrefix?.[1];

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
      j++; // пропускаем закрывающий :::
    } else {
      alertOutput.push(line);
      j++;
    }
  }

  const withAlerts = alertOutput.join('\n');

  return preprocessCustomBlocks(withAlerts, codeBlocks)
    .replaceAll(/___CODE_BLOCK_(\d+)___/g, (_match, index) => codeBlocks[Number.parseInt(index, 10)]);
}

// ─── Content helpers ──────────────────────────────────────────────────────────

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

// ─── Doc info / builder ───────────────────────────────────────────────────────

export function getDocInfo(fullPath, docsDir) {
  const relativePath = path.relative(docsDir, fullPath);
  const parts        = relativePath.split(path.sep);
  const fileName     = path.basename(fullPath, '.md');
  const dirs         = parts.slice(0, -1);

  // Парсим имя файла — может быть [A][icon]Title{slug}.md или просто name.md
  const fileEntry = parseEntryName(fileName);
  const fileSlug  = fileEntry.slug;
  const fileIcon  = fileEntry.icon;

  if (dirs.length === 0) {
    const isWelcome = fileName === 'welcome';
    return {
      slug:         isWelcome ? '' : fileSlug,
      navSlug:      '',
      navTitle:     '',
      navIcon:      '',
      typename:     '',
      categoryPath: [],
      fileIcon,
    };
  }

  // Определяем первую папку — navPopover?
  const firstEntry   = parseEntryName(dirs[0]);
  const oldNavDef    = parseNavPopoverFolder(dirs[0]);
  const isNavPopover = firstEntry.type === 'N' || oldNavDef !== null;

  if (isNavPopover) {
    const navDef = firstEntry.type === 'N'
      ? { navIcon: firstEntry.icon ?? '', navTitle: firstEntry.title, navSlug: firstEntry.slug }
      : oldNavDef;

    const subDirs      = dirs.slice(1);
    const categoryPath = subDirs.map((d) => {
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

  // Без navPopover
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

export function buildDocFromPath(mdPath, docsDir) {
  const rawContent              = fs.readFileSync(mdPath, 'utf-8');
  const { metadata, content: cleanContent } = extractFrontMatter(rawContent);
  const processed               = processImageSyntax(cleanContent);
  const htmlContent             = marked(preprocessAlerts(processed));
  const info                    = getDocInfo(mdPath, docsDir);
  const fileName                = path.basename(mdPath, '.md');
  const fileEntry               = parseEntryName(fileName);

  // title:    frontmatter > title из [A]Title в имени файла > имя файла
  const finalTitle   = metadata.title?.trim()   || fileEntry.title || fileName;
  // typename: frontmatter > последняя категория из пути
  const finalTypename = metadata.typename?.trim() || info.typename;
  // icon:     frontmatter > иконка из [A][icon]... в имени файла
  const finalIcon    = metadata.icon?.trim()    || info.fileIcon || '';

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