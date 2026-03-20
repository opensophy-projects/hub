/**
 * Shared UI primitives — базовые компоненты для панелей
 * Кнопки, инпуты, разделители, секции и т.д.
 */

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

// ─── Design tokens (export для использования в панелях) ───────────────────────

export const T = {
  bg:         '#0c0c0e',
  bgPanel:    '#111114',
  bgHov:      '#1a1a1f',
  bgActive:   '#1e1e24',
  border:     'rgba(255,255,255,0.08)',
  borderHov:  'rgba(255,255,255,0.14)',
  fg:         'rgba(255,255,255,0.9)',
  fgMuted:    'rgba(255,255,255,0.4)',
  fgSub:      'rgba(255,255,255,0.22)',
  accent:     '#7c5cfc',
  accentGlow: 'rgba(124,92,252,0.3)',
  accentSoft: 'rgba(124,92,252,0.12)',
  success:    '#22c55e',
  successSoft:'rgba(34,197,94,0.1)',
  warning:    '#f59e0b',
  warningSoft:'rgba(245,158,11,0.1)',
  danger:     '#ef4444',
  dangerSoft: 'rgba(239,68,68,0.1)',
  mono:       'ui-monospace, "Cascadia Code", "Fira Code", monospace',
};

// ─── Section title ─────────────────────────────────────────────────────────────

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: T.fgSub,
      padding: '10px 14px 6px',
      borderBottom: `1px solid ${T.border}`,
    }}>
      <span style={{ flex: 1 }}>{children}</span>
      {action}
    </div>
  );
}

// ─── Field ─────────────────────────────────────────────────────────────────────

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, color: T.fgSub, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </div>
      {children}
      {hint && <div style={{ fontSize: 10, color: T.fgSub, marginTop: 3 }}>{hint}</div>}
    </div>
  );
}

// ─── Input ─────────────────────────────────────────────────────────────────────

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focus, setFocus] = useState(false);
  return (
    <input
      {...props}
      onFocus={e => { setFocus(true); props.onFocus?.(e); }}
      onBlur={e => { setFocus(false); props.onBlur?.(e); }}
      style={{
        width: '100%',
        padding: '6px 9px',
        borderRadius: 6,
        border: `1px solid ${focus ? T.accent + '80' : T.border}`,
        background: T.bgHov,
        color: T.fg,
        fontSize: 12,
        outline: 'none',
        boxSizing: 'border-box',
        fontFamily: T.mono,
        transition: 'border-color 0.15s',
        ...props.style,
      }}
    />
  );
}

// ─── Textarea ──────────────────────────────────────────────────────────────────

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [focus, setFocus] = useState(false);
  return (
    <textarea
      {...props}
      onFocus={e => { setFocus(true); props.onFocus?.(e); }}
      onBlur={e => { setFocus(false); props.onBlur?.(e); }}
      style={{
        width: '100%',
        padding: '6px 9px',
        borderRadius: 6,
        border: `1px solid ${focus ? T.accent + '80' : T.border}`,
        background: T.bgHov,
        color: T.fg,
        fontSize: 12,
        outline: 'none',
        resize: 'vertical',
        boxSizing: 'border-box',
        fontFamily: T.mono,
        lineHeight: 1.65,
        transition: 'border-color 0.15s',
        scrollbarWidth: 'thin',
        ...props.style,
      }}
    />
  );
}

// ─── Button ─────────────────────────────────────────────────────────────────────

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'accent' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Btn({
  children, variant = 'default', size = 'md', loading, icon, fullWidth, ...rest
}: BtnProps) {
  const [hov, setHov] = useState(false);

  const styles: Record<string, React.CSSProperties> = {
    default: {
      background: hov ? T.bgActive : T.bgHov,
      border: `1px solid ${T.border}`,
      color: T.fgMuted,
    },
    accent: {
      background: hov ? 'rgba(124,92,252,0.2)' : T.accentSoft,
      border: `1px solid ${T.accent}55`,
      color: T.accent,
    },
    success: {
      background: hov ? 'rgba(34,197,94,0.15)' : T.successSoft,
      border: `1px solid rgba(34,197,94,0.4)`,
      color: T.success,
    },
    danger: {
      background: hov ? 'rgba(239,68,68,0.15)' : T.dangerSoft,
      border: `1px solid rgba(239,68,68,0.4)`,
      color: T.danger,
    },
    ghost: {
      background: 'transparent',
      border: '1px solid transparent',
      color: T.fgMuted,
    },
  };

  const padding = size === 'sm' ? '4px 9px' : '7px 14px';

  return (
    <button
      {...rest}
      disabled={loading || rest.disabled}
      onMouseEnter={e => { setHov(true); rest.onMouseEnter?.(e as any); }}
      onMouseLeave={e => { setHov(false); rest.onMouseLeave?.(e as any); }}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        padding,
        borderRadius: 6,
        fontSize: size === 'sm' ? 10 : 12,
        fontWeight: 600,
        cursor: loading || rest.disabled ? 'not-allowed' : 'pointer',
        opacity: rest.disabled && !loading ? 0.5 : 1,
        transition: 'all 0.12s',
        fontFamily: T.mono,
        whiteSpace: 'nowrap',
        width: fullWidth ? '100%' : 'auto',
        ...styles[variant],
        ...rest.style,
      }}
    >
      {loading
        ? <Loader2 size={12} style={{ animation: 'devSpinAnim 1s linear infinite' }} />
        : icon
      }
      {children}
    </button>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────────

export function Divider({ label }: { label?: string }) {
  if (!label) return (
    <div style={{ height: 1, background: T.border, margin: '8px 0' }} />
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0' }}>
      <div style={{ flex: 1, height: 1, background: T.border }} />
      <span style={{ fontSize: 9, color: T.fgSub, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: T.border }} />
    </div>
  );
}

// ─── Badge ──────────────────────────────────────────────────────────────────────

type BadgeVariant = 'N' | 'C' | 'A' | 'default';

const BADGE_STYLES: Record<BadgeVariant, { bg: string; color: string; label: string }> = {
  N: { bg: 'rgba(124,92,252,0.15)', color: '#7c5cfc', label: 'N' },
  C: { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e', label: 'C' },
  A: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'A' },
  default: { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', label: '?' },
};

export function Badge({ type }: { type: BadgeVariant }) {
  const s = BADGE_STYLES[type] ?? BADGE_STYLES.default;
  return (
    <span style={{
      fontSize: 9, fontWeight: 800,
      background: s.bg, color: s.color,
      borderRadius: 3, padding: '1px 4px',
      letterSpacing: '0.05em',
      fontFamily: T.mono,
    }}>
      {s.label}
    </span>
  );
}

// ─── ScrollArea ────────────────────────────────────────────────────────────────

export function ScrollArea({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      overflowY: 'auto',
      scrollbarWidth: 'thin',
      scrollbarColor: 'rgba(255,255,255,0.1) transparent',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── EmptyState ────────────────────────────────────────────────────────────────

export function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc?: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 8, padding: '40px 20px',
      color: T.fgSub, textAlign: 'center',
    }}>
      <div style={{ opacity: 0.4, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.fgMuted }}>{title}</div>
      {desc && <div style={{ fontSize: 11, color: T.fgSub, lineHeight: 1.5 }}>{desc}</div>}
    </div>
  );
}

// ─── StatusBar ────────────────────────────────────────────────────────────────

export function StatusBar({ left, right }: { left: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '4px 12px',
      borderTop: `1px solid ${T.border}`,
      background: T.bgPanel,
      fontSize: 10, color: T.fgSub,
      flexShrink: 0,
    }}>
      <span>{left}</span>
      {right && <span>{right}</span>}
    </div>
  );
}

// ─── Confirm dialog ─────────────────────────────────────────────────────────────

export function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  danger,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100002,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: T.bgPanel, border: `1px solid ${T.border}`,
        borderRadius: 10, padding: 20, width: 300,
        boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
        fontFamily: T.mono,
      }}>
        <div style={{ fontSize: 13, color: T.fg, marginBottom: 16, lineHeight: 1.5 }}>
          {message}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="ghost" fullWidth onClick={onCancel}>Отмена</Btn>
          <Btn variant={danger ? 'danger' : 'accent'} fullWidth onClick={onConfirm}>
            Подтвердить
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Global keyframe styles ────────────────────────────────────────────────────

export function DevPanelStyles() {
  return (
    <style>{`
      @keyframes devSpinAnim { to { transform: rotate(360deg); } }
      @keyframes devFadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
      @keyframes devSlideIn { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: none; } }

      .dev-panel-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
      .dev-panel-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .dev-panel-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      .dev-panel-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
    `}</style>
  );
}