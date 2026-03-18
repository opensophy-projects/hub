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
import { tc } from '../lib/themeUtils';

interface MermaidDiagramProps {
  code: string;
  color?: string;
  isDark?: boolean;
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
    xyChart: {
      backgroundColor: 'transparent', titleColor: '#e8e8e8',
      xAxisTitleColor: '#e8e8e8', xAxisLabelColor: '#c0c0c0',
      xAxisTickColor: 'rgba(255,255,255,0.2)', xAxisLineColor: 'rgba(255,255,255,0.2)',
      yAxisTitleColor: '#e8e8e8', yAxisLabelColor: '#c0c0c0',
      yAxisTickColor: 'rgba(255,255,255,0.2)', yAxisLineColor: 'rgba(255,255,255,0.2)',
      plotColorPalette: '#3b82f6,#10b981,#f59e0b,#ef4444,#8b5cf6,#ec4899',
    },
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
    xyChart: {
      backgroundColor: 'transparent', titleColor: '#1a1a2e',
      xAxisTitleColor: '#1a1a2e', xAxisLabelColor: '#4a4a4a',
      xAxisTickColor: 'rgba(0,0,0,0.2)', xAxisLineColor: 'rgba(0,0,0,0.2)',
      yAxisTitleColor: '#1a1a2e', yAxisLabelColor: '#4a4a4a',
      yAxisTickColor: 'rgba(0,0,0,0.2)', yAxisLineColor: 'rgba(0,0,0,0.2)',
      plotColorPalette: '#3b82f6,#10b981,#f59e0b,#ef4444,#8b5cf6,#ec4899',
    },
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

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconPlus    = () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>;
const IconMinus   = () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>;
const IconHand    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M9 11V6a2 2 0 1 1 4 0v4m0 0V8a2 2 0 1 1 4 0v3m0 0v-1a2 2 0 1 1 4 0v5a7 7 0 0 1-7 7H9a7 7 0 0 1-7-7v-3a2 2 0 1 1 4 0v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconExpand  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m10 0h3a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconCollapse= () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>;
const IconReset   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 1 1 1.5 4.8M4 12V7m0 5H9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;

// ─── ToolBtn ──────────────────────────────────────────────────────────────────

const ToolBtn: React.FC<{
  onClick: () => void; title: string; label: string;
  isDark: boolean; active?: boolean; children: React.ReactNode;
}> = ({ onClick, title, label, isDark, active, children }) => {
  const [hov, setHov] = useState(false);
  const activeBg  = tc(isDark, 'rgba(255,255,255,0.15)', 'rgba(0,0,0,0.12)');
  const hovBg     = tc(isDark, 'rgba(255,255,255,0.1)',  'rgba(0,0,0,0.07)');
  const defaultBg = tc(isDark, 'rgba(255,255,255,0.05)', 'rgba(0,0,0,0.04)');
  const bg    = active ? activeBg : hov ? hovBg : defaultBg;
  const border= active ? tc(isDark,'rgba(255,255,255,0.2)','rgba(0,0,0,0.18)') : tc(isDark,'rgba(255,255,255,0.1)','rgba(0,0,0,0.1)');
  const color = active ? tc(isDark,'#fff','#000') : tc(isDark,'rgba(255,255,255,0.65)','rgba(0,0,0,0.55)');
  return (
    <button title={title} onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display:'inline-flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2, padding:'4px 7px', minWidth:36, borderRadius:7, border:`1px solid ${border}`, background:bg, color, cursor:'pointer', transition:'all 0.12s', flexShrink:0 }}
    >
      {children}
      <span style={{ fontSize:9, fontWeight:500, lineHeight:1, whiteSpace:'nowrap' }}>{label}</span>
    </button>
  );
};

// ─── DiagramViewer ────────────────────────────────────────────────────────────

const DiagramViewer: React.FC<{
  svgHtml: string; panMode: boolean;
  scale: number; setScale: React.Dispatch<React.SetStateAction<number>>;
  pos: { x: number; y: number }; setPos: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  isFullscreen?: boolean;
}> = ({ svgHtml, panMode, scale, setScale, pos, setPos, isFullscreen }) => {
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
      const dx = ev.clientX - last.current.x; const dy = ev.clientY - last.current.y;
      last.current = { x: ev.clientX, y: ev.clientY };
      setPos(p => ({ x: p.x + dx, y: p.y + dy }));
    };
    const onUp = () => { dragging.current = false; setIsDragging(false); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
  }, [panMode, setPos]);

  useEffect(() => {
    const el = viewRef.current; if (!el || !panMode) return;
    let lt = { x: 0, y: 0 }; let ld = 0;
    const onTS = (e: TouchEvent) => { if (e.touches.length === 1) lt = { x: e.touches[0].clientX, y: e.touches[0].clientY }; else if (e.touches.length === 2) ld = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); };
    const onTM = (e: TouchEvent) => { e.preventDefault(); if (e.touches.length === 1) { const dx = e.touches[0].clientX - lt.x; const dy = e.touches[0].clientY - lt.y; setPos(p => ({ x: p.x + dx, y: p.y + dy })); lt = { x: e.touches[0].clientX, y: e.touches[0].clientY }; } else if (e.touches.length === 2) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); setScale(s => Math.min(8, Math.max(0.25, s * (d / ld)))); ld = d; } };
    el.addEventListener('touchstart', onTS, { passive: true }); el.addEventListener('touchmove', onTM, { passive: false });
    return () => { el.removeEventListener('touchstart', onTS); el.removeEventListener('touchmove', onTM); };
  }, [panMode, setPos, setScale]);

  useEffect(() => {
    const el = viewRef.current; if (!el) return;
    const onWheel = (e: WheelEvent) => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); setScale(s => Math.min(8, Math.max(0.25, s * (e.deltaY > 0 ? 0.9 : 1.1)))); };
    el.addEventListener('wheel', onWheel, { passive: false }); return () => el.removeEventListener('wheel', onWheel);
  }, [setScale]);

  const cursor = panMode ? (isDragging ? 'grabbing' : 'grab') : 'default';
  return (
    <button ref={viewRef} aria-label="Diagram viewer" onMouseDown={onMouseDown}
      onKeyDown={(e) => { const s = 20; if (e.key==='ArrowLeft') setPos(p=>({...p,x:p.x-s})); if (e.key==='ArrowRight') setPos(p=>({...p,x:p.x+s})); if (e.key==='ArrowUp') setPos(p=>({...p,y:p.y-s})); if (e.key==='ArrowDown') setPos(p=>({...p,y:p.y+s})); }}
      style={{ overflow:'hidden', position:'relative', cursor, minHeight: isFullscreen ? '100%' : 80, maxHeight: isFullscreen ? undefined : '480px', height: isFullscreen ? '100%' : 'auto', userSelect:'none', touchAction:'none', outline:'none', display:'block', width:'100%', padding:0, border:'none', background:'none', textAlign:'left' }}
    >
      <div style={{ transform:`translate(${pos.x}px,${pos.y}px) scale(${scale})`, transformOrigin:'center center', transition: isDragging ? 'none' : 'transform 0.05s ease', display:'flex', justifyContent:'center', alignItems:'center', padding:'20px 24px', willChange:'transform' }}
        dangerouslySetInnerHTML={{ __html: svgHtml }}
      />
    </button>
  );
};

// ─── Toolbar ──────────────────────────────────────────────────────────────────

const Toolbar: React.FC<{
  isDark: boolean; scale: number; panMode: boolean; hasColor: boolean; color?: string;
  onZoomIn: () => void; onZoomOut: () => void; onTogglePan: () => void;
  onReset: () => void; onFullscreenToggle: () => void; isFullscreen: boolean;
}> = ({ isDark, scale, panMode, hasColor, color, onZoomIn, onZoomOut, onTogglePan, onReset, onFullscreenToggle, isFullscreen }) => (
  <>
    {hasColor && <div style={{ width:8, height:8, borderRadius:'50%', background:color, marginRight:2, flexShrink:0 }} />}
    <ToolBtn onClick={onZoomIn}  title="Увеличить"  label="Увеличить" isDark={isDark}><IconPlus /></ToolBtn>
    <ToolBtn onClick={onZoomOut} title="Уменьшить"  label="Уменьшить" isDark={isDark}><IconMinus /></ToolBtn>
    <span style={{ fontSize:11, fontWeight:600, minWidth:36, textAlign:'center', color: tc(isDark,'rgba(255,255,255,0.4)','rgba(0,0,0,0.4)'), fontFamily:'ui-monospace,monospace', flexShrink:0 }}>
      {Math.round(scale * 100)}%
    </span>
    <div style={{ width:1, height:20, background: tc(isDark,'rgba(255,255,255,0.08)','rgba(0,0,0,0.08)'), margin:'0 2px', flexShrink:0 }} />
    <ToolBtn onClick={onTogglePan} title="Перемещение" label="Рука"   isDark={isDark} active={panMode}><IconHand /></ToolBtn>
    <ToolBtn onClick={onReset}     title="Сбросить"     label="Сброс" isDark={isDark}><IconReset /></ToolBtn>
    <div style={{ flex:1 }} />
    {isFullscreen
      ? <ToolBtn onClick={onFullscreenToggle} title="Свернуть (Esc)" label="Свернуть"   isDark={isDark}><IconCollapse /></ToolBtn>
      : <ToolBtn onClick={onFullscreenToggle} title="Развернуть"     label="Развернуть" isDark={isDark}><IconExpand /></ToolBtn>
    }
  </>
);

// ─── MermaidDiagram ───────────────────────────────────────────────────────────

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code, color, isDark = false }) => {
  const [svgHtml,      setSvgHtml]      = useState('');
  const [status,       setStatus]       = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg,     setErrorMsg]     = useState('');
  const [panMode,      setPanMode]      = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale,        setScale]        = useState(1);
  const [pos,          setPos]          = useState({ x: 0, y: 0 });

  // KEY FIX: keep the previous SVG visible while re-rendering for theme change.
  // This prevents the "blank rectangle" flash when isDark toggles.
  const [displayHtml, setDisplayHtml]  = useState('');

  const resetView = useCallback(() => { setScale(1); setPos({ x: 0, y: 0 }); }, []);

  useEffect(() => {
    let cancelled = false;
    const key = cacheKey(code, isDark, color);

    if (svgCache.has(key)) {
      // Instant from cache — no flash, no loading state
      const cached = svgCache.get(key) ?? '';
      setSvgHtml(cached);
      setDisplayHtml(cached);
      setStatus('ready');
      return;
    }

    // Don't clear displayHtml here — keep showing the old SVG (even wrong theme)
    // while the new one loads. This eliminates the blank rectangle.
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

  const hasColor    = !!color;
  const borderColor = color || tc(isDark, 'rgba(255,255,255,0.1)', 'rgba(0,0,0,0.1)');
  const bgColor     = tc(isDark, '#0a0a0a', '#E8E7E3');

  // Show the diagram wrapper as soon as we have ANY svg to display
  // (even if it's the old-theme version still loading the new one).
  // Only show the blank/loading state on the very first render.
  const hasAnyContent = displayHtml !== '';

  const toolbarProps = {
    isDark, scale, panMode, hasColor, color,
    onZoomIn:    () => setScale(s => Math.min(8, +(s + 0.25).toFixed(2))),
    onZoomOut:   () => setScale(s => Math.max(0.25, +(s - 0.25).toFixed(2))),
    onTogglePan: () => setPanMode(v => !v),
    onReset:     resetView,
  };
  const viewerProps = { svgHtml: displayHtml, panMode, scale, setScale, pos, setPos };

  const fullscreenPortal = isFullscreen
    ? createPortal(
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:bgColor, display:'flex', flexDirection:'column' }}>
          <div style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 10px', borderBottom:`1px solid ${borderColor}`, background: tc(isDark,'rgba(255,255,255,0.02)','rgba(0,0,0,0.02)'), flexShrink:0, flexWrap:'wrap', rowGap:4 }}>
            <Toolbar {...toolbarProps} onFullscreenToggle={() => { setIsFullscreen(false); resetView(); }} isFullscreen />
          </div>
          <div style={{ flex:1, overflow:'hidden', position:'relative' }}>
            <DiagramViewer {...viewerProps} isFullscreen />
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      {fullscreenPortal}
      <div style={{
        margin: '1.5rem 0', borderRadius: 12,
        // Show border/bg only when we have content OR on error.
        // On the very first load (no content yet) stay invisible.
        border: (hasAnyContent || status === 'error')
          ? `1px solid ${borderColor}`
          : `1px solid transparent`,
        background: (hasAnyContent || status === 'error') ? bgColor : 'transparent',
        overflow: 'hidden', position: 'relative',
        // Smooth transition when the background appears for the first time
        transition: 'background 0.15s, border-color 0.15s',
      }}>
        {hasColor && hasAnyContent && <div style={{ height:3, background:color }} />}

        {/* Toolbar — show when ready OR when re-rendering (has old SVG) */}
        {(status === 'ready' || (status === 'loading' && hasAnyContent)) && (
          <div style={{
            display:'flex', alignItems:'center', gap:4, padding:'6px 10px',
            borderBottom:`1px solid ${tc(isDark,'rgba(255,255,255,0.07)','rgba(0,0,0,0.07)')}`,
            background: tc(isDark,'rgba(255,255,255,0.02)','rgba(0,0,0,0.02)'),
            flexWrap:'wrap', rowGap:4,
            // Fade toolbar slightly while re-rendering to hint loading
            opacity: status === 'loading' ? 0.6 : 1,
            transition: 'opacity 0.2s',
          }}>
            <Toolbar {...toolbarProps} onFullscreenToggle={() => setIsFullscreen(true)} isFullscreen={false} />
          </div>
        )}

        {/* First-load spinner — only when no SVG available yet */}
        {status === 'loading' && !hasAnyContent && (
          <div style={{ padding:'32px 24px', textAlign:'center', fontSize:13, color: tc(isDark,'rgba(255,255,255,0.35)','rgba(0,0,0,0.35)') }}>
            <div style={{ display:'inline-block', width:16, height:16, borderRadius:'50%', border:`2px solid ${tc(isDark,'rgba(255,255,255,0.15)','rgba(0,0,0,0.12)')}`, borderTopColor: tc(isDark,'rgba(255,255,255,0.6)','rgba(0,0,0,0.5)'), animation:'mermaidSpin 0.7s linear infinite', marginBottom:10 }} />
            <style>{`@keyframes mermaidSpin{to{transform:rotate(360deg)}}`}</style>
            <div>Загрузка диаграммы…</div>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div style={{ padding:'16px 20px', background: tc(isDark,'rgba(239,68,68,0.1)','rgba(239,68,68,0.06)') }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#ef4444', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>Ошибка диаграммы</div>
            <pre style={{ fontSize:11, margin:0, whiteSpace:'pre-wrap', color: tc(isDark,'rgba(255,255,255,0.5)','rgba(0,0,0,0.5)'), fontFamily:'ui-monospace,monospace' }}>{errorMsg}</pre>
            <pre style={{ marginTop:10, padding:'8px 12px', borderRadius:7, fontSize:11, background: tc(isDark,'rgba(255,255,255,0.03)','rgba(0,0,0,0.03)'), color: tc(isDark,'rgba(255,255,255,0.4)','rgba(0,0,0,0.4)'), fontFamily:'ui-monospace,monospace', whiteSpace:'pre-wrap' }}>{code}</pre>
          </div>
        )}

        {/* SVG viewer — show whenever we have any HTML to display */}
        {hasAnyContent && status !== 'error' && (
          <div style={{
            maxHeight:'480px', overflow:'hidden',
            // While loading new theme, slightly fade the old SVG
            opacity: status === 'loading' ? 0.5 : 1,
            transition: 'opacity 0.2s',
          }}>
            <DiagramViewer {...viewerProps} />
          </div>
        )}
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