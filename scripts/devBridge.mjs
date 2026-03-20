/**
 * Hub Dev Panel — WebSocket Bridge v2
 *
 * Astro integration plugin.
 * Запускается ТОЛЬКО через astro:server:setup хук (только в astro dev).
 * В production build этот файл не используется.
 *
 * ws://127.0.0.1:7777 — только localhost
 */

import { WebSocketServer } from 'ws';
import fs   from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

// ─── Разрешённые пути для записи ──────────────────────────────────────────────
const ALLOWED_WRITE = [
  'Docs/',
  'src/shared/data/',
  'src/shared/styles/',
  'public/',
];

// Разрешённые пути для чтения (включает исходные файлы)
const ALLOWED_READ = [
  ...ALLOWED_WRITE,
  'src/shared/data/contacts.ts',
  'public/robots.txt',
  'src/shared/styles/global.css',
];

function relPath(abs) {
  return path.relative(ROOT, abs).replaceAll('\\', '/');
}

function canWrite(absPath) {
  const rel = relPath(absPath);
  return ALLOWED_WRITE.some(prefix => rel.startsWith(prefix));
}

function canRead(absPath) {
  const rel = relPath(absPath);
  return ALLOWED_READ.some(prefix => rel === prefix || rel.startsWith(prefix));
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
  const docsDir = path.join(ROOT, 'Docs');
  const result  = [];

  function scan(dir, depth = 0) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      if (item.name.startsWith('.') && item.name !== '.gitkeep') continue;
      if (item.name === '.gitkeep') continue;
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

  scan(docsDir);
  return { entries: result };
}

async function handleReadContacts() {
  const fp = path.join(ROOT, 'src/shared/data/contacts.ts');
  const content = await fs.promises.readFile(fp, 'utf-8');
  return { content };
}

async function handleWriteContacts({ content }) {
  const fp = path.join(ROOT, 'src/shared/data/contacts.ts');
  await fs.promises.writeFile(fp, content, 'utf-8');
  return { ok: true };
}

async function handleWriteCssVars({ vars }) {
  const fp  = path.join(ROOT, 'src/shared/styles/global.css');
  let css   = await fs.promises.readFile(fp, 'utf-8');

  const varLines = Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');

  const startMarker = '/* hub-dev-panel-vars-start */';
  const endMarker   = '/* hub-dev-panel-vars-end */';
  const block       = `${startMarker}\n:root {\n${varLines}\n}\n${endMarker}`;

  if (css.includes(startMarker)) {
    // Replace existing block
    css = css.replace(
      new RegExp(`${startMarker.replace(/\//g, '\\/')}[\\s\\S]*?${endMarker.replace(/\//g, '\\/')}`, 'g'),
      block
    );
  } else {
    // Prepend new block
    css = `${block}\n\n${css}`;
  }

  await fs.promises.writeFile(fp, css, 'utf-8');
  return { ok: true };
}

async function handleUploadAsset({ filename, base64, mimeType }) {
  const dir = path.join(ROOT, 'public/assets');
  await fs.promises.mkdir(dir, { recursive: true });
  const buf  = Buffer.from(base64, 'base64');
  const fp   = path.join(dir, filename);
  await fs.promises.writeFile(fp, buf);
  return { path: `/assets/${filename}` };
}

async function handleUploadFavicon({ base64, mimeType }) {
  // Save as favicon.png regardless (browsers handle it)
  const ext = mimeType === 'image/svg+xml' ? 'svg' : 'png';
  const fp  = path.join(ROOT, `public/favicon.${ext}`);
  const buf = Buffer.from(base64, 'base64');
  await fs.promises.writeFile(fp, buf);
  return { path: `/favicon.${ext}` };
}

async function handleRunGenerate() {
  const { spawnSync } = await import('node:child_process');
  const r = spawnSync(process.execPath, ['scripts/generate.mjs'], {
    cwd: ROOT, stdio: 'pipe', encoding: 'utf-8',
  });
  return { ok: r.status === 0, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
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
  writeCssVars:  handleWriteCssVars,
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
            catch { ws.send(JSON.stringify({ id: null, ok: false, error: 'Invalid JSON' })); return; }

            const { id, action, payload } = msg;
            const handler = HANDLERS[action];

            if (!handler) {
              ws.send(JSON.stringify({ id, ok: false, error: `Unknown action: ${action}` }));
              return;
            }

            try {
              const result = await handler(payload ?? {});
              ws.send(JSON.stringify({ id, ok: true, result }));

              // Trigger Vite HMR for written files
              if (action === 'writeFile' && result?.written) {
                const abs = path.join(ROOT, result.written);
                try { server.watcher.emit('change', abs); } catch {}
              }
            } catch (err) {
              logger.error(`[hub-dev] ${action} error: ${err.message}`);
              ws.send(JSON.stringify({ id, ok: false, error: err.message }));
            }
          });

          ws.on('close', () => logger.info('[hub-dev] Client disconnected'));
          ws.on('error', err => logger.error(`[hub-dev] WS error: ${err.message}`));
        });

        // Clean up on server close
        server.httpServer?.on('close', () => {
          wss.close();
          logger.info('[hub-dev] Bridge closed');
        });
      },
    },
  };
}