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

// ─── Mermaid: initialize ОДИН РАЗ на тему ────────────────────────────────────
// Повторный initialize() на каждом render() ломает mermaid v10+

let mermaidMod: any = null;
let lastTheme: string | null = null;

async function getMermaid(isDark: boolean, color?: string) {
  if (!mermaidMod) {
    const m = await import('mermaid');
    mermaidMod = m.default;
  }
  const theme = isDark ? 'dark' : 'light';
  if (lastTheme !== theme) {
    lastTheme = theme;
    mermaidMod.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: isDark ? 'dark' : 'default',
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
      fontSize: 14,
      flowchart: { htmlLabels: true, useMaxWidth: false, padding: 16 },
      sequence:  { useMaxWidth: false, boxMargin: 8, mirrorActors: false },
      gantt:     { useMaxWidth: false, leftPadding: 80, barHeight: 24 },
      er:              { useMaxWidth: false },
      classDiagram:    { useMaxWidth: false },
      stateDiagram:    { useMaxWidth: false },
      pie:             { useMaxWidth: false },
      gitGraph:        { useMaxWidth: false },
      themeVariables: isDark ? {
        primaryColor:        '#1a1a2e',
        primaryTextColor:    '#d4d4d8',
        primaryBorderColor:  color || '#3f3f6e',
        lineColor:           '#6b6b9e',
        secondaryColor:      '#16213e',
        tertiaryColor:       '#1a1a2e',
        background:          '#0a0a0a',
        mainBkg:             '#131320',
        nodeBorder:          color || '#3f3f6e',
        clusterBkg:          '#0f0f1a',
        clusterBorder:       '#2a2a4e',
        titleColor:          '#d4d4d8',
        edgeLabelBackground: '#0f0f18',
        textColor:           '#d4d4d8',
        labelTextColor:      '#d4d4d8',
        actorBkg:            '#1a1a2e',
        actorBorder:         color || '#3f3f6e',
        actorTextColor:      '#d4d4d8',
        actorLineColor:      '#4a4a7e',
        signalColor:         '#8888bb',
        signalTextColor:     '#d4d4d8',
        noteBkgColor:        '#1e2a3a',
        noteTextColor:       '#c4c4d4',
        gridColor:           '#1e1e2e',
        taskBkgColor:        color || '#1e3a5f',
        taskBorderColor:     color || '#2a4a7e',
        taskTextColor:       '#d4d4d8',
        taskTextOutsideColor:'#aaaacc',
        fillType0: '#1a1a2e', fillType1: '#16213e',
      } : {
        primaryColor:        '#e8e6f8',
        primaryTextColor:    '#1a1a2e',
        primaryBorderColor:  color || '#9090c0',
        lineColor:           '#7070a0',
        secondaryColor:      '#f0eeff',
        tertiaryColor:       '#e4e0f8',
        background:          '#E8E7E3',
        mainBkg:             '#eeeaf8',
        nodeBorder:          color || '#9090c0',
        clusterBkg:          '#f4f2fc',
        clusterBorder:       '#c0bce0',
        titleColor:          '#1a1a2e',
        edgeLabelBackground: '#f5f3fc',
        textColor:           '#1a1a2e',
        labelTextColor:      '#1a1a2e',
        actorBkg:            '#eeeaf8',
        actorBorder:         color || '#9090c0',
        actorTextColor:      '#1a1a2e',
        actorLineColor:      '#7070a0',
        signalColor:         '#5050a0',
        signalTextColor:     '#1a1a2e',
        noteBkgColor:        '#f0eeff',
        noteTextColor:       '#2a2a4e',
        gridColor:           '#d8d4f0',
        taskBkgColor:        color || '#c8c4f0',
        taskBorderColor:     color || '#9090c0',
        taskTextColor:       '#1a1a2e',
        taskTextOutsideColor:'#3a3a6e',
        fillType0: '#e8e6f8', fillType1: '#f0eeff',
      },
    });
  }
  return mermaidMod;
}

// ─── SVG cache ────────────────────────────────────────────────────────────────

const svgCache = new Map<string, string>();
function cacheKey(code: string, isDark: boolean, color?: string) {
  return `${isDark ? 'd' : 'l'}|${color ?? ''}|${code}`;
}
let idCounter = 0;

const tc = (isDark: boolean, d: string, l: string) => (isDark ? d : l);

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconPlus    = () => <svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const IconMinus   = () => <svg width="12" height="12" viewBox="0 0 12 12"><path d="M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const IconHand    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 11V6a2 2 0 1 1 4 0v4m0 0V8a2 2 0 1 1 4 0v3m0 0v-1a2 2 0 1 1 4 0v5a7 7 0 0 1-7 7H9a7 7 0 0 1-7-7v-3a2 2 0 1 1 4 0v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconReset   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M4 8V5a1 1 0 0 1 1-1h3M4 16v3a1 1 0 0 0 1 1h3M16 4h3a1 1 0 0 1 1 1v3M16 20h3a1 1 0 0 0 1-1v-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>;
const IconExpand  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3m10 0h3a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>;
const IconClose   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>;

// ─── ToolBtn ──────────────────────────────────────────────────────────────────

const ToolBtn: React.FC<{
  onClick: () => void; title: string; isDark: boolean; active?: boolean; children: React.ReactNode;
}> = ({ onClick, title, isDark, active, children }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      title={title} onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 26, height: 26, borderRadius: 6, padding: 0, cursor: 'pointer',
        flexShrink: 0, transition: 'all 0.1s', lineHeight: 1,
        border: `1px solid ${active ? tc(isDark,'rgba(255,255,255,0.22)','rgba(0,0,0,0.2)') : tc(isDark,'rgba(255,255,255,0.09)','rgba(0,0,0,0.09)')}`,
        background: active ? tc(isDark,'rgba(255,255,255,0.16)','rgba(0,0,0,0.12)') : hov ? tc(isDark,'rgba(255,255,255,0.1)','rgba(0,0,0,0.07)') : tc(isDark,'rgba(255,255,255,0.04)','rgba(0,0,0,0.03)'),
        color: active ? tc(isDark,'#fff','#111') : tc(isDark,'rgba(255,255,255,0.6)','rgba(0,0,0,0.5)'),
      }}
    >{children}</button>
  );
};

// ─── DiagramViewer ────────────────────────────────────────────────────────────
// ИСПРАВЛЕНИЕ: используем setPointerCapture вместо window mousemove
// — это единственный надёжный способ drag в React

interface VS { x: number; y: number; scale: number }

const DiagramViewer: React.FC<{
  html: string; isDark: boolean; panMode: boolean;
  vs: VS; setVs: React.Dispatch<React.SetStateAction<VS>>;
  fullscreen?: boolean;
}> = ({ html, panMode, vs, setVs, fullscreen }) => {
  const ref    = useRef<HTMLDivElement>(null);
  const active = useRef(false);
  const last   = useRef({ x: 0, y: 0 });
  // Для отображения курсора grabbing используем state (не ref)
  const [grabbing, setGrabbing] = useState(false);

  const onPD = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!panMode) return;
    e.preventDefault();
    active.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    setGrabbing(true);
    // setPointerCapture — события pointer приходят на этот элемент
    // даже когда курсор вышел за его пределы
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [panMode]);

  const onPM = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!active.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    setVs(v => ({ ...v, x: v.x + dx, y: v.y + dy }));
  }, [setVs]);

  const onPU = useCallback(() => {
    active.current = false;
    setGrabbing(false);
  }, []);

  // pinch-to-zoom (touch)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let ld = 0;
    const ts = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        ld = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      }
    };
    const tm = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      e.preventDefault();
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (ld > 0) setVs(v => ({ ...v, scale: Math.min(5, Math.max(0.15, v.scale * d / ld)) }));
      ld = d;
    };
    el.addEventListener('touchstart', ts, { passive: false });
    el.addEventListener('touchmove',  tm, { passive: false });
    return () => { el.removeEventListener('touchstart', ts); el.removeEventListener('touchmove', tm); };
  }, [setVs]);

  // ctrl+wheel zoom
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const wh = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setVs(v => ({ ...v, scale: Math.min(5, Math.max(0.15, v.scale * (e.deltaY < 0 ? 1.12 : 0.89))) }));
    };
    el.addEventListener('wheel', wh, { passive: false });
    return () => el.removeEventListener('wheel', wh);
  }, [setVs]);

  return (
    <div
      ref={ref}
      onPointerDown={onPD}
      onPointerMove={onPM}
      onPointerUp={onPU}
      onPointerCancel={onPU}
      style={{
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        cursor: panMode ? (grabbing ? 'grabbing' : 'grab') : 'default',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: panMode ? 'none' : 'auto',
        // В fullscreen — фиксированная высота; иначе — SVG задаёт высоту через padding
        ...(fullscreen
          ? { height: '100%' }
          : { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 20px' }
        ),
      }}
    >
      <div
        style={{
          // В fullscreen центрируем абсолютно; иначе — трансформируем от центра flex
          ...(fullscreen
            ? { position: 'absolute', top: '50%', left: '50%',
                transform: `translate(calc(-50% + ${vs.x}px), calc(-50% + ${vs.y}px)) scale(${vs.scale})` }
            : { transform: `translate(${vs.x}px, ${vs.y}px) scale(${vs.scale})`,
                transformOrigin: 'center center' }
          ),
          lineHeight: 0,
          willChange: 'transform',
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};

// ─── Toolbar ──────────────────────────────────────────────────────────────────

const DiagramToolbar: React.FC<{
  isDark: boolean; vs: VS; setVs: React.Dispatch<React.SetStateAction<VS>>;
  panMode: boolean; setPanMode: (v: boolean) => void;
  onExpand?: () => void; onClose?: () => void;
}> = ({ isDark, vs, setVs, panMode, setPanMode, onExpand, onClose }) => {
  const sep  = tc(isDark, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.07)');
  const zoom = (f: number) => setVs(v => ({ ...v, scale: Math.min(5, Math.max(0.15, v.scale * f)) }));
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 3, padding: '5px 8px',
      borderBottom: `1px solid ${sep}`,
      background: tc(isDark, 'rgba(255,255,255,0.015)', 'rgba(0,0,0,0.015)'),
    }}>
      <ToolBtn onClick={() => zoom(1.25)} title="Увеличить" isDark={isDark}><IconPlus /></ToolBtn>
      <ToolBtn onClick={() => zoom(0.8)}  title="Уменьшить" isDark={isDark}><IconMinus /></ToolBtn>
      <span style={{
        fontSize: 10, fontWeight: 600, minWidth: 30, textAlign: 'center',
        color: tc(isDark,'rgba(255,255,255,0.35)','rgba(0,0,0,0.35)'),
        fontFamily: 'ui-monospace,monospace',
      }}>
        {Math.round(vs.scale * 100)}%
      </span>
      <div style={{ width: 1, height: 13, background: sep, margin: '0 1px' }} />
      <ToolBtn onClick={() => setPanMode(!panMode)} title="Перемещение (зажми и тяни)" isDark={isDark} active={panMode}>
        <IconHand />
      </ToolBtn>
      <ToolBtn onClick={() => setVs({ x: 0, y: 0, scale: 1 })} title="Сбросить вид" isDark={isDark}>
        <IconReset />
      </ToolBtn>
      <div style={{ flex: 1 }} />
      {onExpand && <ToolBtn onClick={onExpand} title="Полный экран" isDark={isDark}><IconExpand /></ToolBtn>}
      {onClose  && <ToolBtn onClick={onClose}  title="Закрыть"     isDark={isDark}><IconClose  /></ToolBtn>}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code, color, isDark = false }) => {
  const [status,  setStatus]  = useState<'loading' | 'ready' | 'error'>('loading');
  const [errMsg,  setErrMsg]  = useState('');
  const [html,    setHtml]    = useState('');
  const [panMode, setPanMode] = useState(false);
  const [fs,      setFs]      = useState(false);
  const [vs,      setVs]      = useState<VS>({ x: 0, y: 0, scale: 1 });

  const doRender = useCallback(async () => {
    const key = cacheKey(code, isDark, color);
    if (svgCache.has(key)) {
      setHtml(svgCache.get(key)!);
      setStatus('ready');
      return;
    }
    setStatus('loading');
    setErrMsg('');
    try {
      const mermaid = await getMermaid(isDark, color);
      const id = `md${++idCounter}`;
      const { svg } = await mermaid.render(id, code.trim());

      // Патч SVG: убираем фиксированные размеры + расширяем viewBox чтобы текст не обрезался
      let out = svg
        .replace(/(<svg[^>]*)\s+width="[^"]*"/, '$1')
        .replace(/(<svg[^>]*)\s+height="[^"]*"/, '$1');

      out = out.replace(/viewBox="([^"]+)"/, (_: string, vb: string) => {
        const p = vb.trim().split(/\s+/).map(Number);
        if (p.length === 4) {
          const pad = 16;
          return `viewBox="${p[0]-pad} ${p[1]-pad} ${p[2]+pad*2} ${p[3]+pad*2}"`;
        }
        return `viewBox="${vb}"`;
      });

      out = out.replace('<svg ', '<svg style="display:block;max-width:100%;height:auto;overflow:visible;" ');

      svgCache.set(key, out);
      setHtml(out);
      setStatus('ready');
    } catch (e: unknown) {
      setErrMsg(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  }, [code, isDark, color]);

  useEffect(() => {
    const t = setTimeout(doRender, 0);
    return () => clearTimeout(t);
  }, [doRender]);

  useEffect(() => { setVs({ x: 0, y: 0, scale: 1 }); }, [isDark]);

  const hasColor = !!color;
  const bdr = color || tc(isDark, 'rgba(255,255,255,0.1)', 'rgba(0,0,0,0.1)');
  const bg  = tc(isDark, '#0a0a0a', '#E8E7E3');

  const viewerProps = { html, panMode, vs, setVs };
  const tbProps     = { isDark, vs, setVs, panMode, setPanMode };

  return (
    <>
      {/* Fullscreen */}
      {fs && status === 'ready' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: bg, display: 'flex', flexDirection: 'column' }}>
          <DiagramToolbar {...tbProps} onClose={() => { setFs(false); setVs({ x:0,y:0,scale:1 }); }} />
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
            <DiagramViewer {...viewerProps} isDark={isDark} fullscreen />
          </div>
        </div>
      )}

      {/* Inline */}
      <div style={{ margin: '1.25rem 0', borderRadius: 10, border: `1px solid ${bdr}`, background: bg, overflow: 'hidden' }}>
        {hasColor && <div style={{ height: 3, background: color }} />}

        {status === 'loading' && (
          <div style={{ padding: '24px 20px', textAlign: 'center' }}>
            <style>{`@keyframes msp{to{transform:rotate(360deg)}}`}</style>
            <div style={{
              display: 'inline-block', width: 15, height: 15, borderRadius: '50%',
              border: `2px solid ${tc(isDark,'rgba(255,255,255,0.1)','rgba(0,0,0,0.1)')}`,
              borderTopColor: tc(isDark,'rgba(255,255,255,0.5)','rgba(0,0,0,0.4)'),
              animation: 'msp 0.65s linear infinite',
            }} />
          </div>
        )}

        {status === 'error' && (
          <div style={{ padding: '14px 18px', background: tc(isDark,'rgba(239,68,68,0.1)','rgba(239,68,68,0.06)') }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              Ошибка диаграммы
            </div>
            <pre style={{ fontSize: 11, margin: 0, whiteSpace: 'pre-wrap', color: tc(isDark,'rgba(255,255,255,0.5)','rgba(0,0,0,0.5)'), fontFamily: 'ui-monospace,monospace' }}>{errMsg}</pre>
            <pre style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, fontSize: 10, background: tc(isDark,'rgba(255,255,255,0.03)','rgba(0,0,0,0.03)'), color: tc(isDark,'rgba(255,255,255,0.3)','rgba(0,0,0,0.35)'), fontFamily: 'ui-monospace,monospace', whiteSpace: 'pre-wrap' }}>{code}</pre>
          </div>
        )}

        {status === 'ready' && (
          <>
            <DiagramToolbar {...tbProps} onExpand={() => { setFs(true); setVs({ x:0,y:0,scale:1 }); }} />
            <DiagramViewer {...viewerProps} isDark={isDark} />
          </>
        )}
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