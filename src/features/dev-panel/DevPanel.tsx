/**
 * DevPanel v6
 * Fixes: no backdrop blur, draggable+resizable panel, no purple accent,
 * tabs don't go grey on click, no footer kbd hints, proper light theme
 */

import React, {
  useState, useEffect, useRef, useCallback, Suspense, lazy,
} from 'react';
import { createPortal } from 'react-dom';
import { useDevBridge } from './useDevBridge';
import { ToastContainer } from './components/Toast';
import { FileText, Users, Image, Globe, X, UserCog, WifiOff, Loader2, AlertCircle } from 'lucide-react';

const DocsPanel     = lazy(() => import('./panels/DocsPanel'));
const ContactsPanel = lazy(() => import('./panels/ContactsPanel'));
const AssetsPanel   = lazy(() => import('./panels/AssetsPanel'));
const SitePanel     = lazy(() => import('./panels/SitePanel'));

// ─── Theme ────────────────────────────────────────────────────────────────────

export function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : true
  );
  useEffect(() => {
    const a = (e: Event) => setIsDark((e as CustomEvent<{ isDark: boolean }>).detail.isDark);
    const b = (e: StorageEvent) => { if (e.key === 'theme') setIsDark(e.newValue !== 'light'); };
    window.addEventListener('hub:theme-change', a);
    window.addEventListener('storage', b);
    return () => { window.removeEventListener('hub:theme-change', a); window.removeEventListener('storage', b); };
  }, []);
  return isDark;
}

export function makeT(isDark: boolean) {
  // No purple — use neutral whites/blacks with a single green accent for active state
  return isDark ? {
    bg:          '#111112',
    surface:     '#18181a',
    surfaceHov:  '#1f1f22',
    border:      'rgba(255,255,255,0.09)',
    borderStrong:'rgba(255,255,255,0.18)',
    fg:          '#e8e8e8',
    fgMuted:     'rgba(255,255,255,0.4)',
    fgSub:       'rgba(255,255,255,0.2)',
    accent:      '#e8e8e8',       // white — used for active tab text/border
    accentSoft:  'rgba(255,255,255,0.06)',
    accentBorder:'rgba(255,255,255,0.2)',
    success:     '#22c55e',
    danger:      '#ef4444',
    warning:     '#f59e0b',
    mono:        'ui-monospace, "Cascadia Code", "Fira Code", monospace',
    shadow:      '0 8px 40px rgba(0,0,0,0.7)',
    inpBg:       '#1e1e20',
    inpBorder:   'rgba(255,255,255,0.12)',
    dragHandle:  'rgba(255,255,255,0.08)',
    dragHandleHov:'rgba(255,255,255,0.2)',
    editorBg:    '#0d0d0e',
    editorFg:    '#e2e8f0',
  } : {
    bg:          '#f0efeb',
    surface:     '#e5e4e0',
    surfaceHov:  '#dddcd8',
    border:      'rgba(0,0,0,0.1)',
    borderStrong:'rgba(0,0,0,0.2)',
    fg:          '#111111',
    fgMuted:     'rgba(0,0,0,0.45)',
    fgSub:       'rgba(0,0,0,0.25)',
    accent:      '#111111',       // black — used for active tab text/border
    accentSoft:  'rgba(0,0,0,0.06)',
    accentBorder:'rgba(0,0,0,0.25)',
    success:     '#16a34a',
    danger:      '#dc2626',
    warning:     '#d97706',
    mono:        'ui-monospace, "Cascadia Code", "Fira Code", monospace',
    shadow:      '0 8px 32px rgba(0,0,0,0.18)',
    inpBg:       '#e8e7e3',
    inpBorder:   'rgba(0,0,0,0.12)',
    dragHandle:  'rgba(0,0,0,0.1)',
    dragHandleHov:'rgba(0,0,0,0.3)',
    editorBg:    '#eceae5',
    editorFg:    '#1e293b',
  };
}

export type TTokens = ReturnType<typeof makeT>;
export const ThemeTokensContext = React.createContext<TTokens>(makeT(true));

const TABS = [
  { id: 'docs',     label: 'Страницы', icon: <FileText size={13}/> },
  { id: 'contacts', label: 'Контакты', icon: <Users size={13}/>    },
  { id: 'assets',   label: 'Ассеты',   icon: <Image size={13}/>    },
  { id: 'site',     label: 'Сайт',     icon: <Globe size={13}/>    },
];

// ─── Trigger button ───────────────────────────────────────────────────────────

function PanelTrigger({ open, onClick, status, t }: {
  open: boolean; onClick: () => void; status: string; t: TTokens;
}) {
  const hasIssue = status !== 'connected' && status !== 'connecting';
  return (
    <button onClick={onClick} title="Админ Панель (Ctrl+Shift+D)"
      style={{
        position: 'fixed', left: 8, bottom: 70, zIndex: 99997,
        width: 44, height: 44,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
        borderRadius: 10,
        border: `1px solid ${t.border}`,
        background: open ? t.surfaceHov : t.surface,
        color: t.fgMuted, cursor: 'pointer',
        boxShadow: t.shadow,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = t.surfaceHov; (e.currentTarget as HTMLButtonElement).style.color = t.fg; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = open ? t.surfaceHov : t.surface; (e.currentTarget as HTMLButtonElement).style.color = t.fgMuted; }}
    >
      {hasIssue ? <AlertCircle size={15} style={{ color: t.danger }}/> : <UserCog size={15}/>}
      <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.05em', fontFamily: t.mono }}>ADMIN</span>
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DevPanel() {
  const { status } = useDevBridge();
  const isDark = useIsDark();
  const t = React.useMemo(() => makeT(isDark), [isDark]);

  const [open, setOpen] = useState(false);
  const [tab, setTab]   = useState('docs');

  // Панель: right/top позиция + размер
  // Используем right чтобы панель гарантированно не уходила за правый край
  const [panelRight, setPanelRight] = useState(16);
  const [panelTop,   setPanelTop]   = useState(40);
  const [size, setSize] = useState({ w: 520, h: 600 });

  const openPanel = () => {
    const w = Math.min(520, window.innerWidth - 32);
    const h = Math.min(820, window.innerHeight - 56);
    setSize({ w, h });
    setPanelRight(16);
    setPanelTop(40);
    setOpen(true);
  };

  const interacting = useRef<'drag'|'r'|'b'|'rb'|null>(null);
  const startData   = useRef({ mx:0, my:0, right:16, top:40, w:0, h:0 });

  const onDragStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    interacting.current = 'drag';
    startData.current = { mx: e.clientX, my: e.clientY, right: panelRight, top: panelTop, w: size.w, h: size.h };
    document.body.style.userSelect = 'none';
  };

  const onResizeStart = (e: React.MouseEvent, dir: 'r'|'b'|'rb') => {
    e.preventDefault(); e.stopPropagation();
    interacting.current = dir;
    startData.current = { mx: e.clientX, my: e.clientY, right: panelRight, top: panelTop, w: size.w, h: size.h };
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = startData.current;
      const mode = interacting.current;
      if (!mode) return;
      const dx = e.clientX - d.mx;
      const dy = e.clientY - d.my;

      if (mode === 'drag') {
        // Двигаем панель: right уменьшается при движении вправо
        const newRight = Math.max(0, Math.min(window.innerWidth - d.w, d.right - dx));
        const newTop   = Math.max(0, Math.min(window.innerHeight - 60, d.top + dy));
        setPanelRight(newRight);
        setPanelTop(newTop);
      } else {
        // Resize: правый хэндл (left edge) — тянем влево = шире
        if (mode === 'r' || mode === 'rb')
          setSize(s => ({ ...s, w: Math.max(380, Math.min(window.innerWidth - 32, d.w - dx)) }));
        if (mode === 'b' || mode === 'rb')
          setSize(s => ({ ...s, h: Math.max(300, Math.min(window.innerHeight - 40, d.h + dy)) }));
      }
    };
    const onUp = () => {
      interacting.current = null;
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
  }, []);

  // Keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') { e.preventDefault(); if (open) setOpen(false); else openPanel(); }
      if (open && e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <ThemeTokensContext.Provider value={t}>
      <style>{`
        @keyframes devPulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes devSpinAnim{to{transform:rotate(360deg)}}
        .adm-scroll::-webkit-scrollbar{width:4px;height:4px}
        .adm-scroll::-webkit-scrollbar-track{background:transparent}
        .adm-scroll::-webkit-scrollbar-thumb{background:rgba(128,128,128,0.2);border-radius:4px}
      `}</style>

      <PanelTrigger open={open} onClick={() => open ? setOpen(false) : openPanel()} status={status} t={t}/>

      {open && (
        <div style={{
          position: 'fixed',
          right: panelRight, top: panelTop,
          width: size.w, height: size.h,
          zIndex: 99999,
          background: t.bg,
          border: `1px solid ${t.borderStrong}`,
          borderRadius: 12,
          boxShadow: t.shadow,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: t.mono,
        }}>

          {/* ── Header (drag handle) ── */}
          <div
            onMouseDown={onDragStart}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px 9px',
              background: t.surface,
              borderBottom: `1px solid ${t.border}`,
              flexShrink: 0,
              cursor: 'move',
              userSelect: 'none',
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 7, flexShrink: 0,
              background: t.accentSoft,
              border: `1px solid ${t.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <UserCog size={13} style={{ color: t.fg }}/>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: t.fg, letterSpacing: '0.06em' }}>
                  АДМИН ПАНЕЛЬ
                </span>
                <span style={{
                  fontSize: 8, fontWeight: 700, color: t.fgMuted,
                  background: t.accentSoft, border: `1px solid ${t.border}`,
                  borderRadius: 3, padding: '1px 5px', letterSpacing: '0.1em',
                }}>
                  DEV ONLY
                </span>
              </div>
              {/* Status inline */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <div style={{
                  width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                  background: status === 'connected' ? '#22c55e' : status === 'connecting' ? '#f59e0b' : '#ef4444',
                  boxShadow: status === 'connected' ? '0 0 4px #22c55e' : 'none',
                  animation: status === 'connecting' ? 'devPulse 1s ease-in-out infinite' : 'none',
                }}/>
                <span style={{ fontSize: 9, color: status === 'connected' ? '#22c55e' : t.fgSub }}>
                  {status === 'connected' ? 'Подключено' : status === 'connecting' ? 'Подключение...' : 'Отключено'}
                </span>
              </div>
            </div>

            <button onClick={() => setOpen(false)} style={{
              width: 26, height: 26, borderRadius: 6, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${t.border}`, background: 'transparent', color: t.fgMuted, cursor: 'pointer',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = t.surfaceHov; (e.currentTarget as HTMLButtonElement).style.color = t.fg; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = t.fgMuted; }}
            >
              <X size={13}/>
            </button>
          </div>

          {/* ── Tabs ── */}
          <div style={{
            display: 'flex',
            background: t.surface,
            borderBottom: `1px solid ${t.border}`,
            flexShrink: 0,
            padding: '0 4px',
          }}>
            {TABS.map(tb => {
              const active = tb.id === tab;
              return (
                <button
                  key={tb.id}
                  // Use onMouseDown to prevent losing active state on click
                  onMouseDown={e => { e.preventDefault(); setTab(tb.id); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '9px 12px',
                    border: 'none',
                    borderBottom: `2px solid ${active ? t.fg : 'transparent'}`,
                    background: 'transparent',
                    color: active ? t.fg : t.fgMuted,
                    fontSize: 11, fontWeight: active ? 600 : 400,
                    cursor: 'pointer', fontFamily: t.mono,
                    flexShrink: 0,
                    outline: 'none',
                  }}
                >
                  {tb.icon}
                  {tb.label}
                </button>
              );
            })}
          </div>

          {/* ── Content ── */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {status !== 'connected' && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 10,
                background: isDark ? 'rgba(17,17,18,0.93)' : 'rgba(240,239,235,0.93)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}>
                {status === 'connecting' ? (
                  <>
                    <Loader2 size={22} style={{ color: t.fgMuted, animation: 'devSpinAnim 1s linear infinite' }}/>
                    <div style={{ fontSize: 12, color: t.fgMuted }}>Подключение...</div>
                  </>
                ) : (
                  <>
                    <WifiOff size={22} style={{ color: t.danger }}/>
                    <div style={{ fontSize: 12, color: t.fgMuted }}>Нет соединения. Запусти `astro dev`</div>
                    <button onClick={() => window.location.reload()} style={{
                      padding: '6px 14px', borderRadius: 7, cursor: 'pointer',
                      border: `1px solid ${t.border}`, background: t.surfaceHov, color: t.fg,
                      fontSize: 11, fontFamily: t.mono,
                    }}>Обновить</button>
                  </>
                )}
              </div>
            )}

            <Suspense fallback={
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: t.fgSub, fontSize: 12 }}>
                <Loader2 size={14} style={{ animation: 'devSpinAnim 1s linear infinite' }}/> Загрузка...
              </div>
            }>
              {tab === 'docs'     && <DocsPanel/>}
              {tab === 'contacts' && <ContactsPanel/>}
              {tab === 'assets'   && <AssetsPanel/>}
              {tab === 'site'     && <SitePanel/>}
            </Suspense>
          </div>

          {/* ── Resize handles ── */}
          {/* Right edge */}
          <div onMouseDown={e => onResizeStart(e, 'r')} style={{
            position: 'absolute', right: 0, top: 40, bottom: 8,
            width: 6, cursor: 'col-resize', zIndex: 10,
          }}/>
          {/* Bottom edge */}
          <div onMouseDown={e => onResizeStart(e, 'b')} style={{
            position: 'absolute', bottom: 0, left: 8, right: 8,
            height: 6, cursor: 'row-resize', zIndex: 10,
          }}/>
          {/* Corner */}
          <div onMouseDown={e => onResizeStart(e, 'rb')} style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 14, height: 14, cursor: 'nwse-resize', zIndex: 11,
          }}/>
        </div>
      )}

      <ToastContainer/>
    </ThemeTokensContext.Provider>,
    document.body
  );
}