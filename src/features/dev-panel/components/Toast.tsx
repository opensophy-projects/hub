/**
 * Toast notifications для Dev Panel
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { T } from './ui';

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

// ─── Store (module-level singleton) ──────────────────────────────────────────

type Listener = (toasts: ToastItem[]) => void;
let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(fn => fn([...toasts]));
}

function addToast(type: ToastType, message: string) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  toasts = [...toasts, { id, type, message }];
  notify();
  setTimeout(() => removeToast(id), 3500);
}

function removeToast(id: string) {
  toasts = toasts.filter(t => t.id !== id);
  notify();
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const toast = {
  success: (msg: string) => addToast('success', msg),
  error:   (msg: string) => addToast('error',   msg),
  info:    (msg: string) => addToast('info',     msg),
  warning: (msg: string) => addToast('warning',  msg),
};

// ─── Toast config ─────────────────────────────────────────────────────────────

const TOAST_CONFIG: Record<ToastType, {
  icon: React.FC<{ size: number }>;
  color: string;
  bg: string;
  border: string;
}> = {
  success: { icon: CheckCircle,  color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.25)'  },
  error:   { icon: XCircle,      color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)'  },
  info:    { icon: Info,         color: '#7c5cfc', bg: 'rgba(124,92,252,0.08)',  border: 'rgba(124,92,252,0.25)' },
  warning: { icon: AlertTriangle,color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
};

// ─── Single Toast ─────────────────────────────────────────────────────────────

function Toast({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const cfg = TOAST_CONFIG[item.type];
  const Icon = cfg.icon;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // trigger enter animation
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 9,
      padding: '9px 12px',
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: 8,
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      fontFamily: T.mono,
      minWidth: 220, maxWidth: 320,
      transform: visible ? 'translateX(0)' : 'translateX(calc(100% + 16px))',
      opacity: visible ? 1 : 0,
      transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease',
    }}>
      <Icon size={14} style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }} />
      <span style={{ flex: 1, fontSize: 12, color: T.fg, lineHeight: 1.4 }}>
        {item.message}
      </span>
      <button
        onClick={onClose}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: T.fgSub, padding: 0, display: 'flex', flexShrink: 0,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = T.fg; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = T.fgSub; }}
      >
        <X size={12} />
      </button>
    </div>
  );
}

// ─── ToastContainer ───────────────────────────────────────────────────────────

export function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const fn: Listener = updated => setItems(updated);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  if (typeof document === 'undefined' || !items.length) return null;

  return createPortal(
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 100010,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      alignItems: 'flex-end',
      pointerEvents: 'none',
    }}>
      {items.map(item => (
        <div key={item.id} style={{ pointerEvents: 'auto' }}>
          <Toast item={item} onClose={() => removeToast(item.id)} />
        </div>
      ))}
    </div>,
    document.body
  );
}