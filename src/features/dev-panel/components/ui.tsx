import React from 'react';
import type { TTokens } from '../DevPanel';

// Статичные токены для Toast (всегда тёмная тема, вне ThemeContext)
export const T = {
  fg:    'rgba(255,255,255,0.9)',
  fgSub: 'rgba(255,255,255,0.22)',
  mono:  'ui-monospace, "Cascadia Code", "Fira Code", monospace',
};

type BadgeVariant = 'N' | 'C' | 'A' | 'default';

const BADGE_STYLES: Record<BadgeVariant, { bg: string; color: string; label: string }> = {
  N:       { bg: 'rgba(34,197,94,0.15)',   color: '#22c55e',               label: 'N' },
  C:       { bg: 'rgba(20,184,166,0.15)',  color: '#14b8a6',               label: 'C' },
  A:       { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b',               label: 'A' },
  default: { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', label: '?' },
};

export function Badge({ type }: { readonly type: BadgeVariant }) {
  const s = BADGE_STYLES[type] ?? BADGE_STYLES.default;
  return (
    <span style={{
      fontSize: 9,
      fontWeight: 800,
      background: s.bg,
      color: s.color,
      borderRadius: 3,
      padding: '1px 5px',
      letterSpacing: '0.05em',
      fontFamily: T.mono,
    }}>
      {s.label}
    </span>
  );
}

export function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  danger,
  t,
}: {
  readonly message: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly danger?: boolean;
  readonly t: TTokens;
}) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100002,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: t.bg,
        border: `1px solid ${t.borderStrong}`,
        borderRadius: 10,
        padding: 20,
        width: 300,
        boxShadow: t.shadow,
        fontFamily: t.mono,
      }}>
        <div style={{
          fontSize: 13,
          color: t.fg,
          marginBottom: 16,
          lineHeight: 1.5,
        }}>
          {message}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '7px',
              borderRadius: 7,
              border: `1px solid ${t.border}`,
              background: 'transparent',
              color: t.fgMuted,
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: t.mono,
            }}
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '7px',
              borderRadius: 7,
              border: `1px solid ${danger ? `${t.danger}66` : t.borderStrong}`,
              background: danger ? 'rgba(239,68,68,0.12)' : t.surfaceHov,
              color: danger ? t.danger : t.fg,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: t.mono,
            }}
          >
            Подтвердить
          </button>
        </div>
      </div>
    </div>
  );
}