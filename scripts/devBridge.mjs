/**
 * Hub Dev Panel — WebSocket Bridge v4
 *
 * Astro integration plugin.
 * Запускается ТОЛЬКО через astro:server:setup хук (только в astro dev).
 * В production build этот файл не используется.
 *
 * ws://127.0.0.1:7777 — только localhost
 *
 * Reload браузера: server.environments.client.hot.send({ type: 'full-reload' })
 * Это официальный Vite 6 API — работает в Astro 6.
 */

import { WebSocketServer } from 'ws';
import fs   from 'node:fs';
import path from 'node:path';

const ROOT       = process.cwd();
const DOCS_DIR   = path.join(ROOT, 'Docs');
const OUTPUT_DIR = path.join(ROOT, 'public/data/docs');
const MANIFEST   = path.join(OUTPUT_DIR, 'manifest.json');
const SITEMAP    = path.join(ROOT, 'public/sitemap.xml');
const BASE_URL   = 'https://hub.opensophy.com';

// ─── Allowed paths ────────────────────────────────────────────────────────────

const ALLOWED_WRITE = ['Docs/', 'src/shared/data/', 'public/'];
const ALLOWED_READ  = [...ALLOWED_WRITE, 'src/shared/data/contacts.ts'];

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

// ─── Inline generation ────────────────────────────────────────────────────────
// Импортируем docUtils напрямую — без дочернего процесса.
// Cache сбрасывается перед каждой генерацией чтобы подхватить новые файлы.

let _utils = null;

async function loadUtils() {
  // Always reload to pick up any changes to docUtils itself
  const url = `${pathToFileURL(path.join(ROOT, 'scripts/docUtils.mjs'))}?bust=${Date.now()}`;
  _utils = await import(url);
  return _utils;
}

// pathToFileURL helper (node doesn't expose it directly in all envs)
function pathToFileURL(p) {
  return 'file:///' + p.replaceAll('\\', '/').replace(/^\//, '');
}

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

  // Sitemap
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

// ─── Full reload helper ───────────────────────────────────────────────────────

function sendFullReload(server) {
  try {
    // Vite 6 / Astro 6 official API
    server.environments.client.hot.send({ type: 'full-reload', path: '*' });
  } catch {
    try {
      // Fallback for older Vite versions
      server.ws?.send({ type: 'full-reload', path: '*' });
    } catch {}
  }
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

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
  return { content: await fs.promises.readFile(abs, 'utf-8') };
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

// ─── Dispatch ─────────────────────────────────────────────────────────────────

const HANDLERS = {
  ping:          handlePing,
  writeFile:     handleWriteFile,
  mkdir:         handleMkdir,
  readFile:      handleReadFile,
  deleteFile:    handleDeleteFile,
  listDocs:      handleListDocs,
  readContacts:  handleReadContacts,
  writeContacts: handleWriteContacts,
  uploadAsset:   handleUploadAsset,
  uploadFavicon: handleUploadFavicon,
  runGenerate:   handleRunGenerate,
};

// Actions that require regeneration + browser reload
const MUTATING = new Set(['writeFile', 'mkdir', 'deleteFile', 'runGenerate']);

// ─── Astro integration ────────────────────────────────────────────────────────

export function devBridgeIntegration() {
  return {
    name: 'hub-dev-bridge',
    hooks: {
      'astro:server:setup': ({ server, logger }) => {
        // ── Stop Vite from watching Docs/ and src/shared/data/ ──────────────
        // Vite's chokidar watcher triggers full-reload on any file change inside
        // these dirs. Since the dev bridge owns all writes here, we unwatch them
        // so only the panel's iframe reloads — not the whole page.
        const unwatch = () => {
          server.watcher.unwatch(path.join(ROOT, 'Docs'));
          server.watcher.unwatch(path.join(ROOT, 'Docs/**'));
          server.watcher.unwatch(path.join(ROOT, 'src/shared/data'));
          server.watcher.unwatch(path.join(ROOT, 'src/shared/data/**'));
          logger.info('[hub-dev] Vite watcher disabled for Docs/ and src/shared/data/');
        };
        // Call immediately and after a tick (Astro may re-add watchers)
        unwatch();
        setTimeout(unwatch, 500);

        // ── Intercept Vite HMR: block full-reload for Docs/ changes ────────
        // Even after unwatching, Astro's own integration may still emit reloads.
        // We intercept server.hot.send and drop any full-reload that comes from
        // our managed directories so the browser page never reloads on its own.
        const _hotSend = server.hot.send.bind(server.hot);
        server.hot.send = (payload, ...rest) => {
          if (payload?.type === 'full-reload') {
            // Block silent reloads triggered by Docs/ file writes
            logger.info('[hub-dev] Blocked automatic full-reload (managed by bridge)');
            return;
          }
          return _hotSend(payload, ...rest);
        };

        const wss = new WebSocketServer({ port: 7777, host: '127.0.0.1' });
        logger.info('[hub-dev] Bridge ready → ws://127.0.0.1:7777 | Press Ctrl+Shift+D in browser');

        wss.on('connection', (ws, req) => {
          const ip = req.socket.remoteAddress ?? '';
          if (!['::1', '127.0.0.1', '::ffff:127.0.0.1'].includes(ip)) {
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
                // Run generation silently — do NOT full-reload the page.
                // The dev panel stays open, only the iframe inside it reloads via iframeKey.
                // Full-reload only happens when action === 'runGenerate' (explicit button).
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