/**
 * useDevBridge — React хук для общения с WebSocket-бриджем
 * Автоматически переподключается, очередь запросов с Promise-based API
 */

import { useEffect, useRef, useCallback, useState } from 'react';

const WS_URL = 'ws://127.0.0.1:7777';
const RECONNECT_DELAY = 2000;

type BridgeStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

let globalWs: WebSocket | null = null;
let globalPending = new Map<string, PendingRequest>();
let globalListeners = new Set<(status: BridgeStatus) => void>();
let globalStatus: BridgeStatus = 'disconnected';
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function setGlobalStatus(s: BridgeStatus) {
  globalStatus = s;
  globalListeners.forEach((fn) => fn(s));
}

function connect() {
  if (globalWs && globalWs.readyState === WebSocket.OPEN) return;
  if (globalWs && globalWs.readyState === WebSocket.CONNECTING) return;

  setGlobalStatus('connecting');

  try {
    globalWs = new WebSocket(WS_URL);
  } catch {
    setGlobalStatus('error');
    scheduleReconnect();
    return;
  }

  globalWs.onopen = () => {
    setGlobalStatus('connected');
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  };

  globalWs.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      const pending = globalPending.get(msg.id);
      if (!pending) return;
      globalPending.delete(msg.id);
      if (msg.ok) pending.resolve(msg.result);
      else pending.reject(new Error(msg.error ?? 'Bridge error'));
    } catch { /* ignore */ }
  };

  globalWs.onclose = () => {
    setGlobalStatus('disconnected');
    // Reject all pending
    globalPending.forEach(({ reject }) => reject(new Error('WS disconnected')));
    globalPending.clear();
    scheduleReconnect();
  };

  globalWs.onerror = () => {
    setGlobalStatus('error');
  };
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, RECONNECT_DELAY);
}

function sendAction<T = unknown>(action: string, payload?: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!globalWs || globalWs.readyState !== WebSocket.OPEN) {
      reject(new Error('Bridge not connected'));
      return;
    }
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    globalPending.set(id, { resolve: resolve as (v: unknown) => void, reject });
    globalWs.send(JSON.stringify({ id, action, payload }));

    // Timeout 30s
    setTimeout(() => {
      if (globalPending.has(id)) {
        globalPending.delete(id);
        reject(new Error(`Timeout: ${action}`));
      }
    }, 30_000);
  });
}

// ─── Public hook ──────────────────────────────────────────────────────────────

export function useDevBridge() {
  const [status, setStatus] = useState<BridgeStatus>(globalStatus);

  useEffect(() => {
    globalListeners.add(setStatus);
    connect();
    return () => { globalListeners.delete(setStatus); };
  }, []);

  const send = useCallback(<T = unknown>(action: string, payload?: unknown) =>
    sendAction<T>(action, payload), []);

  return { status, send, isConnected: status === 'connected' };
}

// ─── Typed action helpers ─────────────────────────────────────────────────────

export const bridge = {
  writeFile:     (filePath: string, content: string) =>
    sendAction<{ written: string }>('writeFile', { filePath, content }),

  readFile:      (filePath: string) =>
    sendAction<{ content: string }>('readFile', { filePath }),

  deleteFile:    (filePath: string) =>
    sendAction<{ deleted: string }>('deleteFile', { filePath }),

  listDocs:      () =>
    sendAction<{ entries: Array<{ type: string; path: string; name: string; depth: number }> }>('listDocs'),

  readContacts:  () =>
    sendAction<{ content: string }>('readContacts'),

  writeContacts: (content: string) =>
    sendAction<{ ok: boolean }>('writeContacts', { content }),

  readCss:       () =>
    sendAction<{ content: string }>('readCss', {}),

  writeCssVars:  (vars: Record<string, string>) =>
    sendAction<{ ok: boolean }>('writeCssVars', { vars }),

  uploadAsset:   (filename: string, base64: string, mimeType: string) =>
    sendAction<{ path: string }>('uploadAsset', { filename, base64, mimeType }),

  uploadFavicon: (base64: string, mimeType: string) =>
    sendAction<{ path: string }>('uploadFavicon', { base64, mimeType }),

  runGenerate:   () =>
    sendAction<{ ok: boolean; stdout: string; stderr: string }>('runGenerate'),
};