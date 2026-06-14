import { useEffect, useState } from 'react';

export type BridgeStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface BridgeResponse<T> { id?: string; ok?: boolean; result?: T; error?: string; }
const BASE = '/api/bridge';

class RequestQueue {
  private queue: Array<() => Promise<void>> = [];
  private running = false;

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try { resolve(await fn()); } catch (e) { reject(e); }
      });
      void this.drain();
    });
  }

  private async drain() {
    if (this.running) return;
    this.running = true;
    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (job) await job();
    }
    this.running = false;
  }
}

const queue = new RequestQueue();
const listeners = new Set<(s: BridgeStatus) => void>();
let currentStatus: BridgeStatus = 'disconnected';
let es: EventSource | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let attempts = 0;

function broadcast(s: BridgeStatus) {
  const prev = currentStatus;
  currentStatus = s;
  listeners.forEach(fn => fn(s));
  globalThis.dispatchEvent?.(new CustomEvent('hub:bridge-status', { detail: { status: s, previous: prev } }));
}

export function reconnectBridge() {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  es?.close(); es = null; attempts = 0;
  connectSSE();
}

function connectSSE() {
  if (es || typeof EventSource === 'undefined') return;
  broadcast('connecting');
  es = new EventSource(`${BASE}/stream/`);
  es.onopen = () => { attempts = 0; broadcast('connected'); };
  es.onerror = () => {
    es?.close(); es = null;
    broadcast('disconnected');
    const delay = Math.min(1000 * 2 ** attempts, 30_000); attempts += 1;
    reconnectTimer = setTimeout(connectSSE, delay);
  };
  es.addEventListener('ping', () => undefined);
  es.addEventListener('reload', () => globalThis.dispatchEvent?.(new CustomEvent('hub:bridge-reload')));
}

async function send<T>(action: string, payload?: unknown): Promise<T> {
  return queue.add(async () => {
    try {
      const res = await fetch(`${BASE}/cmd/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload, id: crypto.randomUUID() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as BridgeResponse<T>;
      if (!data.ok) throw new Error(data.error ?? 'Bridge error');
      return data.result as T;
    } catch (e) {
      broadcast('error');
      throw e;
    }
  });
}

export function useDevBridge() {
  const [status, setStatus] = useState<BridgeStatus>(currentStatus);
  useEffect(() => {
    listeners.add(setStatus);
    setStatus(currentStatus);
    connectSSE();
    return () => { listeners.delete(setStatus); };
  }, []);
  return { status, isConnected: status === 'connected' };
}

export interface SiteConfig {
  useLanding: boolean;
  showDotWaveBackground?: boolean;
  favicon?: string;
  lightLogo?: string;
  darkLogo?: string;
}

export const bridge = {
  writeFile: (filePath: string, content: string) => send<{ written: string }>('writeFile', { filePath, content }),
  mkdir: (dirPath: string) => send<{ created: string }>('mkdir', { dirPath }),
  readFile: (filePath: string) => send<{ content: string }>('readFile', { filePath }),
  deleteFile: (filePath: string) => send<{ deleted: string }>('deleteFile', { filePath }),
  listDocs: () => send<{ entries: Array<{ type: 'file'|'dir'; path: string; name: string; depth: number }> }>('listDocs'),
  readContacts: () => send<{ content: string }>('readContacts'),
  writeContacts: (content: string) => send<{ ok: boolean }>('writeContacts', { content }),
  uploadAsset: (filename: string, base64: string, mimeType: string) => send<{ path: string }>('uploadAsset', { filename, base64, mimeType }),
  uploadFavicon: (base64: string, mimeType: string) => send<{ path: string }>('uploadFavicon', { base64, mimeType }),
  uploadLogo: (variant: 'light' | 'dark', base64: string, mimeType: string) => send<{ path: string }>('uploadLogo', { variant, base64, mimeType }),
  runGenerate: () => send<{ ok: boolean; stdout: string; stderr: string }>('runGenerate'),
  renderPreview: (markdown: string) => send<{ html: string; error?: string }>('renderPreview', { markdown }),
  readSiteConfig: () => send<{ config: SiteConfig }>('readSiteConfig'),
  writeSiteConfig: (config: SiteConfig) => send<{ ok: boolean }>('writeSiteConfig', { config }),
  listCustomPages: () => send<{ pages: Array<{ slug: string; folderName: string }> }>('listCustomPages'),
  readNavStructure: () => send<{ tree: unknown[] }>('readNavStructure'),
  moveEntry: (srcPath: string, dstPath: string) => send<{ ok: boolean; path?: string }>('moveEntry', { srcPath, dstPath }),
  renameEntry: (oldPath: string, newName: string) => send<{ ok: boolean; path?: string }>('renameEntry', { oldPath, newName }),
};
