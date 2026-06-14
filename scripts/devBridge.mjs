/**
 * Hub Dev Panel — temporary WebSocket compatibility bridge.
 */

import { WebSocketServer } from 'ws';
import { HANDLERS, MUTATING, runGenerate, ROOT } from './bridgeHandlers.mjs';
import path from 'node:path';

const LOCALHOST_IPV4_MAPPED = '::ffff:127.0.0.1';
const LOCALHOST_IPS = new Set(['::1', '127.0.0.1', LOCALHOST_IPV4_MAPPED]);

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
          unwatch(); setTimeout(unwatch, 300); setTimeout(unwatch, 1000);
        } catch (e) { logger.warn('[hub-dev] Could not unwatch dirs: ' + e.message); }

        try {
          const hotObj = server.hot ?? server.ws;
          if (hotObj && typeof hotObj.send === 'function') {
            const orig = hotObj.send.bind(hotObj);
            hotObj.send = (payload, ...rest) => {
              if (payload?.type === 'full-reload' && Date.now() < suppressReloadUntil) return;
              return orig(payload, ...rest);
            };
          }
        } catch {}
        const suppressReload = () => { suppressReloadUntil = Date.now() + 2000; };


        const sseClients = new Set();
        const allowedHosts = () => (process.env.BRIDGE_ALLOWED_HOSTS ?? 'localhost,127.0.0.1').split(',').map(x => x.trim()).filter(Boolean);
        const writeSse = (res, event, data = {}) => res.write(`event: ${event}
data: ${JSON.stringify(data)}

`);
        server.middlewares.use('/api/bridge', async (req, res, next) => {
          const host = (req.headers.host ?? '').split(':')[0];
          if (!allowedHosts().includes(host)) { res.statusCode = 404; res.end('Not Found'); return; }
          if (req.method === 'GET' && req.url?.startsWith('/stream')) {
            res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
            sseClients.add(res); writeSse(res, 'ping');
            const timer = setInterval(() => writeSse(res, 'ping'), 20_000);
            req.on('close', () => { clearInterval(timer); sseClients.delete(res); });
            return;
          }
          if (req.method === 'POST' && req.url?.startsWith('/cmd')) {
            let raw = '';
            for await (const chunk of req) raw += chunk;
            let msg; try { msg = JSON.parse(raw || '{}'); } catch { res.statusCode = 400; res.end(JSON.stringify({ id: null, ok: false, error: 'Invalid JSON' })); return; }
            const { id, action, payload } = msg;
            const handler = HANDLERS[action];
            res.setHeader('Content-Type', 'application/json');
            if (!handler) { res.statusCode = 400; res.end(JSON.stringify({ id, ok: false, error: `Unknown action: ${action}` })); return; }
            try {
              const result = await handler(payload ?? {});
              if (MUTATING.has(action)) { suppressReload(); await runGenerate(); for (const client of sseClients) writeSse(client, 'reload'); }
              res.end(JSON.stringify({ id, ok: true, result }));
            } catch (err) { res.statusCode = 500; res.end(JSON.stringify({ id, ok: false, error: err.message })); }
            return;
          }
          next();
        });

        const wss = new WebSocketServer({ port: 7777, host: '127.0.0.1' });
        logger.info('[hub-dev] Bridge fallback ready → ws://127.0.0.1:7777');
        wss.on('connection', (ws, req) => {
          const ip = req.socket.remoteAddress ?? '';
          if (!LOCALHOST_IPS.has(ip)) { ws.close(1008, 'Forbidden'); return; }
          ws.on('message', async raw => {
            let msg; try { msg = JSON.parse(raw.toString()); } catch { ws.send(JSON.stringify({ id: null, ok: false, error: 'Invalid JSON' })); return; }
            const { id, action, payload } = msg;
            const handler = HANDLERS[action];
            if (!handler) { ws.send(JSON.stringify({ id, ok: false, error: `Unknown action: ${action}` })); return; }
            try {
              const result = await handler(payload ?? {});
              ws.send(JSON.stringify({ id, ok: true, result }));
              if (MUTATING.has(action)) { suppressReload(); await runGenerate(); }
            } catch (err) { ws.send(JSON.stringify({ id, ok: false, error: err.message })); }
          });
        });
        server.httpServer?.on('close', () => wss.close());
      },
    },
  };
}
