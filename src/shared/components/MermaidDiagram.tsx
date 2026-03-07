import React, {
  useEffect,
  useRef,
  useState,
  useContext,
  useCallback,
} from 'react';
import { TableContext } from '../lib/htmlParser';

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
function nextId() {
  return `mermaid-${++globalIdCounter}`;
}

const svgCache = new Map<string, string>();

function cacheKey(code: string, isDark: boolean, color?: string) {
  return `${isDark ? 'dark' : 'light'}::${color ?? ''}::${code}`;
}

const tc = (isDark: boolean, d: string, l: string) => (isDark ? d : l);

// ─── Icon components ──────────────────────────────────────────────────────────

const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
    <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
);
const IconMinus = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
    <path d="M2 7h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
);
const IconHand = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M9 11V6a2 2 0 1 1 4 0v4m0 0V8a2 2 0 1 1 4 0v3m0 0v-1a2 2 0 1 1 4 0v5a7 7 0 0 1-7 7H9a7 7 0 0 1-7-7v-3a2 2 0 1 1 4 0v3"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconMaximize = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m10 0h3a2 2 0 0 0 2-2v-3"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconClose = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
);
const IconReset = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M4 12a8 8 0 1 1 1.5 4.8M4 12V7m0 5H9"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─── ToolBtn — pill style: icon on top, label below ───────────────────────────

const ToolBtn: React.FC<{
  onClick: () => void;
  title: string;
  label: string;
  isDark: boolean;
  active?: boolean;
  children: React.ReactNode;
}> = ({ onClick, title, label, isDark, active, children }) => {
  const [hov, setHov] = useState(false);

  const activeBg  = tc(isDark, 'rgba(255,255,255,0.15)', 'rgba(0,0,0,0.12)');
  const hovBg     = tc(isDark, 'rgba(255,255,255,0.1)',  'rgba(0,0,0,0.07)');
  const defaultBg = tc(isDark, 'rgba(255,255,255,0.05)', 'rgba(0,0,0,0.04)');
  let bg = defaultBg;
  if (active) bg = activeBg;
  else if (hov) bg = hovBg;

  const border = active
    ? tc(isDark, 'rgba(255,255,255,0.2)', 'rgba(0,0,0,0.18)')
    : tc(isDark, 'rgba(255,255,255,0.1)', 'rgba(0,0,0,0.1)');

  const color = active
    ? tc(isDark, '#fff', '#000')
    : tc(isDark, 'rgba(255,255,255,0.65)', 'rgba(0,0,0,0.55)');

  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        padding: '4px 7px',
        minWidth: 36,
        borderRadius: 7,
        border: `1px solid ${border}`,
        background: bg,
        color,
        cursor: 'pointer',
        transition: 'all 0.12s',
        flexShrink: 0,
      }}
    >
      {children}
      <span style={{ fontSize: 9, fontWeight: 500, lineHeight: 1, whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </button>
  );
};

// ─── DiagramViewer — pan/zoom container ───────────────────────────────────────

interface DiagramViewerProps {
  svgHtml: string;
  isDark: boolean;
  panMode: boolean;
  scale: number;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  pos: { x: number; y: number };
  setPos: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  isFullscreen?: boolean;
}

const DiagramViewer: React.FC<DiagramViewerProps> = ({
  svgHtml, isDark, panMode, scale, setScale, pos, setPos, isFullscreen,
}) => {
  const viewRef  = useRef<HTMLButtonElement>(null);
  const dragging = useRef(false);
  const last     = useRef({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!panMode) return;
    if (e.button !== 0) return;
    e.preventDefault();

    dragging.current = true;
    setIsDragging(true);
    last.current = { x: e.clientX, y: e.clientY };

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - last.current.x;
      const dy = ev.clientY - last.current.y;
      last.current = { x: ev.clientX, y: ev.clientY };
      setPos(p => ({ x: p.x + dx, y: p.y + dy }));
    };

    const onUp = () => {
      dragging.current = false;
      setIsDragging(false);
      globalThis.window.removeEventListener('mousemove', onMove);
      globalThis.window.removeEventListener('mouseup', onUp);
    };

    globalThis.window.addEventListener('mousemove', onMove);
    globalThis.window.addEventListener('mouseup', onUp);
  }, [panMode, setPos]);

  useEffect(() => {
    const el = viewRef.current;
    if (!el || !panMode) return;

    let lastTouch = { x: 0, y: 0 };
    let lastDist  = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        lastDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - lastTouch.x;
        const dy = e.touches[0].clientY - lastTouch.y;
        setPos(p => ({ x: p.x + dx, y: p.y + dy }));
        lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const ratio = dist / lastDist;
        setScale(s => Math.min(4, Math.max(0.25, s * ratio)));
        lastDist = dist;
      }
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, [panMode, setPos, setScale]);

  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale(s => Math.min(4, Math.max(0.25, s * delta)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [setScale]);

  const minH = isFullscreen ? '100%' : 80;
  let cursor = 'default';
  if (panMode && isDragging) cursor = 'grabbing';
  else if (panMode) cursor = 'grab';

  return (
    <button
      ref={viewRef}
      aria-label="Diagram viewer — drag to pan, Ctrl+scroll to zoom"
      onMouseDown={onMouseDown}
      onKeyDown={(e) => {
        const step = 20;
        if (e.key === 'ArrowLeft')  setPos(p => ({ ...p, x: p.x - step }));
        if (e.key === 'ArrowRight') setPos(p => ({ ...p, x: p.x + step }));
        if (e.key === 'ArrowUp')    setPos(p => ({ ...p, y: p.y - step }));
        if (e.key === 'ArrowDown')  setPos(p => ({ ...p, y: p.y + step }));
      }}
      style={{
        overflow: 'hidden', position: 'relative', cursor,
        minHeight: minH, height: isFullscreen ? '100%' : 'auto',
        userSelect: 'none', touchAction: 'none', outline: 'none',
        display: 'block', width: '100%', padding: 0,
        border: 'none', background: 'none', textAlign: 'left',
      }}
    >
      <div
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: dragging.current ? 'none' : 'transform 0.05s ease',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '20px 24px', willChange: 'transform',
        }}
        dangerouslySetInnerHTML={{ __html: svgHtml }}
      />
    </button>
  );
};

// ─── Shared toolbar content ───────────────────────────────────────────────────

interface ToolbarContentProps {
  isDark: boolean;
  scale: number;
  panMode: boolean;
  hasColor: boolean;
  color?: string;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onTogglePan: () => void;
  onReset: () => void;
  onFullscreenToggle: () => void;
  isFullscreen: boolean;
}

const ToolbarContent: React.FC<ToolbarContentProps> = ({
  isDark, scale, panMode, hasColor, color,
  onZoomIn, onZoomOut, onTogglePan, onReset, onFullscreenToggle, isFullscreen,
}) => (
  <>
    {hasColor && (
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, marginRight: 2, flexShrink: 0 }} />
    )}
    <ToolBtn onClick={onZoomIn} title="Увеличить" label="Увеличить" isDark={isDark}>
      <IconPlus />
    </ToolBtn>
    <ToolBtn onClick={onZoomOut} title="Уменьшить" label="Уменьшить" isDark={isDark}>
      <IconMinus />
    </ToolBtn>

    <span style={{
      fontSize: 11, fontWeight: 600, minWidth: 36, textAlign: 'center',
      color: tc(isDark, 'rgba(255,255,255,0.4)', 'rgba(0,0,0,0.4)'),
      fontFamily: 'ui-monospace, monospace', flexShrink: 0,
    }}>
      {Math.round(scale * 100)}%
    </span>

    <div style={{
      width: 1, height: 20,
      background: tc(isDark, 'rgba(255,255,255,0.08)', 'rgba(0,0,0,0.08)'),
      margin: '0 2px', flexShrink: 0,
    }} />

    <ToolBtn onClick={onTogglePan} title="Режим перемещения" label="Рука" isDark={isDark} active={panMode}>
      <IconHand />
    </ToolBtn>
    <ToolBtn onClick={onReset} title="Сбросить вид" label="Сброс" isDark={isDark}>
      <IconReset />
    </ToolBtn>

    <div style={{ flex: 1 }} />

    {isFullscreen ? (
      <ToolBtn onClick={onFullscreenToggle} title="Выйти из полноэкранного режима" label="Свернуть" isDark={isDark}>
        <IconClose />
      </ToolBtn>
    ) : (
      <ToolBtn onClick={onFullscreenToggle} title="Полноэкранный режим" label="Развернуть" isDark={isDark}>
        <IconMaximize />
      </ToolBtn>
    )}
  </>
);

// ─── Main component ────────────────────────────────────────────────────────────

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code, color, isDark = false }) => {
  const [status, setStatus]             = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg]         = useState('');
  const [svgHtml, setSvgHtml]           = useState('');
  const [panMode, setPanMode]           = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale]               = useState(1);
  const [pos, setPos]                   = useState({ x: 0, y: 0 });

  const resetView = useCallback(() => { setScale(1); setPos({ x: 0, y: 0 }); }, []);

  const render = useCallback(async () => {
    const key = cacheKey(code, isDark, color);

    if (svgCache.has(key)) {
      setSvgHtml(svgCache.get(key) ?? '');
      setStatus('ready');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const mermaid = await getMermaid();

      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? 'dark' : 'default',
        securityLevel: 'loose',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis', padding: 20 },
        sequence: { useMaxWidth: true, boxMargin: 10 },
        gantt: { useMaxWidth: true, leftPadding: 75, barHeight: 28, fontSize: 13 },
        themeVariables: isDark
          ? {
              primaryColor: '#1a1a2e', primaryTextColor: '#e8e8e8',
              primaryBorderColor: color || 'rgba(255,255,255,0.25)',
              lineColor: 'rgba(255,255,255,0.5)', secondaryColor: '#16213e',
              tertiaryColor: '#1a1a2e', background: '#0a0a0a', mainBkg: '#131320',
              nodeBorder: color || 'rgba(255,255,255,0.3)',
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
            }
          : {
              primaryColor: '#e8e7f0', primaryTextColor: '#1a1a2e',
              primaryBorderColor: color || 'rgba(0,0,0,0.2)',
              lineColor: 'rgba(0,0,0,0.5)', secondaryColor: '#f0eff8',
              tertiaryColor: '#e0dff0', background: '#E8E7E3', mainBkg: '#eeecf8',
              nodeBorder: color || 'rgba(0,0,0,0.25)',
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
            },
      });

      const id = nextId();
      const { svg } = await mermaid.render(id, code.trim());

      const patched = svg
        .replaceAll(/(<svg[^>]*?)\s+width="[^"]*"/g, '$1')
        .replaceAll(/(<svg[^>]*?)\s+height="[^"]*"/g, '$1')
        .replace(
          /<svg /,
          '<svg style="max-width:min(100%,400px);height:auto;display:block;overflow:visible;margin:0 auto;" ',
        );

      svgCache.set(key, patched);
      setSvgHtml(patched);
      setStatus('ready');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown render error';
      setErrorMsg(msg);
      setStatus('error');
    }
  }, [code, isDark, color]);

  useEffect(() => {
    const t = setTimeout(render, 0);
    return () => clearTimeout(t);
  }, [render]);

  const hasColor    = !!color;
  const borderColor = color || tc(isDark, 'rgba(255,255,255,0.1)', 'rgba(0,0,0,0.1)');
  const bgColor     = tc(isDark, '#0a0a0a', '#E8E7E3');

  const toolbarBorderBottom = status === 'ready'
    ? `1px solid ${tc(isDark, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.07)')}`
    : 'none';

  const toolbarCommonProps = {
    isDark, scale, panMode, hasColor, color,
    onZoomIn:  () => setScale(s => Math.min(4, +(s + 0.25).toFixed(2))),
    onZoomOut: () => setScale(s => Math.max(0.25, +(s - 0.25).toFixed(2))),
    onTogglePan: () => setPanMode(v => !v),
    onReset: resetView,
  };

  // ─── Fullscreen modal ───────────────────────────────────────────────────────

  const Fullscreen = isFullscreen && status === 'ready' ? (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: bgColor,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '6px 10px',
        borderBottom: `1px solid ${borderColor}`,
        background: tc(isDark, 'rgba(255,255,255,0.02)', 'rgba(0,0,0,0.02)'),
        flexShrink: 0,
        flexWrap: 'wrap',      // ← wrap on narrow screens
        rowGap: 4,
      }}>
        <ToolbarContent
          {...toolbarCommonProps}
          onFullscreenToggle={() => { setIsFullscreen(false); resetView(); }}
          isFullscreen
        />
      </div>

      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <DiagramViewer
          svgHtml={svgHtml} isDark={isDark} panMode={panMode}
          scale={scale} setScale={setScale} pos={pos} setPos={setPos} isFullscreen
        />
      </div>
    </div>
  ) : null;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {Fullscreen}
      <div style={{
        margin: '1.5rem 0', borderRadius: 12,
        border: `1px solid ${borderColor}`,
        background: bgColor, overflow: 'hidden', position: 'relative',
      }}>
        {hasColor && <div style={{ height: 3, background: color }} />}

        {status === 'ready' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '6px 10px',
            borderBottom: toolbarBorderBottom,
            background: tc(isDark, 'rgba(255,255,255,0.02)', 'rgba(0,0,0,0.02)'),
            flexWrap: 'wrap',   // ← wrap on narrow screens
            rowGap: 4,
          }}>
            <ToolbarContent
              {...toolbarCommonProps}
              onFullscreenToggle={() => setIsFullscreen(true)}
              isFullscreen={false}
            />
          </div>
        )}

        {status === 'loading' && (
          <div style={{
            padding: '32px 24px', textAlign: 'center', fontSize: 13,
            color: tc(isDark, 'rgba(255,255,255,0.35)', 'rgba(0,0,0,0.35)'),
          }}>
            <div style={{
              display: 'inline-block', width: 16, height: 16, borderRadius: '50%',
              border: `2px solid ${tc(isDark, 'rgba(255,255,255,0.15)', 'rgba(0,0,0,0.15)')}`,
              borderTopColor: tc(isDark, 'rgba(255,255,255,0.6)', 'rgba(0,0,0,0.5)'),
              animation: 'mermaidSpin 0.7s linear infinite',
              marginBottom: 10,
            }} />
            <style>{`@keyframes mermaidSpin{to{transform:rotate(360deg)}}`}</style>
            <div>Загрузка диаграммы…</div>
          </div>
        )}

        {status === 'error' && (
          <div style={{
            padding: '16px 20px',
            background: tc(isDark, 'rgba(239,68,68,0.1)', 'rgba(239,68,68,0.06)'),
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#ef4444',
              textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6,
            }}>
              Ошибка диаграммы
            </div>
            <pre style={{
              fontSize: 11, margin: 0, whiteSpace: 'pre-wrap',
              color: tc(isDark, 'rgba(255,255,255,0.5)', 'rgba(0,0,0,0.5)'),
              fontFamily: 'ui-monospace, monospace',
            }}>{errorMsg}</pre>
            <pre style={{
              marginTop: 10, padding: '8px 12px', borderRadius: 7, fontSize: 11,
              background: tc(isDark, 'rgba(255,255,255,0.03)', 'rgba(0,0,0,0.03)'),
              color: tc(isDark, 'rgba(255,255,255,0.4)', 'rgba(0,0,0,0.4)'),
              fontFamily: 'ui-monospace, monospace', whiteSpace: 'pre-wrap',
            }}>{code}</pre>
          </div>
        )}

        <div style={{ display: status === 'ready' ? 'block' : 'none' }}>
          <DiagramViewer
            svgHtml={svgHtml} isDark={isDark} panMode={panMode}
            scale={scale} setScale={setScale} pos={pos} setPos={setPos}
          />
        </div>
      </div>
    </>
  );
};

// ─── Context wrapper ───────────────────────────────────────────────────────────

const MermaidDiagramWithContext: React.FC<Omit<MermaidDiagramProps, 'isDark'>> = (props) => {
  const { isDark } = useContext(TableContext);
  return <MermaidDiagram {...props} isDark={isDark} />;
};

export { MermaidDiagram };
export default MermaidDiagramWithContext;