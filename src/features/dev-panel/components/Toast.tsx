/**
 * Toast — система уведомлений для Dev Panel
 * Глобальный стейт, вызывается из любого места через toast.success() и т.д.
 */

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// ─── Global store (no context needed for imperative API) ──────────────────────

type Listener = (toasts: Toast[]) => void;
let _toasts: Toast[] = [];
const _listeners = new Set<Listener>();

function notify() {
  _listeners.forEach(fn => fn([..._toasts]));
}

function addToast(type: ToastType, message: string, duration = 3500) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  _toasts = [..._toasts, { id, type, message, duration }];
  notify();
  if (duration > 0) {
    setTimeout(() => removeToast(id), duration);
  }
  return id;
}

function removeToast(id: string) {
  _toasts = _toasts.filter(t => t.id !== id);
  notify();
}

// ─── Imperative API ───────────────────────────────────────────────────────────

export const toast = {
  success: (msg: string, duration?: number) => addToast('success', msg, duration),
  error:   (msg: string, duration?: number) => addToast('error', msg, duration ?? 5000),
  warning: (msg: string, duration?: number) => addToast('warning', msg, duration),
  info:    (msg: string, duration?: number) => addToast('info', msg, duration),
  dismiss: (id: string) => removeToast(id),
};

// ─── Token colors ──────────────────────────────────────────────────────────────

const CONFIG: Record<ToastType, { bg: string; border: string; icon: React.ReactNode; color: string }> = {
  success: {
    bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)',
    color: '#22c55e', icon: <CheckCircle size={14} />,
  },
  error: {
    bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)',
    color: '#ef4444', icon: <XCircle size={14} />,
  },
  warning: {
    bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)',
    color: '#f59e0b', icon: <AlertTriangle size={14} />,
  },
  info: {
    bg: 'rgba(124,92,252,0.1)', border: 'rgba(124,92,252,0.3)',
    color: '#7c5cfc', icon: <Info size={14} />,
  },
};

// ─── ToastItem ─────────────────────────────────────────────────────────────────

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  const cfg = CONFIG[toast.type];

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '10px 12px',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: 8,
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        minWidth: 280, maxWidth: 380,
        backdropFilter: 'blur(12px)',
        transform: visible ? 'translateX(0)' : 'translateX(110%)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.2s',
        fontFamily: 'ui-monospace, "Cascadia Code", monospace',
      }}
    >
      <span style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }}>{cfg.icon}</span>
      <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>
        {toast.message}
      </span>
      <button
        onClick={onDismiss}
        style={{
          display: 'flex', padding: 2, border: 'none',
          background: 'transparent', color: 'rgba(255,255,255,0.4)',
          cursor: 'pointer', flexShrink: 0,
        }}
      >
        <X size={12} />
      </button>
      {toast.duration > 0 && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0,
          height: 2, borderRadius: '0 0 8px 8px',
          background: cfg.color, opacity: 0.5,
          animation: `progress ${toast.duration}ms linear forwards`,
        }} />
      )}
    </div>
  );
}

// ─── ToastContainer ────────────────────────────────────────────────────────────

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (t: Toast[]) => setToasts(t);
    _listeners.add(listener);
    return () => { _listeners.delete(listener); };
  }, []);

  if (!toasts.length) return null;

  return createPortal(
    <div style={{
      position: 'fixed', bottom: 20, right: 20,
      zIndex: 999999,
      display: 'flex', flexDirection: 'column', gap: 8,
      pointerEvents: 'none',
    }}>
      <style>{`
        @keyframes progress { from { width: 100%; } to { width: 0%; } }
      `}</style>
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'all', position: 'relative' }}>
          <ToastItem toast={t} onDismiss={() => removeToast(t.id)} />
        </div>
      ))}
    </div>,
    document.body
  );
}