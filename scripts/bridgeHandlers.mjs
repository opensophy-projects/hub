/**
 * Hub Dev Panel — WebSocket Bridge v4
 */

import fs   from 'node:fs';
import path from 'node:path';

export const ROOT       = process.cwd();
export const DOCS_DIR   = path.join(ROOT, 'Docs');
export const OUTPUT_DIR = path.join(ROOT, 'public/data/docs');
export const MANIFEST   = path.join(OUTPUT_DIR, 'manifest.json');
export const SITEMAP    = path.join(ROOT, 'public/sitemap.xml');
export const SITE_CONFIG_PATH = path.join(ROOT, 'public/data/site-config.json');
export const BASE_URL   = 'https://opensophy.com';

// IPv4-mapped IPv6-адрес для localhost (::ffff:127.0.0.1) — стандартное представление Node.js
const LOCALHOST_IPV4_MAPPED = '::ffff:127.0.0.1';

// Адреса локального хоста, которым разрешено подключение
const LOCALHOST_IPS = new Set(['::1', '127.0.0.1', LOCALHOST_IPV4_MAPPED]);

// ─── Разрешённые пути ─────────────────────────────────────────────────────────

const ALLOWED_WRITE = [
  'Docs/',
  'src/shared/data/',
  'src/app/layouts/',
  'src/app/pages/',
  'public/',
];
const ALLOWED_READ = [
  ...ALLOWED_WRITE,
  'src/shared/data/contacts.ts',
  'src/shared/data/seo.ts',
];

function relPath(abs) {
  return path.relative(ROOT, abs).replaceAll('\\', '/');
}
function canWrite(absPath) {
  const rel = relPath(absPath);
  return ALLOWED_WRITE.some(p => rel.startsWith(p));
}
function canRead(absPath) {
  const rel = relPath(absPath);
  return ALLOWED_READ.some(p => rel === p || rel.startsWith(p));
}

function imageExtFromMime(mimeType) {
  if (mimeType === 'image/svg+xml') return 'svg';
  if (mimeType === 'image/x-icon' || mimeType === 'image/vnd.microsoft.icon') return 'ico';
  if (mimeType === 'image/webp') return 'webp';
  return 'png';
}

async function readSiteConfigFile() {
  try {
    if (!fs.existsSync(SITE_CONFIG_PATH)) return {};
    return JSON.parse(await fs.promises.readFile(SITE_CONFIG_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

async function writeSiteConfigFile(config) {
  await fs.promises.mkdir(path.dirname(SITE_CONFIG_PATH), { recursive: true });
  await fs.promises.writeFile(SITE_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

function normalizeSiteConfig(config) {
  return {
    useLanding: config.useLanding === true,
    showDotWaveBackground: config.showDotWaveBackground !== false,
    favicon: typeof config.favicon === 'string' && config.favicon ? config.favicon : '/favicon.png',
    lightLogo: typeof config.lightLogo === 'string' ? config.lightLogo : '',
    darkLogo: typeof config.darkLogo === 'string' ? config.darkLogo : '',
  };
}

// ─── Загрузка утилит ──────────────────────────────────────────────────────────

let _utils = null;

async function loadUtils() {
  const url = `${pathToFileURL(path.join(ROOT, 'scripts/docUtils.mjs'))}?bust=${Date.now()}`;
  _utils = await import(url);
  return _utils;
}

function pathToFileURL(p) {
  return 'file:///' + p.replaceAll('\\', '/').replace(/^\//, '');
}

// ─── Генерация манифеста и sitemap ────────────────────────────────────────────

export async function runGenerate() {
  const { scanDocsDirectoryRecursive, buildDocFromPath } = await loadUtils();

  if (!fs.existsSync(DOCS_DIR)) return { ok: false, stdout: '', stderr: 'Docs/ not found' };
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const allFiles = scanDocsDirectoryRecursive(DOCS_DIR);
  const manifest = [];
  const errors   = [];
  const SKIP     = new Set(['content', 'keywords', 'robots']);

  for (const mdPath of allFiles) {
    try {
      const doc   = buildDocFromPath(mdPath, DOCS_DIR);
      const entry = Object.fromEntries(Object.entries(doc).filter(([k]) => !SKIP.has(k)));
      manifest.push(entry);
    } catch (err) {
      errors.push(`${relPath(mdPath)}: ${err.message}`);
    }
  }

  const sorted = [...manifest].sort((a, b) => {
  const pa = a.priority ?? 999;
  const pb = b.priority ?? 999;

  if (pa !== pb) {
    return pa - pb;
  }

  return new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime();
});

  fs.writeFileSync(MANIFEST, JSON.stringify(sorted));

  const today = new Date().toISOString().split('T')[0];
  const urls = sorted
    .filter(d => d.slug && d.slug !== 'welcome')
    .map(d => `  <url><loc>${BASE_URL}/${d.slug}</loc><lastmod>${d.updated || d.date || today}</lastmod><changefreq>monthly</changefreq><priority>0.9</priority></url>`)
    .join('\n');

  fs.writeFileSync(SITEMAP,
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `  <url><loc>${BASE_URL}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>\n` +
    urls + `\n</urlset>\n`
  );

  return {
    ok:     errors.length === 0,
    count:  manifest.length,
    stdout: `Generated ${manifest.length} docs`,
    stderr: errors.join('\n'),
  };
}

// ─── Отправка полной перезагрузки клиенту ────────────────────────────────────

function sendFullReload(server) {
  try {
    server.environments.client.hot.send({ type: 'full-reload', path: '*' });
  } catch {
    try { server.ws?.send({ type: 'full-reload', path: '*' }); } catch {}
  }
}

// ─── Обработчики команд ───────────────────────────────────────────────────────

async function handlePing() {
  return { pong: true, ts: Date.now() };
}

async function handleWriteFile({ filePath, content }) {
  const abs = assertSafe(filePath);
  if (!canWrite(abs)) throw new Error(`Write not allowed: ${relPath(abs)}`);
  await fs.promises.mkdir(path.dirname(abs), { recursive: true });
  await fs.promises.writeFile(abs, content, 'utf-8');
  return { written: relPath(abs) };
}

async function handleMkdir({ dirPath }) {
  const abs = assertSafe(dirPath);
  if (!canWrite(abs)) throw new Error(`Write not allowed: ${relPath(abs)}`);
  await fs.promises.mkdir(abs, { recursive: true });
  return { created: relPath(abs) };
}

async function handleReadFile({ filePath }) {
  const abs = assertSafe(filePath);
  if (!canRead(abs)) throw new Error(`Read not allowed: ${relPath(abs)}`);
  // Если файл не существует — возвращаем пустую строку вместо ошибки
  try {
    return { content: await fs.promises.readFile(abs, 'utf-8') };
  } catch (err) {
    if (err.code === 'ENOENT') return { content: '' };
    throw err;
  }
}

async function handleDeleteFile({ filePath }) {
  const abs = assertSafe(filePath);
  if (!canWrite(abs)) throw new Error(`Delete not allowed: ${relPath(abs)}`);
  await fs.promises.rm(abs, { recursive: true, force: true });
  return { deleted: relPath(abs) };
}

async function handleListDocs() {
  const result = [];
  function scan(dir, depth = 0) {
    if (!fs.existsSync(dir)) return;
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      if (item.name.startsWith('.')) continue;
      const full = path.join(dir, item.name);
      const rel  = relPath(full);
      if (item.isDirectory()) {
        result.push({ type: 'dir', path: rel, name: item.name, depth });
        scan(full, depth + 1);
      } else if (item.name.endsWith('.md')) {
        result.push({ type: 'file', path: rel, name: item.name, depth });
      }
    }
  }
  scan(DOCS_DIR);
  return { entries: result };
}

async function handleReadContacts() {
  return { content: await fs.promises.readFile(path.join(ROOT, 'src/shared/data/contacts.ts'), 'utf-8') };
}

async function handleWriteContacts({ content }) {
  await fs.promises.writeFile(path.join(ROOT, 'src/shared/data/contacts.ts'), content, 'utf-8');
  return { ok: true };
}

async function handleUploadAsset({ filename, base64 }) {
  const dir = path.join(ROOT, 'public/assets');
  await fs.promises.mkdir(dir, { recursive: true });
  await fs.promises.writeFile(path.join(dir, filename), Buffer.from(base64, 'base64'));
  return { path: `/assets/${filename}` };
}

async function handleUploadFavicon({ base64, mimeType }) {
  const ext = imageExtFromMime(mimeType);
  const rel = `/favicon.${ext}`;
  await fs.promises.writeFile(path.join(ROOT, `public/favicon.${ext}`), Buffer.from(base64, 'base64'));
  const config = normalizeSiteConfig(await readSiteConfigFile());
  await writeSiteConfigFile({ ...config, favicon: rel });
  return { path: rel };
}

async function handleUploadLogo({ variant, base64, mimeType }) {
  if (!['light', 'dark'].includes(variant)) throw new Error('Unknown logo variant');
  const ext = imageExtFromMime(mimeType);
  const basename = variant === 'light' ? 'light_logo' : 'dark_logo';
  const rel = `/${basename}.${ext}`;

  await Promise.all(['png', 'svg', 'ico', 'webp'].map(oldExt =>
    fs.promises.rm(path.join(ROOT, `public/${basename}.${oldExt}`), { force: true })
  ));
  await fs.promises.writeFile(path.join(ROOT, `public/${basename}.${ext}`), Buffer.from(base64, 'base64'));

  const config = normalizeSiteConfig(await readSiteConfigFile());
  await writeSiteConfigFile({
    ...config,
    [variant === 'light' ? 'lightLogo' : 'darkLogo']: rel,
  });
  return { path: rel };
}

async function handleRunGenerate() {
  return runGenerate();
}

async function handleRenderPreview({ markdown }) {
  try {
    const utils = await loadUtils();
    if (typeof utils.renderMarkdownToHtml === 'function') {
      return { html: utils.renderMarkdownToHtml(markdown) };
    }
    if (typeof utils.buildDocFromPath === 'function') {
      const tmp = path.join(DOCS_DIR, '.preview-tmp.md');
      await fs.promises.mkdir(DOCS_DIR, { recursive: true });
      await fs.promises.writeFile(tmp, markdown, 'utf-8');
      try {
        const doc = utils.buildDocFromPath(tmp, DOCS_DIR);
        await fs.promises.unlink(tmp).catch(() => {});
        return { html: doc.content ?? doc.html ?? doc.body ?? '' };
      } catch (e) {
        await fs.promises.unlink(tmp).catch(() => {});
        return { html: '', error: `buildDocFromPath failed: ${e.message}` };
      }
    }
    return { html: '', error: 'No render function found in docUtils.' };
  } catch (err) {
    return { html: '', error: err.message };
  }
}

// ─── Обработчики site-config ──────────────────────────────────────────────────

async function handleReadSiteConfig() {
  return { config: normalizeSiteConfig(await readSiteConfigFile()) };
}

async function handleWriteSiteConfig({ config }) {
  await writeSiteConfigFile(normalizeSiteConfig(config));
  return { ok: true };
}

// ─── Таблица маршрутизации команд ─────────────────────────────────────────────

export const HANDLERS = {
  ping:            handlePing,
  writeFile:       handleWriteFile,
  mkdir:           handleMkdir,
  readFile:        handleReadFile,
  deleteFile:      handleDeleteFile,
  listDocs:        handleListDocs,
  readContacts:    handleReadContacts,
  writeContacts:   handleWriteContacts,
  uploadAsset:     handleUploadAsset,
  uploadFavicon:   handleUploadFavicon,
  uploadLogo:      handleUploadLogo,
  runGenerate:     handleRunGenerate,
  renderPreview:   handleRenderPreview,
  readSiteConfig:  handleReadSiteConfig,
  writeSiteConfig: handleWriteSiteConfig,
};



export const MUTATING = new Set(['writeFile', 'mkdir', 'deleteFile', 'moveEntry', 'renameEntry']);

function assertSafe(filePath, base = ROOT) {
  const resolved = path.resolve(path.isAbsolute(filePath) ? filePath : path.join(ROOT, filePath));
  const root = path.resolve(base);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) throw new Error('Path traversal detected');
  return resolved;
}

function readFrontmatterMeta(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    if (!raw.startsWith('---\n')) return {};
    const end = raw.indexOf('\n---\n', 4);
    if (end === -1) return {};
    const meta = {};
    for (const line of raw.slice(4, end).split('\n')) {
      const i = line.indexOf(':');
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
    }
    return meta;
  } catch { return {}; }
}

function parseEntryName(name) {
  const base = name.replace(/\.md$/, '');
  const tm = /^\[([NCA])\]/.exec(base);
  const type = tm?.[1] ?? null;
  const rest = tm ? base.slice(tm[0].length) : base;
  const im = /^\[([^\]]{1,60})\]/.exec(rest);
  const icon = im?.[1] ?? null;
  const titlePart = im ? rest.slice(im[0].length) : rest;
  const sm = /^([^{}]{1,300})\{([^{}]{1,200})\}$/.exec(titlePart);
  return { type, icon, title: (sm ? sm[1] : titlePart).trim(), slug: sm?.[2]?.trim() ?? null };
}

async function handleListCustomPages() {
  const dir = path.join(ROOT, 'src/custom');
  const pages = [];
  async function scan(d) {
    if (!fs.existsSync(d)) return;
    for (const ent of await fs.promises.readdir(d, { withFileTypes: true })) {
      if (ent.name.startsWith('.')) continue;
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) await scan(full);
      else if (/\.(astro|tsx|jsx|mdx?)$/.test(ent.name)) {
        pages.push({ slug: relPath(full).replace(/^src\/custom\//, '').replace(/\.[^.]+$/, '').replace(/\/index$/, ''), folderName: path.basename(path.dirname(full)) });
      }
    }
  }
  await scan(dir);
  return { pages };
}

async function handleReadNavStructure() {
  function scan(dir, depth = 0) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true }).filter(e => !e.name.startsWith('.')).map(ent => {
      const full = path.join(dir, ent.name);
      const node = { type: ent.isDirectory() ? 'dir' : 'file', path: relPath(full), name: ent.name, depth, parsed: parseEntryName(ent.name), meta: ent.isFile() ? readFrontmatterMeta(full) : {}, children: [] };
      if (ent.isDirectory()) node.children = scan(full, depth + 1);
      return node;
    }).filter(n => n.type === 'dir' || n.name.endsWith('.md'));
  }
  return { tree: scan(DOCS_DIR) };
}

async function handleMoveEntry({ srcPath, dstPath }) {
  const src = assertSafe(srcPath, DOCS_DIR);
  const dstBase = assertSafe(dstPath, DOCS_DIR);
  const dst = fs.existsSync(dstBase) && fs.statSync(dstBase).isDirectory() ? path.join(dstBase, path.basename(src)) : dstBase;
  assertSafe(dst, DOCS_DIR);
  await fs.promises.mkdir(path.dirname(dst), { recursive: true });
  await fs.promises.rename(src, dst);
  return { ok: true, path: relPath(dst) };
}

async function handleRenameEntry({ oldPath, newName }) {
  if (newName.includes('/') || newName.includes('\\') || newName.includes('..')) throw new Error('Invalid name');
  const oldAbs = assertSafe(oldPath, DOCS_DIR);
  const nextAbs = assertSafe(path.join(path.dirname(oldAbs), newName), DOCS_DIR);
  await fs.promises.rename(oldAbs, nextAbs);
  return { ok: true, path: relPath(nextAbs) };
}

HANDLERS.listCustomPages = handleListCustomPages;
HANDLERS.readNavStructure = handleReadNavStructure;
HANDLERS.moveEntry = handleMoveEntry;
HANDLERS.renameEntry = handleRenameEntry;

