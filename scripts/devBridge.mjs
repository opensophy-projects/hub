/**
 * Hub Dev Panel — fetch-only Bridge
 */

import fs   from 'node:fs';
import path from 'node:path';

const ROOT       = process.cwd();
const DOCS_DIR   = path.join(ROOT, 'Docs');
const OUTPUT_DIR = path.join(ROOT, 'public/data/docs');
const MANIFEST   = path.join(OUTPUT_DIR, 'manifest.json');
const SITEMAP    = path.join(ROOT, 'public/sitemap.xml');
const SITE_CONFIG_PATH = path.join(ROOT, 'public/data/site-config.json');
const CUSTOM_DIR = path.join(ROOT, 'src/custom');
const DEFAULT_SEO = {
  name: 'HUB',
  description: 'HUB — платформа для документации, баз знаний, гайдов, changelog-порталов и продуктовых лендингов на Markdown.',
  url: 'http://localhost:4321',
  lang: 'ru',
  author: 'HUB',
  keywords: 'hub, documentation, markdown, база знаний, документация, гайды, changelog, SEO, GEO',
  ogImage: '/og-image.png',
  ogLocale: 'ru_RU',
  twitterCard: 'summary_large_image',
  twitterSite: '',
  themeColor: '#0a0a0a',
  publisherSameAs: [],
};
const BASE_URL   = process.env.PUBLIC_SITE_URL || DEFAULT_SEO.url;

const LOCALHOST_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

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
function resolveInsideRoot(inputPath) {
  const abs = path.resolve(ROOT, inputPath || '.');
  const rel = relPath(abs);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error('Path escapes project root');
  }
  return abs;
}
function canWrite(absPath) {
  const rel = relPath(absPath);
  return ALLOWED_WRITE.some(p => rel === p.slice(0, -1) || rel.startsWith(p));
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
    seo: {
      ...DEFAULT_SEO,
      ...(config.seo && typeof config.seo === 'object' ? config.seo : {}),
      publisherSameAs: Array.isArray(config.seo?.publisherSameAs) ? config.seo.publisherSameAs : DEFAULT_SEO.publisherSameAs,
    },
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

async function runGenerate() {
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

// ─── Обработчики команд ───────────────────────────────────────────────────────

async function handlePing() {
  return { pong: true, ts: Date.now() };
}

async function handleWriteFile({ filePath, content }) {
  const abs = resolveInsideRoot(filePath);
  if (!canWrite(abs)) throw new Error(`Write not allowed: ${relPath(abs)}`);
  await fs.promises.mkdir(path.dirname(abs), { recursive: true });
  await fs.promises.writeFile(abs, content, 'utf-8');
  return { written: relPath(abs) };
}

async function handleMkdir({ dirPath }) {
  const abs = resolveInsideRoot(dirPath);
  if (!canWrite(abs)) throw new Error(`Write not allowed: ${relPath(abs)}`);
  await fs.promises.mkdir(abs, { recursive: true });
  return { created: relPath(abs) };
}

async function handleReadFile({ filePath }) {
  const abs = resolveInsideRoot(filePath);
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
  const abs = resolveInsideRoot(filePath);
  if (!canWrite(abs)) throw new Error(`Delete not allowed: ${relPath(abs)}`);
  await fs.promises.rm(abs, { recursive: true, force: true });
  return { deleted: relPath(abs) };
}

function readMarkdownTitle(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    if (!raw.startsWith('---\n')) return '';
    const end = raw.indexOf('\n---\n', 4);
    if (end === -1) return '';
    const line = raw.slice(4, end).split('\n').find((item) => item.trim().startsWith('title:'));
    if (!line) return '';
    return line.slice(line.indexOf(':') + 1).trim().replace(/^['"]|['"]$/g, '');
  } catch {
    return '';
  }
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
        result.push({ type: 'file', path: rel, name: item.name, depth, title: readMarkdownTitle(full) });
      }
    }
  }
  scan(DOCS_DIR);
  return { entries: result };
}

async function handleListCustomPages() {
  const { scanCustomPages } = await import(`${pathToFileURL(path.join(ROOT, 'scripts/customUtils.mjs'))}?bust=${Date.now()}`);
  return { pages: scanCustomPages(CUSTOM_DIR) };
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

const HANDLERS = {
  ping:            handlePing,
  writeFile:       handleWriteFile,
  mkdir:           handleMkdir,
  readFile:        handleReadFile,
  deleteFile:      handleDeleteFile,
  listDocs:        handleListDocs,
  listCustomPages: handleListCustomPages,
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

const MUTATING = new Set(['writeFile', 'mkdir', 'deleteFile', 'runGenerate']);

// ─── Astro интеграция ─────────────────────────────────────────────────────────

function isLocalDevRequest(req) {
  const host = (req.headers.host || '').split(':')[0];
  return LOCALHOST_HOSTS.has(host);
}

export function devBridgeIntegration() {
  return {
    name: 'hub-dev-bridge',
    hooks: {
      'astro:server:setup': ({ server, logger }) => {
        let suppressReloadUntil = 0;

        try {
          const unwatch = () => {
            try { server.watcher.unwatch(path.join(ROOT, 'Docs')); } catch {}
            try { server.watcher.unwatch(path.join(ROOT, 'src/shared/data')); } catch {}
          };
          unwatch();
          setTimeout(unwatch, 300);
          setTimeout(unwatch, 1000);
        } catch (e) {
          logger.warn('[hub-dev] Could not unwatch dirs: ' + e.message);
        }

        try {
          const hotObj = server.hot ?? server.ws;
          if (hotObj && typeof hotObj.send === 'function') {
            const _origSend = hotObj.send.bind(hotObj);
            hotObj.send = (payload, ...rest) => {
              if (payload?.type === 'full-reload' && Date.now() < suppressReloadUntil) {
                logger.info('[hub-dev] Suppressed full-reload (bridge write in progress)');
                return;
              }
              return _origSend(payload, ...rest);
            };
          }
        } catch (e) {
          logger.warn('[hub-dev] Could not intercept hot.send: ' + e.message);
        }

        const suppressReload = () => { suppressReloadUntil = Date.now() + 2000; };

        server.middlewares.use('/api/dev-bridge', async (req, res) => {
          if (!isLocalDevRequest(req)) {
            res.statusCode = 404;
            res.end('Not found');
            return;
          }

          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Allow', 'POST');
            res.end('Method not allowed');
            return;
          }

          try {
            let raw = '';
            for await (const chunk of req) raw += chunk;
            const msg = raw ? JSON.parse(raw) : {};
            const { id, action, payload } = msg;
            const handler = HANDLERS[action];

            if (!handler) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ id, ok: false, error: `Unknown action: ${action}` }));
              return;
            }

            const result = await handler(payload ?? {});
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ id, ok: true, result }));

            if (MUTATING.has(action)) {
              suppressReload();
              runGenerate()
                .then(gen => {
                  logger.info(`[hub-dev] Regenerated (${gen.count} docs) after ${action}`);
                  if (gen.stderr) logger.warn(`[hub-dev] Generate warnings: ${gen.stderr}`);
                })
                .catch(err => logger.error(`[hub-dev] Generate failed: ${err.message}`));
            }
          } catch (err) {
            logger.error('[hub-dev] request error: ' + err.message);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ ok: false, error: err.message }));
          }
        });

        logger.info('[hub-dev] Bridge ready → /api/dev-bridge');
      },
    },
  };
}
