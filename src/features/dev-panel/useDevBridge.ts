/**
 * useDevBridge v2 — улучшенный WebSocket хук
 * - Экспоненциальный backoff для переподключения
 * - Типизированный API bridge
 * - Heartbeat для детекции обрыва
 */

import { useEffect, useState } from 'react';

const WS_URL = 'ws://127.0.0.1:7777';

export type BridgeStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface PendingMsg {
  resolve: (v: unknown) => void;
  reject: (e: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

// ─── Singleton connection manager ──────────────────────────────────────────────

let ws: WebSocket | null = null;
let pending       = new Map<string, PendingMsg>();
let listeners     = new Set<(s: BridgeStatus) => void>();
let status: BridgeStatus = 'disconnected';
let reconnectDelay = 1000;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let connectCalled  = false;

function broadcast(s: BridgeStatus) {
  status = s;
  listeners.forEach(fn => fn(s));
}

function stopHeartbeat() {
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
}

function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ id: '__ping__', action: 'ping' }));
    }
  }, 15_000);
}

function connect() {
  if (ws?.readyState === WebSocket.OPEN || ws?.readyState === WebSocket.CONNECTING) return;

  broadcast('connecting');

  try {
    ws = new WebSocket(WS_URL);
  } catch {
    broadcast('error');
    scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    reconnectDelay = 1000;
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    broadcast('connected');
    startHeartbeat();
  };

  ws.onmessage = ev => {
    let msg: any;
    try { msg = JSON.parse(ev.data); } catch { return; }
    if (msg.id === '__ping__') return;
    const p = pending.get(msg.id);
    if (!p) return;
    clearTimeout(p.timeout);
    pending.delete(msg.id);
    if (msg.ok) p.resolve(msg.result ?? null);
    else p.reject(new Error(msg.error ?? 'Bridge error'));
  };

  ws.onclose = () => {
    stopHeartbeat();
    pending.forEach(({ reject, timeout }) => { clearTimeout(timeout); reject(new Error('Disconnected')); });
    pending.clear();
    broadcast('disconnected');
    scheduleReconnect();
  };

  ws.onerror = () => { broadcast('error'); };
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    reconnectDelay = Math.min(reconnectDelay * 1.5, 10_000);
    connect();
  }, reconnectDelay);
}

function send<T = unknown>(action: string, payload?: unknown): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (ws?.readyState !== WebSocket.OPEN) {
      reject(new Error('Not connected'));
      return;
    }
    // crypto.randomUUID() используется для уникальной идентификации pending-запросов
    const id = crypto.randomUUID();
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Timeout: ${action}`));
    }, 30_000);
    pending.set(id, { resolve: resolve as (v: unknown) => void, reject, timeout });
    ws.send(JSON.stringify({ id, action, payload }));
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDevBridge() {
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>(status);

  useEffect(() => {
    listeners.add(setBridgeStatus);
    if (connectCalled) {
      setBridgeStatus(status);
    } else {
      connectCalled = true;
      connect();
    }
    return () => { listeners.delete(setBridgeStatus); };
  }, []);

  return {
    status: bridgeStatus,
    isConnected: bridgeStatus === 'connected',
  };
}

// ─── Site config типы ─────────────────────────────────────────────────────────

export interface SiteConfig {
  useLanding: boolean;
}

// ─── Typed bridge API ──────────────────────────────────────────────────────────

export const bridge = {
  writeFile: (filePath: string, content: string) =>
    send<{ written: string }>('writeFile', { filePath, content }),

  // Создаёт директорию без placeholder-файлов
  mkdir: (dirPath: string) =>
    send<{ created: string }>('mkdir', { dirPath }),

  readFile: (filePath: string) =>
    send<{ content: string }>('readFile', { filePath }),

  deleteFile: (filePath: string) =>
    send<{ deleted: string }>('deleteFile', { filePath }),

  listDocs: () =>
    send<{ entries: Array<{ type: 'file'|'dir'; path: string; name: string; depth: number }> }>('listDocs'),

  readContacts: () =>
    send<{ content: string }>('readContacts'),

  writeContacts: (content: string) =>
    send<{ ok: boolean }>('writeContacts', { content }),

  uploadAsset: (filename: string, base64: string, mimeType: string) =>
    send<{ path: string }>('uploadAsset', { filename, base64, mimeType }),

  uploadFavicon: (base64: string, mimeType: string) =>
    send<{ path: string }>('uploadFavicon', { base64, mimeType }),

  runGenerate: () =>
    send<{ ok: boolean; stdout: string; stderr: string }>('runGenerate'),

  renderPreview: (markdown: string) =>
    send<{ html: string; error?: string }>('renderPreview', { markdown }),

  readSiteConfig: () =>
    send<{ config: SiteConfig }>('readSiteConfig'),

  writeSiteConfig: (config: SiteConfig) =>
    send<{ ok: boolean }>('writeSiteConfig', { config }),
};