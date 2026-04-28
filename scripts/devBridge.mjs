/**
 * Hub Dev Panel — WebSocket Bridge v4
 */

import { WebSocketServer } from 'ws';
import fs   from 'node:fs';
import path from 'node:path';

const ROOT       = process.cwd();
const DOCS_DIR   = path.join(ROOT, 'Docs');
const OUTPUT_DIR = path.join(ROOT, 'public/data/docs');
const MANIFEST   = path.join(OUTPUT_DIR, 'manifest.json');
const SITEMAP    = path.join(ROOT, 'public/sitemap.xml');
const SITE_CONFIG_PATH = path.join(ROOT, 'public/data/site-config.json');
const BASE_URL   = 'https://opensophy.com';

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

  const sorted = [...manifest].sort(
    (a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()
  );

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
  const abs = path.isAbsolute(filePath) ? filePath : path.join(ROOT, filePath);
  if (!canWrite(abs)) throw new Error(`Write not allowed: ${relPath(abs)}`);
  await fs.promises.mkdir(path.dirname(abs), { recursive: true });
  await fs.promises.writeFile(abs, content, 'utf-8');
  return { written: relPath(abs) };
}

async function handleMkdir({ dirPath }) {
  const abs = path.isAbsolute(dirPath) ? dirPath : path.join(ROOT, dirPath);
  if (!canWrite(abs)) throw new Error(`Write not allowed: ${relPath(abs)}`);
  await fs.promises.mkdir(abs, { recursive: true });
  return { created: relPath(abs) };
}

async function handleReadFile({ filePath }) {
  const abs = path.isAbsolute(filePath) ? filePath : path.join(ROOT, filePath);
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
  const abs = path.isAbsolute(filePath) ? filePath : path.join(ROOT, filePath);
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
  const ext = mimeType === 'image/svg+xml' ? 'svg' : 'png';
  await fs.promises.writeFile(path.join(ROOT, `public/favicon.${ext}`), Buffer.from(base64, 'base64'));
  return { path: `/favicon.${ext}` };
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
  try {
    if (!fs.existsSync(SITE_CONFIG_PATH)) {
      return { config: { useLanding: false, showDotWaveBackground: true } };
    }
    const raw = await fs.promises.readFile(SITE_CONFIG_PATH, 'utf-8');
    const config = JSON.parse(raw);
    if (typeof config.showDotWaveBackground !== 'boolean') {
      config.showDotWaveBackground = true;
    }
    return { config };
  } catch {
    return { config: { useLanding: false, showDotWaveBackground: true } };
  }
}

async function handleWriteSiteConfig({ config }) {
  await fs.promises.mkdir(path.dirname(SITE_CONFIG_PATH), { recursive: true });
  await fs.promises.writeFile(SITE_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
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
  readContacts:    handleReadContacts,
  writeContacts:   handleWriteContacts,
  uploadAsset:     handleUploadAsset,
  uploadFavicon:   handleUploadFavicon,
  runGenerate:     handleRunGenerate,
  renderPreview:   handleRenderPreview,
  readSiteConfig:  handleReadSiteConfig,
  writeSiteConfig: handleWriteSiteConfig,
};

const MUTATING = new Set(['writeFile', 'mkdir', 'deleteFile', 'runGenerate']);

// ─── Astro интеграция ─────────────────────────────────────────────────────────

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

        const wss = new WebSocketServer({ port: 7777, host: '127.0.0.1' });
        logger.info('[hub-dev] Bridge ready → ws://127.0.0.1:7777 | Press Ctrl+Shift+D in browser');

        wss.on('connection', (ws, req) => {
          const ip = req.socket.remoteAddress ?? '';
          if (!LOCALHOST_IPS.has(ip)) {
            logger.warn(`[hub-dev] Rejected from ${ip}`);
            ws.close(1008, 'Forbidden');
            return;
          }

          logger.info(`[hub-dev] Client connected from ${ip}`);

          ws.on('message', async raw => {
            let msg;
            try { msg = JSON.parse(raw.toString()); }
            catch {
              ws.send(JSON.stringify({ id: null, ok: false, error: 'Invalid JSON' }));
              return;
            }

            const { id, action, payload } = msg;
            const handler = HANDLERS[action];

            if (!handler) {
              ws.send(JSON.stringify({ id, ok: false, error: `Unknown action: ${action}` }));
              return;
            }

            try {
              const result = await handler(payload ?? {});
              ws.send(JSON.stringify({ id, ok: true, result }));

              if (MUTATING.has(action)) {
                suppressReload();
                try {
                  const gen = await runGenerate();
                  logger.info(`[hub-dev] Regenerated (${gen.count} docs) after ${action}`);
                  if (gen.stderr) logger.warn(`[hub-dev] Generate warnings: ${gen.stderr}`);
                } catch (err) {
                  logger.error(`[hub-dev] Generate failed: ${err.message}`);
                }
              }
            } catch (err) {
              logger.error(`[hub-dev] ${action} error: ${err.message}`);
              ws.send(JSON.stringify({ id, ok: false, error: err.message }));
            }
          });

          ws.on('close', () => logger.info('[hub-dev] Client disconnected'));
          ws.on('error', err => logger.error(`[hub-dev] WS error: ${err.message}`));
        });

        server.httpServer?.on('close', () => {
          wss.close();
          logger.info('[hub-dev] Bridge closed');
        });
      },
    },
  };
}
