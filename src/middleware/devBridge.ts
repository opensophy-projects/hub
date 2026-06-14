import type { APIContext, MiddlewareNext } from 'astro';
import { HANDLERS, MUTATING, runGenerate } from '../../scripts/bridgeHandlers.mjs';

type BridgeController = ReadableStreamDefaultController<Uint8Array>;
const encoder = new TextEncoder();
const clients = new Set<BridgeController>();

function sendEvent(controller: BridgeController, event: string, data: unknown = {}) {
  controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
}

function broadcast(event: string, data: unknown = {}) {
  for (const controller of clients) {
    try { sendEvent(controller, event, data); } catch { clients.delete(controller); }
  }
}

function allowed(ctx: APIContext) {
  const isDev = import.meta.env.DEV;
  const hostname = new URL(ctx.request.url).hostname;
  const allowedHosts = (process.env.BRIDGE_ALLOWED_HOSTS ?? 'localhost,127.0.0.1')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
  return isDev && allowedHosts.includes(hostname);
}

export async function handleDevBridgeRequest(ctx: APIContext) {
  const url = new URL(ctx.request.url);
  const routePath = url.pathname.replace(/\/$/, '');
  if (!allowed(ctx)) return new Response('Not Found', { status: 404 });

  if (ctx.request.method === 'GET' && routePath === '/api/bridge/stream') {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        clients.add(controller);
        sendEvent(controller, 'ping');
        const timer = setInterval(() => {
          try { sendEvent(controller, 'ping'); } catch { clients.delete(controller); clearInterval(timer); }
        }, 20_000);
        ctx.request.signal.addEventListener('abort', () => {
          clearInterval(timer);
          clients.delete(controller);
          try { controller.close(); } catch { /* noop */ }
        }, { once: true });
      },
      cancel(controller) { clients.delete(controller as unknown as BridgeController); },
    });
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  }

  if (ctx.request.method === 'POST' && routePath === '/api/bridge/cmd') {
    let body: { action?: string; payload?: unknown; id?: string };
    try { body = await ctx.request.json(); } catch { return Response.json({ id: null, ok: false, error: 'Invalid JSON' }, { status: 400 }); }
    const { action, payload, id } = body;
    const handler = action ? HANDLERS[action] : null;
    if (!handler) return Response.json({ id, ok: false, error: `Unknown action: ${action}` }, { status: 400 });
    try {
      const result = await handler(payload ?? {});
      if (action && MUTATING.has(action)) {
        await runGenerate();
        broadcast('reload');
      }
      return Response.json({ id, ok: true, result });
    } catch (error) {
      return Response.json({ id, ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
  }

  return new Response('Not Found', { status: 404 });
}

export async function devBridgeMiddleware(ctx: APIContext, next: MiddlewareNext) {
  const url = new URL(ctx.request.url);
  if (!url.pathname.startsWith('/api/bridge/')) return next();
  return handleDevBridgeRequest(ctx);
}

export const onRequest = devBridgeMiddleware;

