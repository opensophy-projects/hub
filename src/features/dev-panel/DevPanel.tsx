/**
 * DevPanel v5 — Админ Панель
 * Дизайн в стиле UnifiedSearchPanel: floating overlay, backdrop blur
 * Тема: light/dark sync с проектом
 */

import React, {
  useState, useCallback, useEffect, useRef, Suspense, lazy,
} from 'react';
import { createPortal } from 'react-dom';
import { useDevBridge } from './useDevBridge';
import { ToastContainer } from './components/Toast';
import {
  FileText, Users, Image,
  X, UserCog, WifiOff, Wifi,
  Loader2, AlertCircle, Settings2,
} from 'lucide-react';

// ─── Lazy-loaded panels ───────────────────────────────────────────────────────

const DocsPanel     = lazy(() => import('./panels/DocsPanel'));
const ContactsPanel = lazy(() => import('./panels/ContactsPanel'));
const AssetsPanel   = lazy(() => import('./panels/AssetsPanel'));

// ─── Theme hook ───────────────────────────────────────────────────────────────

export function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : true
  );
  useEffect(() => {
    const onTheme = (e: Event) => {
      setIsDark((e as CustomEvent<{ isDark: boolean }>).detail.isDark);
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

// ─── Design tokens — matching UnifiedSearchPanel style ────────────────────────

export function makeT(isDark: boolean) {
  return isDark ? {
    // Panel backgrounds
    overlay:    'rgba(0,0,0,0.55)',
    bg:         '#0F0F0F',
    surface:    '#161616',
    surfaceHov: '#1e1e1e',
    surfaceAct: '#222',
    border:     'rgba(255,255,255,0.08)',
    borderStrong:'rgba(255,255,255,0.16)',
    // Text
    fg:         '#e8e8e8',
    fgMuted:    'rgba(255,255,255,0.42)',
    fgSub:      'rgba(255,255,255,0.22)',
    // Accent
    accent:     '#7c5cfc',
    accentSoft: 'rgba(124,92,252,0.12)',
    accentBorder:'rgba(124,92,252,0.35)',
    // Status
    success:    '#22c55e',
    successSoft:'rgba(34,197,94,0.12)',
    danger:     '#ef4444',
    dangerSoft: 'rgba(239,68,68,0.1)',
    warning:    '#f59e0b',
    // Misc
    mono:       'ui-monospace, "Cascadia Code", "Fira Code", monospace',
    kbd:        'rgba(255,255,255,0.07)',
    kbdBorder:  'rgba(255,255,255,0.13)',
    shadow:     '0 40px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04) inset',
    shadow2:    '0 8px 32px rgba(0,0,0,0.7)',
    // Input
    inpBg:      '#1a1a1a',
    inpBorder:  'rgba(255,255,255,0.12)',
    inpFocus:   'rgba(124,92,252,0.5)',
    // Tab
    tabActiveBg:'rgba(124,92,252,0.12)',
    tabActiveBorder: 'rgba(124,92,252,0.5)',
    // Code/editor
    editorBg:   '#0d0d0d',
    editorFg:   '#e2e8f0',
    caret:      '#e2e8f0',
    lineNum:    '#444',
  } : {
    overlay:    'rgba(0,0,0,0.28)',
    bg:         '#E1E0DC',
    surface:    '#D8D7D3',
    surfaceHov: '#CCCBC7',
    surfaceAct: '#C4C3BF',
    border:     'rgba(0,0,0,0.08)',
    borderStrong:'rgba(0,0,0,0.18)',
    fg:         '#111111',
    fgMuted:    'rgba(0,0,0,0.45)',
    fgSub:      'rgba(0,0,0,0.28)',
    accent:     '#6b46e8',
    accentSoft: 'rgba(107,70,232,0.1)',
    accentBorder:'rgba(107,70,232,0.35)',
    success:    '#16a34a',
    successSoft:'rgba(22,163,74,0.1)',
    danger:     '#dc2626',
    dangerSoft: 'rgba(220,38,38,0.08)',
    warning:    '#d97706',
    mono:       'ui-monospace, "Cascadia Code", "Fira Code", monospace',
    kbd:        'rgba(0,0,0,0.06)',
    kbdBorder:  'rgba(0,0,0,0.12)',
    shadow:     '0 40px 100px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.6) inset',
    shadow2:    '0 8px 28px rgba(0,0,0,0.16)',
    inpBg:      '#E8E7E3',
    inpBorder:  'rgba(0,0,0,0.12)',
    inpFocus:   'rgba(107,70,232,0.5)',
    tabActiveBg:'rgba(107,70,232,0.1)',
    tabActiveBorder: 'rgba(107,70,232,0.5)',
    editorBg:   '#F0EFEB',
    editorFg:   '#1e293b',
    caret:      '#1e293b',
    lineNum:    '#aaa',
  };
}

export type TTokens = ReturnType<typeof makeT>;
export const ThemeTokensContext = React.createContext<TTokens>(makeT(true));

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'docs',     label: 'Страницы', icon: <FileText size={14}/>,  hotkey: '1' },
  { id: 'contacts', label: 'Контакты', icon: <Users size={14}/>,     hotkey: '2' },
  { id: 'assets',   label: 'Ассеты',   icon: <Image size={14}/>,     hotkey: '3' },
];

// ─── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({ status, t }: { status: string; t: TTokens }) {
  const map: Record<string, { color: string; bg: string; label: string; dot?: string }> = {
    connected:    { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   label: 'Подключено'    },
    connecting:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Подключение...' },
    disconnected: { color: t.fgMuted, bg: t.surface,                label: 'Отключено'     },
    error:        { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    label: 'Ошибка'        },
  };
  const s = map[status] ?? map.disconnected;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '3px 8px', borderRadius: 20,
      background: s.bg, border: `1px solid ${s.color}30`,
      fontSize: 10, color: s.color, fontFamily: 'inherit',
    }}>
      <div style={{
        width: 5, height: 5, borderRadius: '50%', background: s.color, flexShrink: 0,
        boxShadow: status === 'connected' ? `0 0 5px ${s.color}` : 'none',
        animation: status === 'connecting' ? 'devPulse 1s ease-in-out infinite' : 'none',
      }}/>
      {s.label}
    </div>
  );
}

// ─── Floating trigger button (bottom-left of rail) ────────────────────────────

function PanelTrigger({ open, onClick, status, t }: {
  open: boolean; onClick: () => void; status: string; t: TTokens;
}) {
  const [hov, setHov] = useState(false);
  const hasIssue = status !== 'connected' && status !== 'connecting';

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={open ? 'Закрыть панель (Ctrl+Shift+D)' : 'Админ Панель (Ctrl+Shift+D)'}
      style={{
        position: 'fixed',
        left: 8, bottom: 70,
        zIndex: 99997,
        width: 48, height: 48,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 2,
        borderRadius: 12,
        border: `1px solid ${open || hov ? t.accentBorder : t.border}`,
        background: open
          ? t.accentSoft
          : hov
            ? t.surfaceHov
            : t.surface,
        color: open || hov ? t.accent : t.fgMuted,
        cursor: 'pointer',
        transition: 'all 0.16s ease',
        boxShadow: open || hov ? `0 4px 16px ${t.accent}30` : t.shadow2,
      }}
    >
      {hasIssue
        ? <AlertCircle size={16} style={{ color: t.danger }}/>
        : open
          ? <X size={16}/>
          : <UserCog size={16}/>
      }
      <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.04em', fontFamily: t.mono }}>
        ADMIN
      </span>
    </button>
  );
}

// ─── Main Panel (floating, like UnifiedSearchPanel) ───────────────────────────

export default function DevPanel() {
  const { status } = useDevBridge();
  const isDark = useIsDark();
  const t = React.useMemo(() => makeT(isDark), [isDark]);

  const [open, setOpen]         = useState(false);
  const [activeTab, setActiveTab] = useState('docs');

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault(); setOpen(v => !v); return;
      }
      if (open && e.ctrlKey && e.shiftKey && /^[1-3]$/.test(e.key)) {
        e.preventDefault();
        const tab = TABS[parseInt(e.key) - 1];
        if (tab) setActiveTab(tab.id);
      }
      if (open && e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const ActivePanel = TABS.find(t => t.id === activeTab)?.id === 'docs'
    ? DocsPanel
    : TABS.find(t => t.id === activeTab)?.id === 'contacts'
      ? ContactsPanel
      : AssetsPanel;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <ThemeTokensContext.Provider value={t}>
      <style>{`
        @keyframes devPulse { 0%,100%{opacity:1}50%{opacity:0.4} }
        @keyframes devSpinAnim { to { transform: rotate(360deg); } }
        @keyframes adminPanelIn {
          from { opacity:0; transform:translateY(-6px) scale(0.98); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        .admin-scroll::-webkit-scrollbar { width:4px; height:4px; }
        .admin-scroll::-webkit-scrollbar-track { background:transparent; }
        .admin-scroll::-webkit-scrollbar-thumb { background:rgba(128,128,128,0.25); border-radius:4px; }
      `}</style>

      <PanelTrigger open={open} onClick={() => setOpen(v => !v)} status={status} t={t} />

      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 99998,
              background: t.overlay,
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              animation: 'adminPanelIn 0.15s ease',
            }}
          />

          {/* Panel */}
          <div style={{
            position: 'fixed',
            top: '5vh',
            right: '24px',
            width: 'min(500px, calc(100vw - 48px))',
            height: '90vh',
            maxHeight: 860,
            zIndex: 99999,
            background: t.bg,
            border: `1px solid ${t.border}`,
            borderRadius: 16,
            boxShadow: t.shadow,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'adminPanelIn 0.18s cubic-bezier(.22,.61,.36,1)',
            fontFamily: t.mono,
          }}>
            {/* ── Header ── */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 16px 12px',
              background: t.surface,
              borderBottom: `1px solid ${t.border}`,
              flexShrink: 0,
            }}>
              {/* Icon */}
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: t.accentSoft,
                border: `1px solid ${t.accentBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <UserCog size={15} style={{ color: t.accent }}/>
              </div>

              {/* Title + status */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 13, fontWeight: 800, color: t.fg,
                    letterSpacing: '0.05em', fontFamily: t.mono,
                  }}>
                    АДМИН ПАНЕЛЬ
                  </span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, color: t.accent,
                    background: t.accentSoft, border: `1px solid ${t.accentBorder}`,
                    borderRadius: 4, padding: '1px 5px', letterSpacing: '0.1em',
                  }}>
                    DEV ONLY
                  </span>
                </div>
                <StatusPill status={status} t={t}/>
              </div>

              {/* Close */}
              <button
                onClick={() => setOpen(false)}
                title="Закрыть (Esc)"
                style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${t.border}`,
                  background: 'transparent', color: t.fgMuted, cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = t.surfaceHov;
                  (e.currentTarget as HTMLButtonElement).style.color = t.fg;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = t.fgMuted;
                }}
              >
                <X size={14}/>
              </button>
            </div>

            {/* ── Tab bar ── */}
            <div style={{
              display: 'flex',
              background: t.surface,
              borderBottom: `1px solid ${t.border}`,
              flexShrink: 0,
              padding: '0 8px',
            }}>
              {TABS.map(tab => {
                const isActive = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '10px 12px',
                      border: 'none',
                      borderBottom: `2px solid ${isActive ? t.accent : 'transparent'}`,
                      background: 'transparent',
                      color: isActive ? t.accent : t.fgMuted,
                      fontSize: 12, fontWeight: isActive ? 600 : 400,
                      cursor: 'pointer', fontFamily: t.mono,
                      transition: 'all 0.1s',
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.color = t.fg;
                        (e.currentTarget as HTMLButtonElement).style.background = t.surfaceHov;
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        (e.currentTarget as HTMLButtonElement).style.color = t.fgMuted;
                        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      }
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* ── Content area ── */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              {/* Disconnected overlay */}
              {status !== 'connected' && (
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 10,
                  background: isDark ? 'rgba(15,15,15,0.92)' : 'rgba(225,224,220,0.92)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 12,
                }}>
                  {status === 'connecting' ? (
                    <>
                      <Loader2 size={26} style={{ color: t.accent, animation: 'devSpinAnim 1s linear infinite' }}/>
                      <div style={{ fontSize: 13, color: t.fgMuted, textAlign: 'center' }}>
                        Подключение к dev-серверу...
                        <div style={{ fontSize: 11, color: t.fgSub, marginTop: 4 }}>ws://127.0.0.1:7777</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <WifiOff size={26} style={{ color: t.danger, opacity: 0.7 }}/>
                      <div style={{ fontSize: 13, color: t.fgMuted, textAlign: 'center' }}>
                        Нет соединения
                        <div style={{ fontSize: 11, color: t.fgSub, marginTop: 4 }}>Запусти `astro dev`</div>
                      </div>
                      <button
                        onClick={() => window.location.reload()}
                        style={{
                          padding: '7px 16px', borderRadius: 8, cursor: 'pointer',
                          border: `1px solid ${t.accentBorder}`,
                          background: t.accentSoft, color: t.accent,
                          fontSize: 12, fontFamily: t.mono,
                        }}
                      >
                        Переподключиться
                      </button>
                    </>
                  )}
                </div>
              )}

              <Suspense fallback={
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: t.fgSub, fontSize: 13 }}>
                  <Loader2 size={16} style={{ animation: 'devSpinAnim 1s linear infinite' }}/>
                  Загрузка...
                </div>
              }>
                {activeTab === 'docs'     && <DocsPanel />}
                {activeTab === 'contacts' && <ContactsPanel />}
                {activeTab === 'assets'   && <AssetsPanel />}
              </Suspense>
            </div>

            {/* ── Footer shortcuts ── */}
            <div style={{
              borderTop: `1px solid ${t.border}`,
              padding: '6px 16px',
              display: 'flex', alignItems: 'center', gap: 14,
              flexShrink: 0,
              background: t.surface,
            }}>
              {[
                { keys: ['Ctrl', 'Shift', 'D'], label: 'панель' },
                { keys: ['Ctrl', 'S'],           label: 'сохранить' },
                { keys: ['Esc'],                  label: 'закрыть' },
              ].map(({ keys, label }) => (
                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: t.fgSub }}>
                  {keys.map(k => (
                    <kbd key={k} style={{
                      background: t.kbd, border: `1px solid ${t.kbdBorder}`,
                      borderRadius: 4, padding: '1px 5px',
                      fontFamily: t.mono, fontSize: 10, color: t.fgMuted,
                    }}>{k}</kbd>
                  ))}
                  {label}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      <ToastContainer />
    </ThemeTokensContext.Provider>,
    document.body
  );
}

export { makeT as default_makeT };