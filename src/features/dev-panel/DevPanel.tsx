/**
 * DevPanel v3
 * Вкладки: Docs (Nav+Pages объединены), Contacts, Assets
 * Убраны: Theme, Generate
 */

import React, {
  useState, useCallback, useEffect, useRef, Suspense, lazy,
} from 'react';
import { createPortal } from 'react-dom';
import { useDevBridge } from './useDevBridge';
import { T, DevPanelStyles } from './components/ui';
import { ToastContainer } from './components/Toast';
import {
  FolderTree, Users, Image,
  X, Zap, Wifi, WifiOff,
  Loader2, AlertCircle,
} from 'lucide-react';

// ─── Lazy-loaded panels ───────────────────────────────────────────────────────

const DocsPanel    = lazy(() => import('./panels/DocsPanel'));
const ContactsPanel = lazy(() => import('./panels/ContactsPanel'));
const AssetsPanel   = lazy(() => import('./panels/AssetsPanel'));

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
    id: 'docs',     label: 'Docs',     icon: <FolderTree size={14}/>,
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

function StatusDot({ status }: { status: string }) {
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
  onClose, status, activeTab, onTabChange,
}: {
  onClose: () => void;
  status: string;
  activeTab: string;
  onTabChange: (id: string) => void;
}) {
  return (
    <>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 12px 8px',
        borderBottom: `1px solid ${T.border}`,
        background: T.bgPanel,
        flexShrink: 0,
        userSelect: 'none',
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: 5,
          background: T.accentSoft,
          border: `1px solid ${T.accent}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Zap size={11} style={{ color: T.accent }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontSize: 11, fontWeight: 800, color: T.fg,
              letterSpacing: '0.06em', fontFamily: T.mono,
            }}>
              HUB DEV
            </span>
            <span style={{
              fontSize: 8, fontWeight: 700, color: T.accent,
              background: T.accentSoft, border: `1px solid ${T.accent}30`,
              borderRadius: 3, padding: '1px 4px', letterSpacing: '0.1em',
            }}>
              DEV ONLY
            </span>
          </div>
          <StatusDot status={status} />
        </div>

        <button
          onClick={onClose}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 22, height: 22, borderRadius: 5,
            border: `1px solid ${T.border}`,
            background: 'transparent', color: T.fgMuted, cursor: 'pointer',
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = T.bgHov;
            (e.currentTarget as HTMLButtonElement).style.color = T.fg;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = T.fgMuted;
          }}
          title="Закрыть (Ctrl+Shift+D)"
        >
          <X size={12} />
        </button>
      </div>

      {/* Tab strip */}
      <div style={{
        display: 'flex', overflowX: 'auto', borderBottom: `1px solid ${T.border}`,
        background: T.bgPanel, flexShrink: 0,
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
                borderBottom: active ? `2px solid ${T.accent}` : '2px solid transparent',
                background: active ? T.accentSoft : 'transparent',
                color: active ? T.accent : T.fgMuted,
                fontSize: 11, fontWeight: active ? 700 : 400,
                cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.1s',
                fontFamily: T.mono,
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.color = T.fg;
                  (e.currentTarget as HTMLButtonElement).style.background = T.bgHov;
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.color = T.fgMuted;
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

function DisconnectedOverlay({ status, onRetry }: { status: string; onRetry: () => void }) {
  if (status === 'connected') return null;
  const isConnecting = status === 'connecting';

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 10,
      background: 'rgba(12,12,14,0.9)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 12, backdropFilter: 'blur(4px)',
    }}>
      {isConnecting ? (
        <>
          <Loader2 size={24} style={{ color: T.accent, animation: 'devSpinAnim 1s linear infinite' }} />
          <div style={{ fontSize: 12, color: T.fgMuted, textAlign: 'center', lineHeight: 1.5 }}>
            Подключение к dev-серверу...<br/>
            <span style={{ fontSize: 10, color: T.fgSub }}>ws://127.0.0.1:7777</span>
          </div>
        </>
      ) : (
        <>
          <WifiOff size={24} style={{ color: T.danger, opacity: 0.7 }} />
          <div style={{ fontSize: 12, color: T.fgMuted, textAlign: 'center', lineHeight: 1.5 }}>
            Нет соединения с dev-сервером<br/>
            <span style={{ fontSize: 10, color: T.fgSub }}>Убедись что запущен `astro dev`</span>
          </div>
          <button
            onClick={onRetry}
            style={{
              padding: '6px 14px', borderRadius: 6,
              border: `1px solid ${T.accent}55`,
              background: T.accentSoft, color: T.accent,
              fontSize: 11, cursor: 'pointer', fontFamily: T.mono,
            }}
          >
            Переподключиться
          </button>
        </>
      )}
    </div>
  );
}

// ─── Toggle trigger ───────────────────────────────────────────────────────────

function PanelTrigger({ visible, onClick, status }: {
  visible: boolean; onClick: () => void; status: string;
}) {
  const [hov, setHov] = useState(false);
  const hasIssue = status !== 'connected' && status !== 'connecting';

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={visible ? 'Скрыть панель (Ctrl+Shift+D)' : 'Dev Panel (Ctrl+Shift+D)'}
      style={{
        position: 'fixed', right: 0, bottom: 96, zIndex: 99997,
        display: 'flex', alignItems: 'center', gap: 0,
        border: 'none', borderRadius: '8px 0 0 8px',
        background: hov ? T.accent : visible ? T.bgActive : T.bgPanel,
        boxShadow: hov ? `-4px 0 20px ${T.accentGlow}` : '-2px 0 12px rgba(0,0,0,0.5)',
        cursor: 'pointer', transition: 'all 0.18s', overflow: 'hidden', padding: 0,
      }}
    >
      <div style={{
        width: 3, alignSelf: 'stretch',
        background: visible ? T.accent : hov ? '#fff3' : T.accent + '60',
      }} />
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 5, padding: '10px 7px',
        writingMode: 'vertical-rl', textOrientation: 'mixed',
      }}>
        {hasIssue && <AlertCircle size={10} style={{ color: T.danger }} />}
        <Zap size={12} style={{ color: hov ? '#fff' : T.accent, transform: 'rotate(-90deg)' }} />
        <span style={{
          fontSize: 9, fontWeight: 800, letterSpacing: '0.12em',
          color: hov ? '#fff' : T.fgMuted, fontFamily: T.mono,
        }}>DEV</span>
      </div>
    </button>
  );
}

// ─── Main DevPanel ────────────────────────────────────────────────────────────

export default function DevPanel() {
  const { status } = useDevBridge();
  const [open, setOpen]         = useState(false);
  const [activeTab, setActiveTab] = useState('docs');
  const [width, setWidth]       = useState(() => {
    try { return parseInt(localStorage.getItem('hub-dev-width') ?? '420'); } catch { return 420; }
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
      const next = Math.max(320, Math.min(800, dragStartW.current + (dragStartX.current - ev.clientX)));
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

  const ActiveComp = TABS.find(t => t.id === activeTab)?.component ?? DocsPanel;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <DevPanelStyles />
      <style>{`
        @keyframes devPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      <PanelTrigger visible={open} onClick={() => setOpen(v => !v)} status={status} />

      <div
        ref={panelRef}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width,
          zIndex: 99998,
          display: 'flex', flexDirection: 'column',
          background: T.bg,
          borderLeft: `1px solid ${T.border}`,
          boxShadow: open ? '-8px 0 48px rgba(0,0,0,0.7)' : 'none',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
          fontFamily: T.mono,
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
            background: 'rgba(255,255,255,0.1)',
          }} />
        </div>

        <PanelHeader
          onClose={() => setOpen(false)}
          status={status}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <DisconnectedOverlay status={status} onRetry={() => window.location.reload()} />

          <Suspense fallback={
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, color: T.fgSub, fontSize: 12,
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
    </>,
    document.body
  );
}

export { T };