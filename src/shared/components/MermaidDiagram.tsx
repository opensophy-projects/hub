import React, {
  useEffect,
  useRef,
  useState,
  useContext,
  useCallback,
  startTransition,
} from 'react';
import { createPortal } from 'react-dom';
import { TableContext } from '../lib/htmlParser';
import { Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut, Hand, Move } from 'lucide-react';

interface MermaidDiagramProps {
  code: string;
  color?: string;
  isDark?: boolean;
}

// ─── Design tokens — unified with CodeBlock / TableControlsBar ────────────────

function tk(isDark: boolean) {
  return isDark ? {
    outerBg:     '#0a0a0a',
    barBg:       '#111111',
    outerBorder: 'rgba(255,255,255,0.08)',
    barBorder:   'rgba(255,255,255,0.08)',
    btnBg:       'rgba(255,255,255,0.08)',
    btnBdr:      'rgba(255,255,255,0.12)',
    btnHov:      'rgba(255,255,255,0.14)',
    btnClr:      'rgba(255,255,255,0.72)',
    btnActBg:    'rgba(255,255,255,0.15)',
    btnActBdr:   'rgba(255,255,255,0.22)',
    btnActClr:   '#ffffff',
    fgMuted:     'rgba(255,255,255,0.35)',
    footerClr:   'rgba(255,255,255,0.22)',
    outerShadow: '0 2px 12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
    modalShadow: '0 24px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.05)',
    errorBg:     'rgba(239,68,68,0.1)',
    errorClr:    '#f87171',
  } : {
    outerBg:     '#E8E7E3',
    barBg:       '#d8d7d3',
    outerBorder: 'rgba(0,0,0,0.1)',
    barBorder:   'rgba(0,0,0,0.09)',
    btnBg:       'rgba(0,0,0,0.07)',
    btnBdr:      'rgba(0,0,0,0.12)',
    btnHov:      'rgba(0,0,0,0.12)',
    btnClr:      'rgba(0,0,0,0.68)',
    btnActBg:    'rgba(0,0,0,0.12)',
    btnActBdr:   'rgba(0,0,0,0.22)',
    btnActClr:   '#000000',
    fgMuted:     'rgba(0,0,0,0.38)',
    footerClr:   'rgba(0,0,0,0.32)',
    outerShadow: '0 1px 6px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.07)',
    modalShadow: '0 24px 80px rgba(0,0,0,0.2)',
    errorBg:     'rgba(239,68,68,0.08)',
    errorClr:    '#dc2626',
  };
}

// ─── Pill button — same as CodeBlock ─────────────────────────────────────────

interface PillProps {
  onClick: () => void;
  title: string;
  label: string;
  icon: React.ReactNode;
  t: ReturnType<typeof tk>;
  active?: boolean;
}

function Pill({ onClick, title, label, icon, t, active }: PillProps) {
  const bg    = active ? t.btnActBg  : t.btnBg;
  const bdr   = active ? t.btnActBdr : t.btnBdr;
  const color = active ? t.btnActClr : t.btnClr;
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 3,
        padding: '5px 12px', minWidth: 52, height: 44,
        borderRadius: 8, border: `1px solid ${bdr}`,
        background: bg, color, cursor: 'pointer', flexShrink: 0,
        transition: 'background 0.13s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = t.btnHov; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = bg; }}
    >
      {icon}
      <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, whiteSpace: 'nowrap', lineHeight: 1 }}>
        {label}
      </span>
    </button>
  );
}

// ─── Scale badge ──────────────────────────────────────────────────────────────

function ScaleBadge({ scale, t }: { scale: number; t: ReturnType<typeof tk> }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, minWidth: 40, textAlign: 'center',
      color: t.fgMuted, fontFamily: 'ui-monospace, monospace', flexShrink: 0,
    }}>
      {Math.round(scale * 100)}%
    </span>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider({ t }: { t: ReturnType<typeof tk> }) {
  return (
    <div style={{
      width: 1, height: 22,
      background: t.barBorder,
      margin: '0 2px', flexShrink: 0,
    }} />
  );
}

// ─── Mermaid singleton ────────────────────────────────────────────────────────

type MermaidType = Awaited<ReturnType<typeof import('mermaid')>>['default'];
let mermaidModule: MermaidType | null = null;

async function getMermaid(): Promise<MermaidType> {
  if (!mermaidModule) {
    mermaidModule = await import('mermaid').then((m) => m.default);
  }
  return mermaidModule;
}

let globalIdCounter = 0;
function nextId() { return `mermaid-${++globalIdCounter}`; }

const svgCache = new Map<string, string>();
function cacheKey(code: string, isDark: boolean, color?: string) {
  return `${isDark ? 'dark' : 'light'}::${color ?? ''}::${code}`;
}

// ─── SVG attribute patcher ────────────────────────────────────────────────────

function removeSvgAttr(svgTag: string, attr: string): string {
  let result = svgTag;
  const patterns = [` ${attr}="`, ` ${attr}='`];
  for (const pattern of patterns) {
    let start = result.indexOf(pattern);
    while (start !== -1) {
      const quoteChar = pattern[pattern.length - 1];
      const valueEnd = result.indexOf(quoteChar, start + pattern.length);
      if (valueEnd === -1) break;
      result = result.slice(0, start) + result.slice(valueEnd + 1);
      start = result.indexOf(pattern);
    }
  }
  return result;
}

function patchSvg(svg: string): string {
  const tagEnd = svg.indexOf('>');
  if (tagEnd === -1) return svg;
  let tag = svg.slice(0, tagEnd + 1);
  tag = removeSvgAttr(tag, 'width');
  tag = removeSvgAttr(tag, 'height');
  tag = removeSvgAttr(tag, 'style');
  const style = ' style="width:100%;max-width:800px;height:auto;display:block;overflow:visible;margin:0 auto;"';
  if (tag.startsWith('<svg')) tag = `<svg${style}${tag.slice(4)}`;
  return tag + svg.slice(tagEnd + 1);
}

// ─── Mermaid theme config ─────────────────────────────────────────────────────

function getMermaidConfig(isDark: boolean, color?: string) {
  const darkVars = {
    primaryColor: '#1a1a2e', primaryTextColor: '#e8e8e8',
    primaryBorderColor: color || 'rgba(255,255,255,0.25)',
    lineColor: 'rgba(255,255,255,0.5)', secondaryColor: '#16213e',
    tertiaryColor: '#1a1a2e', background: '#0a0a0a',
    mainBkg: '#131320', nodeBorder: color || 'rgba(255,255,255,0.3)',
    clusterBkg: 'rgba(255,255,255,0.05)', clusterBorder: 'rgba(255,255,255,0.15)',
    titleColor: '#e8e8e8', edgeLabelBackground: '#0f0f18',
    textColor: '#e8e8e8', labelTextColor: '#e8e8e8',
    actorBkg: '#1a1a2e', actorBorder: color || 'rgba(255,255,255,0.25)',
    actorTextColor: '#e8e8e8', actorLineColor: 'rgba(255,255,255,0.4)',
    signalColor: 'rgba(255,255,255,0.8)', signalTextColor: '#e8e8e8',
    gridColor: 'rgba(255,255,255,0.1)',
    section0: '#1a1a2e', section1: '#131320',
    taskBkgColor: color || '#1e3a5f',
    taskBorderColor: color || 'rgba(255,255,255,0.25)',
    taskTextColor: '#e8e8e8', taskTextOutsideColor: '#e8e8e8',
  };
  const lightVars = {
    primaryColor: '#e8e7f0', primaryTextColor: '#1a1a2e',
    primaryBorderColor: color || 'rgba(0,0,0,0.2)',
    lineColor: 'rgba(0,0,0,0.5)', secondaryColor: '#f0eff8',
    tertiaryColor: '#e0dff0', background: '#E8E7E3',
    mainBkg: '#eeecf8', nodeBorder: color || 'rgba(0,0,0,0.25)',
    clusterBkg: 'rgba(0,0,0,0.04)', clusterBorder: 'rgba(0,0,0,0.12)',
    titleColor: '#1a1a2e', edgeLabelBackground: '#f5f4fc',
    textColor: '#1a1a2e', labelTextColor: '#1a1a2e',
    actorBkg: '#eeecf8', actorBorder: color || 'rgba(0,0,0,0.2)',
    actorTextColor: '#1a1a2e', actorLineColor: 'rgba(0,0,0,0.4)',
    signalColor: 'rgba(0,0,0,0.7)', signalTextColor: '#1a1a2e',
    gridColor: 'rgba(0,0,0,0.1)',
    section0: '#eeecf8', section1: '#e4e2f4',
    taskBkgColor: color || '#c7d2fe',
    taskBorderColor: color || 'rgba(0,0,0,0.18)',
    taskTextColor: '#1a1a2e', taskTextOutsideColor: '#1a1a2e',
  };
  return {
    startOnLoad: false,
    theme: isDark ? 'dark' as const : 'default' as const,
    securityLevel: 'loose' as const,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    flowchart: { useMaxWidth: false, htmlLabels: true, curve: 'basis', padding: 20 },
    sequence: { useMaxWidth: false, boxMargin: 10 },
    gantt: { useMaxWidth: false, leftPadding: 75, barHeight: 28, fontSize: 13 },
    themeVariables: isDark ? darkVars : lightVars,
  };
}

// ─── DiagramViewer ────────────────────────────────────────────────────────────

const DiagramViewer: React.FC<{
  svgHtml: string; panMode: boolean;
  scale: number; setScale: React.Dispatch<React.SetStateAction<number>>;
  pos: { x: number; y: number }; setPos: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  isFullscreen?: boolean;
  maxHeight?: number;
}> = ({ svgHtml, panMode, scale, setScale, pos, setPos, isFullscreen, maxHeight = 480 }) => {
  const viewRef  = useRef<HTMLButtonElement>(null);
  const dragging = useRef(false);
  const last     = useRef({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!panMode || e.button !== 0) return;
    e.preventDefault();
    dragging.current = true; setIsDragging(true);
    last.current = { x: e.clientX, y: e.clientY };
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - last.current.x;
      const dy = ev.clientY - last.current.y;
      last.current = { x: ev.clientX, y: ev.clientY };
      setPos(p => ({ x: p.x + dx, y: p.y + dy }));
    };
    const onUp = () => {
      dragging.current = false; setIsDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [panMode, setPos]);

  useEffect(() => {
    const el = viewRef.current; if (!el || !panMode) return;
    let lt = { x: 0, y: 0 }; let ld = 0;
    const onTS = (e: TouchEvent) => {
      if (e.touches.length === 1) lt = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      else if (e.touches.length === 2) ld = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    };
    const onTM = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - lt.x;
        const dy = e.touches[0].clientY - lt.y;
        setPos(p => ({ x: p.x + dx, y: p.y + dy }));
        lt = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        setScale(s => Math.min(8, Math.max(0.25, s * (d / ld))));
        ld = d;
      }
    };
    el.addEventListener('touchstart', onTS, { passive: true });
    el.addEventListener('touchmove', onTM, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTS);
      el.removeEventListener('touchmove', onTM);
    };
  }, [panMode, setPos, setScale]);

  useEffect(() => {
    const el = viewRef.current; if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setScale(s => Math.min(8, Math.max(0.25, s * (e.deltaY > 0 ? 0.9 : 1.1))));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [setScale]);

  const cursor = panMode ? (isDragging ? 'grabbing' : 'grab') : 'default';

  return (
    <button
      ref={viewRef}
      aria-label="Diagram viewer"
      onMouseDown={onMouseDown}
      onKeyDown={(e) => {
        const s = 20;
        if (e.key === 'ArrowLeft')  setPos(p => ({ ...p, x: p.x - s }));
        if (e.key === 'ArrowRight') setPos(p => ({ ...p, x: p.x + s }));
        if (e.key === 'ArrowUp')    setPos(p => ({ ...p, y: p.y - s }));
        if (e.key === 'ArrowDown')  setPos(p => ({ ...p, y: p.y + s }));
      }}
      style={{
        overflow: 'hidden', position: 'relative', cursor,
        minHeight: isFullscreen ? '100%' : 80,
        maxHeight: isFullscreen ? undefined : maxHeight,
        height: isFullscreen ? '100%' : 'auto',
        userSelect: 'none', touchAction: 'none',
        outline: 'none', display: 'block', width: '100%',
        padding: 0, border: 'none', background: 'none', textAlign: 'left',
      }}
    >
      <div
        style={{
          transform: `translate(${pos.x}px,${pos.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.05s ease',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '20px 24px', willChange: 'transform',
        }}
        dangerouslySetInnerHTML={{ __html: svgHtml }}
      />
    </button>
  );
};

// ─── Toolbar row ──────────────────────────────────────────────────────────────

interface ToolbarProps {
  t: ReturnType<typeof tk>;
  scale: number;
  panMode: boolean;
  isFullscreen: boolean;
  hasColor: boolean;
  color?: string;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onTogglePan: () => void;
  onReset: () => void;
  onFullscreenToggle: () => void;
}

function ToolbarRow({
  t, scale, panMode, isFullscreen, hasColor, color,
  onZoomIn, onZoomOut, onTogglePan, onReset, onFullscreenToggle,
}: ToolbarProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '8px 10px',
      borderBottom: `1px solid ${t.barBorder}`,
      background: t.barBg,
      flexWrap: 'nowrap', minWidth: 0, flexShrink: 0,
    }}>
      {hasColor && (
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: color, marginRight: 4, flexShrink: 0,
        }} />
      )}

      <Pill onClick={onZoomIn}  title="Увеличить"  label="Увел." icon={<ZoomIn  size={14} />} t={t} />
      <Pill onClick={onZoomOut} title="Уменьшить"  label="Умен." icon={<ZoomOut size={14} />} t={t} />
      <ScaleBadge scale={scale} t={t} />

      <Divider t={t} />

      <Pill onClick={onTogglePan} title="Режим перемещения" label="Рука"   icon={<Hand  size={14} />} t={t} active={panMode} />
      <Pill onClick={onReset}     title="Сбросить вид"      label="Сброс"  icon={<Move  size={14} />} t={t} />

      <div style={{ flex: 1 }} />

      <Pill
        onClick={onFullscreenToggle}
        title={isFullscreen ? 'Свернуть (Esc)' : 'Развернуть'}
        label={isFullscreen ? 'Свернуть' : 'Развернуть'}
        icon={isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        t={t}
      />
    </div>
  );
}

// ─── Footer row ───────────────────────────────────────────────────────────────

function FooterRow({ t, label }: { t: ReturnType<typeof tk>; label: string }) {
  return (
    <div style={{
      padding: '6px 12px',
      borderTop: `1px solid ${t.barBorder}`,
      fontSize: 11, color: t.footerClr,
      display: 'flex', alignItems: 'center',
      userSelect: 'none', background: t.outerBg, flexShrink: 0,
    }}>
      {label}
    </div>
  );
}

// ─── MermaidDiagram ───────────────────────────────────────────────────────────

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code, color, isDark = false }) => {
  const t = tk(isDark);
  const [svgHtml,      setSvgHtml]      = useState('');
  const [status,       setStatus]       = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg,     setErrorMsg]     = useState('');
  const [panMode,      setPanMode]      = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale,        setScale]        = useState(1);
  const [pos,          setPos]          = useState({ x: 0, y: 0 });
  const [displayHtml,  setDisplayHtml]  = useState('');

  const resetView = useCallback(() => { setScale(1); setPos({ x: 0, y: 0 }); }, []);

  useEffect(() => {
    let cancelled = false;
    const key = cacheKey(code, isDark, color);

    if (svgCache.has(key)) {
      const cached = svgCache.get(key) ?? '';
      setSvgHtml(cached);
      setDisplayHtml(cached);
      setStatus('ready');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    (async () => {
      try {
        const mermaid = await getMermaid();
        if (cancelled) return;
        mermaid.initialize(getMermaidConfig(isDark, color));
        const { svg } = await mermaid.render(nextId(), code.trim());
        if (cancelled) return;
        const patched = patchSvg(svg);
        svgCache.set(key, patched);
        startTransition(() => {
          setSvgHtml(patched);
          setDisplayHtml(patched);
          setStatus('ready');
        });
      } catch (e: unknown) {
        if (cancelled) return;
        startTransition(() => {
          setErrorMsg(e instanceof Error ? e.message : 'Unknown error');
          setStatus('error');
        });
      }
    })();

    return () => { cancelled = true; };
  }, [code, color, isDark]);

  // Escape closes fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { setIsFullscreen(false); resetView(); } };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isFullscreen, resetView]);

  const hasAnyContent = displayHtml !== '';
  const hasColor = !!color;

  const toolbarProps: ToolbarProps = {
    t, scale, panMode, isFullscreen: false, hasColor, color,
    onZoomIn:    () => setScale(s => Math.min(8, +(s + 0.25).toFixed(2))),
    onZoomOut:   () => setScale(s => Math.max(0.25, +(s - 0.25).toFixed(2))),
    onTogglePan: () => setPanMode(v => !v),
    onReset:     resetView,
    onFullscreenToggle: () => setIsFullscreen(true),
  };

  const viewerProps = { svgHtml: displayHtml, panMode, scale, setScale, pos, setPos };

  // ── Fullscreen portal ─────────────────────────────────────────────────────
  const fullscreenPortal = isFullscreen ? createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: t.outerBg,
      display: 'flex', flexDirection: 'column',
    }}>
      <ToolbarRow
        {...toolbarProps}
        isFullscreen
        onFullscreenToggle={() => { setIsFullscreen(false); resetView(); }}
      />
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <DiagramViewer {...viewerProps} isFullscreen />
      </div>
      <FooterRow t={t} label="Mermaid диаграмма" />
    </div>,
    document.body,
  ) : null;

  // ── Normal view ───────────────────────────────────────────────────────────
  return (
    <>
      {fullscreenPortal}
      <div className="not-prose" style={{ margin: '1.25rem 0' }}>
        <div style={{
          borderRadius: 12,
          border: `1px solid ${(hasAnyContent || status === 'error') ? t.outerBorder : 'transparent'}`,
          background: (hasAnyContent || status === 'error') ? t.outerBg : 'transparent',
          boxShadow: (hasAnyContent || status === 'error') ? t.outerShadow : 'none',
          overflow: 'clip',
          display: 'flex', flexDirection: 'column',
          width: '100%', minWidth: 0,
          transition: 'background 0.15s, border-color 0.15s',
        }}>

          {/* Colour accent bar */}
          {hasColor && hasAnyContent && (
            <div style={{ height: 3, background: color, flexShrink: 0 }} />
          )}

          {/* Toolbar — show when ready OR re-rendering (has old SVG) */}
          {(status === 'ready' || (status === 'loading' && hasAnyContent)) && (
            <div style={{ opacity: status === 'loading' ? 0.6 : 1, transition: 'opacity 0.2s' }}>
              <ToolbarRow {...toolbarProps} />
            </div>
          )}

          {/* First-load spinner */}
          {status === 'loading' && !hasAnyContent && (
            <div style={{
              padding: '32px 24px', textAlign: 'center',
              fontSize: 13, color: t.footerClr,
            }}>
              <div style={{
                display: 'inline-block', width: 16, height: 16, borderRadius: '50%',
                border: `2px solid ${t.btnBdr}`,
                borderTopColor: t.btnClr,
                animation: 'mermaidSpin 0.7s linear infinite', marginBottom: 10,
              }} />
              <style>{`@keyframes mermaidSpin{to{transform:rotate(360deg)}}`}</style>
              <div>Загрузка диаграммы…</div>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div style={{ padding: '16px 20px', background: t.errorBg }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: t.errorClr,
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6,
              }}>
                Ошибка диаграммы
              </div>
              <pre style={{
                fontSize: 11, margin: 0, whiteSpace: 'pre-wrap',
                color: t.fgMuted, fontFamily: 'ui-monospace, monospace',
              }}>
                {errorMsg}
              </pre>
              <pre style={{
                marginTop: 10, padding: '8px 12px', borderRadius: 7, fontSize: 11,
                background: t.btnBg, color: t.fgMuted,
                fontFamily: 'ui-monospace, monospace', whiteSpace: 'pre-wrap',
              }}>
                {code}
              </pre>
            </div>
          )}

          {/* SVG viewer */}
          {hasAnyContent && status !== 'error' && (
            <>
              <div style={{
                opacity: status === 'loading' ? 0.5 : 1,
                transition: 'opacity 0.2s',
              }}>
                <DiagramViewer {...viewerProps} />
              </div>
              <FooterRow t={t} label="Mermaid диаграмма · Ctrl+Scroll для зума" />
            </>
          )}
        </div>
      </div>
    </>
  );
};

// ─── Context wrapper ──────────────────────────────────────────────────────────

const MermaidDiagramWithContext: React.FC<Omit<MermaidDiagramProps, 'isDark'>> = (props) => {
  const { isDark } = useContext(TableContext);
  return <MermaidDiagram {...props} isDark={isDark} />;
};

export { MermaidDiagram };
export default MermaidDiagramWithContext;