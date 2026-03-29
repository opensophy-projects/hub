import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { createPortal } from 'react-dom';
import { useDevBridge } from './useDevBridge';
import { ToastContainer } from './components/Toast';
import { FileText, Users, Image, X, UserCog, WifiOff, Loader2, AlertCircle } from 'lucide-react';

const DocsPanel     = lazy(() => import('./panels/DocsPanel'));
const ContactsPanel = lazy(() => import('./panels/ContactsPanel'));
const AssetsPanel   = lazy(() => import('./panels/AssetsPanel'));

// ─── Тема ────────────────────────────────────────────────────────────────────

export function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(() =>
    typeof document === 'undefined'
      ? true
      : document.documentElement.classList.contains('dark')
  );
  useEffect(() => {
    const onTheme   = (e: Event) =>
      setIsDark((e as CustomEvent<{ isDark: boolean }>).detail.isDark);
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'theme') setIsDark(e.newValue !== 'light');
    };
    globalThis.addEventListener('hub:theme-change', onTheme);
    globalThis.addEventListener('storage', onStorage);
    return () => {
      globalThis.removeEventListener('hub:theme-change', onTheme);
      globalThis.removeEventListener('storage', onStorage);
    };
  }, []);
  return isDark;
}

export function makeT(isDark: boolean) {
  return isDark ? {
    bg:           '#111112',
    surface:      '#18181a',
    surfaceHov:   '#1f1f22',
    border:       'rgba(255,255,255,0.09)',
    borderStrong: 'rgba(255,255,255,0.18)',
    fg:           '#e8e8e8',
    fgMuted:      'rgba(255,255,255,0.4)',
    fgSub:        'rgba(255,255,255,0.2)',
    accent:       '#e8e8e8',
    accentSoft:   'rgba(255,255,255,0.06)',
    accentBorder: 'rgba(255,255,255,0.2)',
    success:      '#22c55e',
    danger:       '#ef4444',
    warning:      '#f59e0b',
    mono:         'ui-monospace, "Cascadia Code", "Fira Code", monospace',
    shadow:       '0 8px 40px rgba(0,0,0,0.7)',
    inpBg:        '#1e1e20',
    inpBorder:    'rgba(255,255,255,0.12)',
    editorBg:     '#0d0d0e',
    editorFg:     '#e2e8f0',
  } : {
    bg:           '#f0efeb',
    surface:      '#e5e4e0',
    surfaceHov:   '#dddcd8',
    border:       'rgba(0,0,0,0.1)',
    borderStrong: 'rgba(0,0,0,0.2)',
    fg:           '#111111',
    fgMuted:      'rgba(0,0,0,0.45)',
    fgSub:        'rgba(0,0,0,0.25)',
    accent:       '#111111',
    accentSoft:   'rgba(0,0,0,0.06)',
    accentBorder: 'rgba(0,0,0,0.25)',
    success:      '#16a34a',
    danger:       '#dc2626',
    warning:      '#d97706',
    mono:         'ui-monospace, "Cascadia Code", "Fira Code", monospace',
    shadow:       '0 8px 32px rgba(0,0,0,0.18)',
    inpBg:        '#e8e7e3',
    inpBorder:    'rgba(0,0,0,0.12)',
    editorBg:     '#eceae5',
    editorFg:     '#1e293b',
  };
}

export type TTokens = ReturnType<typeof makeT>;
export const ThemeTokensContext = React.createContext<TTokens>(makeT(true));

// ─── Табы (без Сайта) ────────────────────────────────────────────────────────

const TABS = [
  { id: 'docs',     label: 'Страницы',  icon: <FileText size={13}/> },
  { id: 'contacts', label: 'Контакты',  icon: <Users size={13}/>    },
  { id: 'assets',   label: 'Ассеты',    icon: <Image size={13}/>    },
];

// ─── Размеры панели ───────────────────────────────────────────────────────────

const MIN_W = 380;
const MAX_W = 900;
const MIN_H = 280;
const MAX_H_MARGIN = 40;

// ─── Типы drag/resize ─────────────────────────────────────────────────────────

type InteractMode =
  | 'drag'
  | 'resize-r' | 'resize-l' | 'resize-b' | 'resize-t'
  | 'resize-rb' | 'resize-lb' | 'resize-rt' | 'resize-lt'
  | null;

function getCursor(mode: InteractMode): string {
  switch (mode) {
    case 'drag':                    return 'move';
    case 'resize-r': case 'resize-l': return 'col-resize';
    case 'resize-b': case 'resize-t': return 'row-resize';
    case 'resize-rb': case 'resize-lt': return 'nwse-resize';
    case 'resize-lb': case 'resize-rt': return 'nesw-resize';
    default:                         return '';
  }
}

interface PanelRect { x: number; y: number; w: number; h: number; }

function clampRect(r: PanelRect): PanelRect {
  const maxH = globalThis.innerHeight - MAX_H_MARGIN;
  const w = Math.max(MIN_W, Math.min(MAX_W, r.w));
  const h = Math.max(MIN_H, Math.min(maxH, r.h));
  const x = Math.max(0, Math.min(globalThis.innerWidth - w, r.x));
  const y = Math.max(0, Math.min(globalThis.innerHeight - 60, r.y));
  return { x, y, w, h };
}

// ─── Хелперы статуса ─────────────────────────────────────────────────────────

function statusColor(status: string, success: string, warning: string, danger: string): string {
  if (status === 'connected')  return success;
  if (status === 'connecting') return warning;
  return danger;
}

function statusLabel(status: string): string {
  if (status === 'connected')  return 'Подключено';
  if (status === 'connecting') return 'Подключение...';
  return 'Отключено';
}

// ─── Trigger button ───────────────────────────────────────────────────────────

function PanelTrigger({ open, onClick, status, t }: Readonly<{
  open: boolean; onClick: () => void; status: string; t: TTokens;
}>) {
  const hasIssue = status !== 'connected' && status !== 'connecting';
  return (
    <button
      onClick={onClick}
      title="Админ Панель (Ctrl+Shift+D)"
      style={{
        position: 'fixed', left: 8, bottom: 70, zIndex: 99997,
        width: 44, height: 44,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 2,
        borderRadius: 10, border: `1px solid ${t.border}`,
        background: open ? t.surfaceHov : t.surface,
        color: t.fgMuted, cursor: 'pointer', boxShadow: t.shadow,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = t.surfaceHov; e.currentTarget.style.color = t.fg; }}
      onMouseLeave={e => { e.currentTarget.style.background = open ? t.surfaceHov : t.surface; e.currentTarget.style.color = t.fgMuted; }}
    >
      {hasIssue
        ? <AlertCircle size={15} style={{ color: t.danger }}/>
        : <UserCog size={15}/>
      }
      <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.05em', fontFamily: t.mono }}>ADMIN</span>
    </button>
  );
}

// ─── Главный компонент ────────────────────────────────────────────────────────

export default function DevPanel() {
  const { status } = useDevBridge();
  const isDark     = useIsDark();
  const t          = React.useMemo(() => makeT(isDark), [isDark]);

  const [open, setOpen] = useState(false);
  const [tab,  setTab]  = useState('docs');
  const [rect, setRect] = useState<PanelRect>({ x: 16, y: 40, w: 520, h: 600 });

  const interacting = useRef<InteractMode>(null);
  const startData   = useRef({ mx: 0, my: 0, rect: { x: 0, y: 0, w: 0, h: 0 } });

  const openPanel = () => {
    setRect(r => ({
      ...r,
      w: Math.min(520, globalThis.innerWidth - 32),
      h: Math.min(820, globalThis.innerHeight - 56),
    }));
    setOpen(true);
  };

  const startInteract = (mode: InteractMode, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    interacting.current = mode;
    startData.current   = { mx: e.clientX, my: e.clientY, rect: { ...rect } };
    document.body.style.userSelect = 'none';
    document.body.style.cursor     = getCursor(mode);
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const mode = interacting.current;
      if (!mode) return;
      const d  = startData.current;
      const dx = e.clientX - d.mx;
      const dy = e.clientY - d.my;
      const maxH = globalThis.innerHeight - MAX_H_MARGIN;

      setRect(() => {
        let { x, y, w, h } = d.rect;
        switch (mode) {
          case 'drag':
            x = d.rect.x + dx;
            y = d.rect.y + dy;
            break;
          case 'resize-r':  w = d.rect.w + dx; break;
          case 'resize-l':  w = d.rect.w - dx; x = d.rect.x + d.rect.w - Math.max(MIN_W, Math.min(MAX_W, w)); break;
          case 'resize-b':  h = d.rect.h + dy; break;
          case 'resize-t':  h = d.rect.h - dy; y = d.rect.y + d.rect.h - Math.max(MIN_H, Math.min(maxH, h)); break;
          case 'resize-rb': w = d.rect.w + dx; h = d.rect.h + dy; break;
          case 'resize-lb': w = d.rect.w - dx; x = d.rect.x + d.rect.w - Math.max(MIN_W, Math.min(MAX_W, w)); h = d.rect.h + dy; break;
          case 'resize-rt': w = d.rect.w + dx; h = d.rect.h - dy; y = d.rect.y + d.rect.h - Math.max(MIN_H, Math.min(maxH, h)); break;
          case 'resize-lt': w = d.rect.w - dx; x = d.rect.x + d.rect.w - Math.max(MIN_W, Math.min(MAX_W, w)); h = d.rect.h - dy; y = d.rect.y + d.rect.h - Math.max(MIN_H, Math.min(maxH, h)); break;
        }
        return clampRect({ x, y, w, h });
      });
    };

    const onUp = () => {
      interacting.current        = null;
      document.body.style.userSelect = '';
      document.body.style.cursor     = '';
    };

    globalThis.addEventListener('mousemove', onMove);
    globalThis.addEventListener('mouseup',   onUp);
    return () => {
      globalThis.removeEventListener('mousemove', onMove);
      globalThis.removeEventListener('mouseup',   onUp);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        if (open) setOpen(false); else openPanel();
      }
      if (open && e.key === 'Escape') setOpen(false);
    };
    globalThis.addEventListener('keydown', onKey);
    return () => globalThis.removeEventListener('keydown', onKey);
  }, [open]);

  if (typeof document === 'undefined') return null;

  const dotClr = statusColor(status, t.success, t.warning, t.danger);

  // Resize handle helper
  const rh = (style: React.CSSProperties, mode: InteractMode) => (
    <div
      key={String(mode)}
      onMouseDown={e => startInteract(mode, e)}
      style={{ position: 'absolute', zIndex: 10, ...style }}
    />
  );

  return createPortal(
    <ThemeTokensContext.Provider value={t}>
      <style>{`
        @keyframes devPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes devSpin   { to{transform:rotate(360deg)} }
        .adm-scroll::-webkit-scrollbar       { width:4px; height:4px }
        .adm-scroll::-webkit-scrollbar-track { background:transparent }
        .adm-scroll::-webkit-scrollbar-thumb { background:rgba(128,128,128,0.2); border-radius:4px }
      `}</style>

      <PanelTrigger
        open={open}
        onClick={() => open ? setOpen(false) : openPanel()}
        status={status}
        t={t}
      />

      {open && (
        <div style={{
          position: 'fixed',
          left:   rect.x,
          top:    rect.y,
          width:  rect.w,
          height: rect.h,
          zIndex: 99999,
          background:   t.bg,
          border:       `1px solid ${t.borderStrong}`,
          borderRadius: 12,
          boxShadow:    t.shadow,
          display:      'flex',
          flexDirection:'column',
          overflow:     'hidden',
          fontFamily:   t.mono,
        }}>

          {/* ── Шапка (drag по всей области заголовка) ─────────────────────── */}
          <header
            onMouseDown={e => {
              if ((e.target as HTMLElement).closest('button')) return;
              startInteract('drag', e);
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px 9px',
              background: t.surface,
              borderBottom: `1px solid ${t.border}`,
              flexShrink: 0,
              userSelect: 'none',
              cursor: 'move',
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 7, flexShrink: 0,
              background: t.accentSoft, border: `1px solid ${t.border}`,
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <div style={{
                  width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                  background: dotClr,
                  boxShadow: status === 'connected' ? `0 0 4px ${t.success}` : 'none',
                  animation: status === 'connecting' ? 'devPulse 1s ease-in-out infinite' : 'none',
                }}/>
                <span style={{ fontSize: 9, color: status === 'connected' ? t.success : t.fgSub }}>
                  {statusLabel(status)}
                </span>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              style={{
                width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${t.border}`, background: 'transparent',
                color: t.fgMuted, cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = t.surfaceHov; e.currentTarget.style.color = t.fg; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.fgMuted; }}
            >
              <X size={13}/>
            </button>
          </header>

          {/* ── Табы ──────────────────────────────────────────────────────── */}
          <div style={{
            display: 'flex', background: t.surface,
            borderBottom: `1px solid ${t.border}`,
            flexShrink: 0, padding: '0 4px',
          }}>
            {TABS.map(tb => {
              const active = tb.id === tab;
              return (
                <button
                  key={tb.id}
                  onMouseDown={e => { e.preventDefault(); setTab(tb.id); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '9px 12px', border: 'none',
                    borderBottom: `2px solid ${active ? t.fg : 'transparent'}`,
                    background: 'transparent',
                    color: active ? t.fg : t.fgMuted,
                    fontSize: 11, fontWeight: active ? 600 : 400,
                    cursor: 'pointer', fontFamily: t.mono,
                    flexShrink: 0, outline: 'none',
                  }}
                >
                  {tb.icon}{tb.label}
                </button>
              );
            })}
          </div>

          {/* ── Контент ───────────────────────────────────────────────────── */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {status !== 'connected' && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 10,
                background: isDark ? 'rgba(17,17,18,0.93)' : 'rgba(240,239,235,0.93)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 10,
              }}>
                {status === 'connecting' ? (
                  <>
                    <Loader2 size={22} style={{ color: t.fgMuted, animation: 'devSpin 1s linear infinite' }}/>
                    <div style={{ fontSize: 12, color: t.fgMuted }}>Подключение...</div>
                  </>
                ) : (
                  <>
                    <WifiOff size={22} style={{ color: t.danger }}/>
                    <div style={{ fontSize: 12, color: t.fgMuted }}>Нет соединения. Запусти `astro dev`</div>
                    <button
                      onClick={() => globalThis.location.reload()}
                      style={{
                        padding: '6px 14px', borderRadius: 7, cursor: 'pointer',
                        border: `1px solid ${t.border}`, background: t.surfaceHov,
                        color: t.fg, fontSize: 11, fontFamily: t.mono,
                      }}
                    >
                      Обновить
                    </button>
                  </>
                )}
              </div>
            )}

            <Suspense fallback={
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: t.fgSub, fontSize: 12 }}>
                <Loader2 size={14} style={{ animation: 'devSpin 1s linear infinite' }}/> Загрузка...
              </div>
            }>
              {tab === 'docs'     && <DocsPanel/>}
              {tab === 'contacts' && <ContactsPanel/>}
              {tab === 'assets'   && <AssetsPanel/>}
            </Suspense>
          </div>

          {/* ── Resize handles (все 8 направлений) ──────────────────────── */}
          {rh({ right: 0,  top: 8,    bottom: 8,  width: 6,  cursor: 'col-resize'  }, 'resize-r')}
          {rh({ left: 0,   top: 8,    bottom: 8,  width: 6,  cursor: 'col-resize'  }, 'resize-l')}
          {rh({ bottom: 0, left: 8,   right: 8,   height: 6, cursor: 'row-resize'  }, 'resize-b')}
          {rh({ top: 0,    left: 8,   right: 8,   height: 6, cursor: 'row-resize'  }, 'resize-t')}
          {rh({ bottom: 0, right: 0,  width: 14,  height: 14, cursor: 'nwse-resize'}, 'resize-rb')}
          {rh({ bottom: 0, left: 0,   width: 14,  height: 14, cursor: 'nesw-resize'}, 'resize-lb')}
          {rh({ top: 0,    right: 0,  width: 14,  height: 14, cursor: 'nesw-resize'}, 'resize-rt')}
          {rh({ top: 0,    left: 0,   width: 14,  height: 14, cursor: 'nwse-resize'}, 'resize-lt')}
        </div>
      )}

      <ToastContainer/>
    </ThemeTokensContext.Provider>,
    document.body
  );
}