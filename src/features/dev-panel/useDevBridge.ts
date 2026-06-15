/**
 * useDevBridge — fetch-only bridge.
 * No WebSocket, no heartbeat and no connection overlay: every command is a
 * short local POST request to the Astro dev server on the same port.
 */
import { useMemo } from 'react';

export type BridgeStatus = 'ready';

interface BridgeResponse<T = unknown> {
  id?: string;
  ok?: boolean;
  result?: T;
  error?: string;
}

const ENDPOINT = '/api/dev-bridge/';

class RequestQueue {
  private queue: Array<() => Promise<void>> = [];
  private running = false;

  add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try { resolve(await fn()); }
        catch (e) { reject(e); }
      });
      void this.drain();
    });
  }

  private async drain() {
    if (this.running) return;
    this.running = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) await task();
    }
    this.running = false;
  }
}

const queue = new RequestQueue();

async function send<T = unknown>(action: string, payload?: unknown): Promise<T> {
  return queue.add(async () => {
    const id = crypto.randomUUID();
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, payload }),
    });

    let data: BridgeResponse<T>;
    try { data = await res.json() as BridgeResponse<T>; }
    catch { throw new Error(`Bridge HTTP ${res.status}`); }

    if (!res.ok || !data.ok) throw new Error(data.error ?? `Bridge HTTP ${res.status}`);
    return data.result as T;
  });
}

export function useDevBridge() {
  return useMemo(() => ({ status: 'ready' as BridgeStatus, isConnected: true }), []);
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
  listDocs: () => send<{ entries: Array<{ type: 'file'|'dir'; path: string; name: string; depth: number; title?: string }> }>('listDocs'),
  listCustomPages: () => send<{ pages: Array<{ slug: string; folderName: string }> }>('listCustomPages'),
  readContacts: () => send<{ content: string }>('readContacts'),
  writeContacts: (content: string) => send<{ ok: boolean }>('writeContacts', { content }),
  uploadAsset: (filename: string, base64: string, mimeType: string) => send<{ path: string }>('uploadAsset', { filename, base64, mimeType }),
  uploadFavicon: (base64: string, mimeType: string) => send<{ path: string }>('uploadFavicon', { base64, mimeType }),
  uploadLogo: (variant: 'light' | 'dark', base64: string, mimeType: string) => send<{ path: string }>('uploadLogo', { variant, base64, mimeType }),
  runGenerate: () => send<{ ok: boolean; stdout: string; stderr: string }>('runGenerate'),
  renderPreview: (markdown: string) => send<{ html: string; error?: string }>('renderPreview', { markdown }),
  readSiteConfig: () => send<{ config: SiteConfig }>('readSiteConfig'),
  writeSiteConfig: (config: SiteConfig) => send<{ ok: boolean }>('writeSiteConfig', { config }),
};
