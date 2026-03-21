/**
 * DevPanel v4 — Админ Панель
 * Вкладки: Страницы, Контакты, Ассеты
 * Тема: light/dark sync с проектом
 */

import React, {
  useState, useCallback, useEffect, useRef, Suspense, lazy,
} from 'react';
import { createPortal } from 'react-dom';
import { useDevBridge } from './useDevBridge';
import { DevPanelStyles } from './components/ui';
import { ToastContainer } from './components/Toast';
import {
  FileText, Users, Image,
  X, UserCog, WifiOff,
  Loader2, AlertCircle,
} from 'lucide-react';

// ─── Lazy-loaded panels ───────────────────────────────────────────────────────

const DocsPanel    = lazy(() => import('./panels/DocsPanel'));
const ContactsPanel = lazy(() => import('./panels/ContactsPanel'));
const AssetsPanel   = lazy(() => import('./panels/AssetsPanel'));

// ─── Theme tokens (light/dark) ────────────────────────────────────────────────

function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : true
  );

  useEffect(() => {
    const onTheme = (e: Event) => {
      const detail = (e as CustomEvent<{ isDark: boolean }>).detail;
      setIsDark(detail.isDark);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'theme') setIsDark(e.newValue !== 'light');
    };
    window.addEventListener('hub:theme-change', onTheme);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('hub:theme-change', onTheme);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return isDark;
}

function makeT(isDark: boolean) {
  return isDark ? {
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
    overlay:    'rgba(12,12,14,0.9)',
    tabActive:  'rgba(124,92,252,0.15)',
    tabBorder:  'rgba(124,92,252,0.5)',
  } : {
    bg:         '#E8E7E3',
    bgPanel:    '#E0DFDb',
    bgHov:      '#d4d3cf',
    bgActive:   '#cccbc7',
    border:     'rgba(0,0,0,0.08)',
    borderHov:  'rgba(0,0,0,0.14)',
    fg:         'rgba(0,0,0,0.9)',
    fgMuted:    'rgba(0,0,0,0.4)',
    fgSub:      'rgba(0,0,0,0.22)',
    accent:     '#6b46e8',
    accentGlow: 'rgba(107,70,232,0.3)',
    accentSoft: 'rgba(107,70,232,0.1)',
    success:    '#16a34a',
    successSoft:'rgba(22,163,74,0.1)',
    warning:    '#d97706',
    warningSoft:'rgba(217,119,6,0.1)',
    danger:     '#dc2626',
    dangerSoft: 'rgba(220,38,38,0.1)',
    mono:       'ui-monospace, "Cascadia Code", "Fira Code", monospace',
    overlay:    'rgba(232,231,227,0.9)',
    tabActive:  'rgba(107,70,232,0.1)',
    tabBorder:  'rgba(107,70,232,0.5)',
  };
}

export type TTokens = ReturnType<typeof makeT>;

// Export T for panels that need it (legacy compat)
export const T = makeT(true);

// ─── Tab config ───────────────────────────────────────────────────────────────

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ComponentType<any>;
  hotkey?: string;
}

const TABS: Tab[] = [
  {
    id: 'docs',     label: 'Страницы', icon: <FileText size={14}/>,
    component: DocsPanel,     hotkey: '1',
  },
  {
    id: 'contacts', label: 'Контакты', icon: <Users size={14}/>,
    component: ContactsPanel, hotkey: '2',
  },
  {
    id: 'assets',   label: 'Ассеты',   icon: <Image size={14}/>,
    component: AssetsPanel,   hotkey: '3',
  },
];

// ─── Status indicator ──────────────────────────────────────────────────────────

function StatusDot({ status, t }: { status: string; t: TTokens }) {
  const map: Record<string, { color: string; label: string; glow: boolean }> = {
    connected:    { color: '#22c55e', label: 'Подключено',     glow: true  },
    connecting:   { color: '#f59e0b', label: 'Подключение...', glow: false },
    disconnected: { color: '#6b7280', label: 'Отключено',      glow: false },
    error:        { color: '#ef4444', label: 'Ошибка',         glow: false },
  };
  const s = map[status] ?? map.disconnected;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0,
        boxShadow: s.glow ? `0 0 6px ${s.color}` : 'none',
        animation: status === 'connecting' ? 'devPulse 1s ease-in-out infinite' : 'none',
      }} />
      <span style={{ fontSize: 10, color: s.color }}>{s.label}</span>
    </div>
  );
}

// ─── Panel header ──────────────────────────────────────────────────────────────

function PanelHeader({
  onClose, status, activeTab, onTabChange, t,
}: {
  onClose: () => void;
  status: string;
  activeTab: string;
  onTabChange: (id: string) => void;
  t: TTokens;
}) {
  return (
    <>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 12px 8px',
        borderBottom: `1px solid ${t.border}`,
        background: t.bgPanel,
        flexShrink: 0,
        userSelect: 'none',
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: 6,
          background: t.accentSoft,
          border: `1px solid ${t.accent}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <UserCog size={12} style={{ color: t.accent }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontSize: 11, fontWeight: 800, color: t.fg,
              letterSpacing: '0.06em', fontFamily: t.mono,
            }}>
              АДМИН ПАНЕЛЬ
            </span>
            <span style={{
              fontSize: 8, fontWeight: 700, color: t.accent,
              background: t.accentSoft, border: `1px solid ${t.accent}30`,
              borderRadius: 3, padding: '1px 4px', letterSpacing: '0.1em',
            }}>
              DEV ONLY
            </span>
          </div>
          <StatusDot status={status} t={t} />
        </div>

        <button
          onClick={onClose}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 22, height: 22, borderRadius: 5,
            border: `1px solid ${t.border}`,
            background: 'transparent', color: t.fgMuted, cursor: 'pointer',
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = t.bgHov;
            (e.currentTarget as HTMLButtonElement).style.color = t.fg;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = t.fgMuted;
          }}
          title="Закрыть (Ctrl+Shift+D)"
        >
          <X size={12} />
        </button>
      </div>

      {/* Tab strip */}
      <div style={{
        display: 'flex', overflowX: 'auto', borderBottom: `1px solid ${t.border}`,
        background: t.bgPanel, flexShrink: 0,
        scrollbarWidth: 'none',
      }}>
        {TABS.map(tab => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              title={`${tab.label} (Ctrl+Shift+${tab.hotkey})`}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '8px 14px',
                border: 'none',
                borderBottom: active ? `2px solid ${t.accent}` : '2px solid transparent',
                background: active ? t.tabActive : 'transparent',
                color: active ? t.accent : t.fgMuted,
                fontSize: 11, fontWeight: active ? 700 : 400,
                cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.1s',
                fontFamily: t.mono,
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.color = t.fg;
                  (e.currentTarget as HTMLButtonElement).style.background = t.bgHov;
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.color = t.fgMuted;
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ─── Disconnected overlay ──────────────────────────────────────────────────────

function DisconnectedOverlay({ status, onRetry, t }: { status: string; onRetry: () => void; t: TTokens }) {
  if (status === 'connected') return null;
  const isConnecting = status === 'connecting';

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 10,
      background: t.overlay,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 12, backdropFilter: 'blur(4px)',
    }}>
      {isConnecting ? (
        <>
          <Loader2 size={24} style={{ color: t.accent, animation: 'devSpinAnim 1s linear infinite' }} />
          <div style={{ fontSize: 12, color: t.fgMuted, textAlign: 'center', lineHeight: 1.5 }}>
            Подключение к dev-серверу...<br/>
            <span style={{ fontSize: 10, color: t.fgSub }}>ws://127.0.0.1:7777</span>
          </div>
        </>
      ) : (
        <>
          <WifiOff size={24} style={{ color: t.danger, opacity: 0.7 }} />
          <div style={{ fontSize: 12, color: t.fgMuted, textAlign: 'center', lineHeight: 1.5 }}>
            Нет соединения с dev-сервером<br/>
            <span style={{ fontSize: 10, color: t.fgSub }}>Убедись что запущен `astro dev`</span>
          </div>
          <button
            onClick={onRetry}
            style={{
              padding: '6px 14px', borderRadius: 6,
              border: `1px solid ${t.accent}55`,
              background: t.accentSoft, color: t.accent,
              fontSize: 11, cursor: 'pointer', fontFamily: t.mono,
            }}
          >
            Переподключиться
          </button>
        </>
      )}
    </div>
  );
}

// ─── Toggle trigger (LEFT side, near nav rail) ────────────────────────────────

function PanelTrigger({ visible, onClick, status, t }: {
  visible: boolean; onClick: () => void; status: string; t: TTokens;
}) {
  const [hov, setHov] = useState(false);
  const hasIssue = status !== 'connected' && status !== 'connecting';

  // Position: left side, at bottom of rail (under logo area)
  // Rail is 64px wide. We place at left: 64px - 2px for overlap
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={visible ? 'Скрыть панель (Ctrl+Shift+D)' : 'Админ Панель (Ctrl+Shift+D)'}
      style={{
        position: 'fixed',
        left: 6,
        bottom: 72,
        zIndex: 99997,
        display: 'flex', alignItems: 'center', gap: 0,
        borderRadius: '8px',
        border: `1px solid ${hov ? t.accent : t.border}`,
        background: hov
          ? t.accent
          : visible
            ? t.bgActive
            : t.bgPanel,
        boxShadow: hov
          ? `0 4px 20px ${t.accentGlow}`
          : `0 2px 12px rgba(0,0,0,0.2)`,
        cursor: 'pointer', transition: 'all 0.18s', overflow: 'hidden', padding: 0,
      } as React.CSSProperties}
    >
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 4, padding: '8px 7px',
      }}>
        {hasIssue && <AlertCircle size={10} style={{ color: t.danger }} />}
        <UserCog size={14} style={{ color: hov ? '#fff' : t.accent }} />
        <span style={{
          fontSize: 8, fontWeight: 700, letterSpacing: '0.06em',
          color: hov ? '#fff' : t.fgMuted, fontFamily: t.mono,
          writingMode: 'vertical-rl', textOrientation: 'mixed',
        }}>ADMIN</span>
      </div>
    </button>
  );
}

// ─── Context for passing theme to panels ──────────────────────────────────────

export const ThemeTokensContext = React.createContext<TTokens>(makeT(true));

// ─── Main DevPanel ────────────────────────────────────────────────────────────

export default function DevPanel() {
  const { status } = useDevBridge();
  const isDark = useIsDark();
  const t = React.useMemo(() => makeT(isDark), [isDark]);

  const [open, setOpen]         = useState(false);
  const [activeTab, setActiveTab] = useState('docs');
  const [width, setWidth]       = useState(() => {
    try { return parseInt(localStorage.getItem('hub-dev-width') ?? '460'); } catch { return 460; }
  });

  const isDragging  = useRef(false);
  const dragStartX  = useRef(0);
  const dragStartW  = useRef(0);
  const panelRef    = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault(); setOpen(v => !v); return;
      }
      if (e.ctrlKey && e.shiftKey && /^[1-3]$/.test(e.key)) {
        e.preventDefault();
        const tab = TABS[parseInt(e.key) - 1];
        if (tab) { setActiveTab(tab.id); setOpen(true); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Resize handle
  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartW.current = width;
    document.body.style.cursor     = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const next = Math.max(360, Math.min(820, dragStartW.current + (dragStartX.current - ev.clientX)));
      setWidth(next);
    };
    const onUp = () => {
      isDragging.current = false;
      document.body.style.cursor     = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [width]);

  useEffect(() => {
    try { localStorage.setItem('hub-dev-width', String(width)); } catch {}
  }, [width]);

  const ActiveComp = TABS.find(tab => tab.id === activeTab)?.component ?? DocsPanel;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <ThemeTokensContext.Provider value={t}>
      <DevPanelStyles />
      <style>{`
        @keyframes devPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        .hub-admin-panel * { box-sizing: border-box; }
      `}</style>

      <PanelTrigger visible={open} onClick={() => setOpen(v => !v)} status={status} t={t} />

      <div
        ref={panelRef}
        className="hub-admin-panel"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width,
          zIndex: 99998,
          display: 'flex', flexDirection: 'column',
          background: t.bg,
          borderLeft: `1px solid ${t.border}`,
          boxShadow: open ? `-8px 0 48px rgba(0,0,0,0.4)` : 'none',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
          fontFamily: t.mono,
          contain: 'layout',
        }}
      >
        {/* Resize handle */}
        <div
          onMouseDown={onResizeStart}
          style={{
            position: 'absolute', left: -5, top: 0, bottom: 0,
            width: 10, cursor: 'col-resize', zIndex: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div style={{
            width: 3, height: 40, borderRadius: 3,
            background: t.border,
          }} />
        </div>

        <PanelHeader
          onClose={() => setOpen(false)}
          status={status}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          t={t}
        />

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <DisconnectedOverlay status={status} onRetry={() => window.location.reload()} t={t} />

          <Suspense fallback={
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, color: t.fgSub, fontSize: 12,
            }}>
              <Loader2 size={14} style={{ animation: 'devSpinAnim 1s linear infinite' }} />
              Загрузка...
            </div>
          }>
            <ActiveComp />
          </Suspense>
        </div>
      </div>

      <ToastContainer />
    </ThemeTokensContext.Provider>,
    document.body
  );
}

export { makeT, useIsDark };