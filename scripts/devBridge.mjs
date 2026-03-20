/**
 * Hub Dev Panel — WebSocket Bridge v3
 *
 * Astro integration plugin.
 * Запускается ТОЛЬКО через astro:server:setup хук (только в astro dev).
 * В production build этот файл не используется.
 *
 * ws://127.0.0.1:7777 — только localhost
 *
 * Генерация встроена напрямую (без дочернего процесса) и сразу
 * триггерит Vite HMR через server.watcher — страницы обновляются
 * мгновенно без npm run dev / npm run generate.
 */

import { WebSocketServer } from 'ws';
import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT        = process.cwd();
const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR    = path.join(ROOT, 'Docs');
const OUTPUT_DIR  = path.join(ROOT, 'public/data/docs');
const MANIFEST    = path.join(OUTPUT_DIR, 'manifest.json');
const SITEMAP     = path.join(ROOT, 'public/sitemap.xml');
const BASE_URL    = 'https://hub.opensophy.com';

// ─── Разрешённые пути ──────────────────────────────────────────────────────────

const ALLOWED_WRITE = ['Docs/', 'src/shared/data/', 'public/'];
const ALLOWED_READ  = [...ALLOWED_WRITE, 'src/shared/data/contacts.ts', 'public/robots.txt'];

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

// ─── Inline generation (no child process) ─────────────────────────────────────
// Импортируем утилиты напрямую из docUtils.mjs

let _docUtils = null;
async function getDocUtils() {
  if (!_docUtils) {
    _docUtils = await import(path.join(ROOT, 'scripts/docUtils.mjs'));
  }
  return _docUtils;
}

async function runGenerate() {
  const { scanDocsDirectoryRecursive, buildDocFromPath, extractFrontMatter } = await getDocUtils();

  if (!fs.existsSync(DOCS_DIR)) throw new Error('Docs/ directory not found');
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const allMdFiles = scanDocsDirectoryRecursive(DOCS_DIR);
  const manifest   = [];
  const errors     = [];
  const EXCLUDED   = new Set(['content', 'keywords', 'robots']);

  for (const mdPath of allMdFiles) {
    try {
      const doc   = buildDocFromPath(mdPath, DOCS_DIR);
      const entry = Object.fromEntries(Object.entries(doc).filter(([k]) => !EXCLUDED.has(k)));
      manifest.push(entry);
    } catch (err) {
      errors.push({ file: relPath(mdPath), error: err.message });
    }
  }

  const sorted = manifest.toSorted((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  fs.writeFileSync(MANIFEST, JSON.stringify(sorted));

  // Generate sitemap
  const today = new Date().toISOString().split('T')[0];
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${BASE_URL}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>\n`;

  for (const doc of sorted) {
    if (!doc.slug || doc.slug === 'welcome') continue;
    const lastmod = doc.updated || doc.date || today;
    sitemap += `  <url><loc>${BASE_URL}/${doc.slug}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.9</priority></url>\n`;
  }
  sitemap += `</urlset>\n`;
  fs.writeFileSync(SITEMAP, sitemap);

  return {
    ok:      errors.length === 0,
    count:   manifest.length,
    errors,
    stdout:  `Generated ${manifest.length} docs`,
    stderr:  errors.map(e => `${e.file}: ${e.error}`).join('\n'),
  };
}

// ─── Handlers ──────────────────────────────────────────────────────────────────

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

async function handleReadFile({ filePath }) {
  const abs = path.isAbsolute(filePath) ? filePath : path.join(ROOT, filePath);
  if (!canRead(abs)) throw new Error(`Read not allowed: ${relPath(abs)}`);
  const content = await fs.promises.readFile(abs, 'utf-8');
  return { content };
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
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      // Skip hidden files and .gitkeep
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
  const fp      = path.join(ROOT, 'src/shared/data/contacts.ts');
  const content = await fs.promises.readFile(fp, 'utf-8');
  return { content };
}

async function handleWriteContacts({ content }) {
  const fp = path.join(ROOT, 'src/shared/data/contacts.ts');
  await fs.promises.writeFile(fp, content, 'utf-8');
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
  await fs.promises.writeFile(
    path.join(ROOT, `public/favicon.${ext}`),
    Buffer.from(base64, 'base64')
  );
  return { path: `/favicon.${ext}` };
}

async function handleRunGenerate() {
  return runGenerate();
}

// ─── Dispatch table ────────────────────────────────────────────────────────────

const HANDLERS = {
  ping:          handlePing,
  writeFile:     handleWriteFile,
  readFile:      handleReadFile,
  deleteFile:    handleDeleteFile,
  listDocs:      handleListDocs,
  readContacts:  handleReadContacts,
  writeContacts: handleWriteContacts,
  uploadAsset:   handleUploadAsset,
  uploadFavicon: handleUploadFavicon,
  runGenerate:   handleRunGenerate,
};

// ─── Astro integration ────────────────────────────────────────────────────────

export function devBridgeIntegration() {
  return {
    name: 'hub-dev-bridge',
    hooks: {
      'astro:server:setup': ({ server, logger }) => {
        const wss = new WebSocketServer({ port: 7777, host: '127.0.0.1' });
        logger.info('[hub-dev] Bridge ready → ws://127.0.0.1:7777 | Press Ctrl+Shift+D in browser');

        // Watch Docs/ directory so Vite knows about new/changed/deleted files
        // and triggers full page reload automatically
        server.watcher.add(DOCS_DIR);
        server.watcher.add(MANIFEST);

        wss.on('connection', (ws, req) => {
          const ip = req.socket.remoteAddress ?? '';
          const ALLOWED_IPS = new Set(['::1', '127.0.0.1', '::ffff:127.0.0.1']);

          if (!ALLOWED_IPS.has(ip)) {
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

              // After any write/delete/generate — trigger HMR on manifest
              // so the browser reloads the page with fresh data
              const needsReload = ['writeFile', 'deleteFile', 'runGenerate'].includes(action);
              if (needsReload) {
                // Small delay to let filesystem settle
                setTimeout(() => {
                  try {
                    // Touch the manifest file to force Vite to reload it
                    server.watcher.emit('change', MANIFEST);
                    // Also emit change on any written doc file
                    if (action === 'writeFile' && result?.written) {
                      server.watcher.emit('change', path.join(ROOT, result.written));
                    }
                    if (action === 'deleteFile' && result?.deleted) {
                      server.watcher.emit('unlink', path.join(ROOT, result.deleted));
                    }
                  } catch {}
                }, 150);
              }
            } catch (err) {
              logger.error(`[hub-dev] ${action} error: ${err.message}`);
              ws.send(JSON.stringify({ id, ok: false, error: err.message }));
            }
          });

          ws.on('close', () => logger.info('[hub-dev] Client disconnected'));
          ws.on('error', err => logger.error(`[hub-dev] WS error: ${err.message}`));
        });

        // Watch Docs/ for changes made outside the panel (e.g. editor)
        // and auto-regenerate
        server.watcher.on('change', async (changedPath) => {
          if (changedPath.startsWith(DOCS_DIR) && changedPath.endsWith('.md')) {
            try {
              await runGenerate();
              server.watcher.emit('change', MANIFEST);
            } catch {}
          }
        });

        server.httpServer?.on('close', () => {
          wss.close();
          logger.info('[hub-dev] Bridge closed');
        });
      },
    },
  };
}