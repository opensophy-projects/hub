import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { Maximize2, Minus, Move, Plus, RefreshCcw } from 'lucide-react';
import { makeTokens } from '@/shared/tokens/theme';

type MermaidApi = {
  initialize: (config: Record<string, unknown>) => void;
  render: (id: string, text: string) => Promise<{ svg: string }> | { svg: string };
};

declare global {
  interface Window {
    mermaid?: MermaidApi;
    __hubMermaidPromise?: Promise<MermaidApi>;
  }
}

interface MermaidViewerProps {
  readonly chart: string;
  readonly isDark: boolean;
}

type ViewState = {
  scale: number;
  x: number;
  y: number;
};

type PointerPoint = {
  x: number;
  y: number;
};

const MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
const MIN_SCALE = 0.25;
const MAX_SCALE = 4;
const SCALE_STEP = 0.2;
const SANITIZE_SVG_TAGS = [
  'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
  'text', 'tspan', 'defs', 'marker', 'pattern', 'clipPath', 'mask', 'style', 'title',
  'desc', 'foreignObject', 'div', 'span', 'br', 'p', 'b', 'strong', 'i', 'em', 'label',
];
const SANITIZE_SVG_ATTR = [
  'id', 'class', 'style', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry',
  'd', 'points', 'width', 'height', 'viewBox', 'transform', 'fill', 'stroke', 'stroke-width',
  'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'marker-end', 'marker-start',
  'marker-mid', 'orient', 'refX', 'refY', 'markerWidth', 'markerHeight', 'text-anchor',
  'dominant-baseline', 'font-size', 'font-family', 'font-weight', 'xmlns', 'role', 'aria-roledescription',
  'aria-label', 'data-id', 'data-node', 'data-edge', 'data-et', 'data-look', 'data-layout',
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function loadMermaid(): Promise<MermaidApi> {
  if (window.mermaid) return Promise.resolve(window.mermaid);
  if (window.__hubMermaidPromise) return window.__hubMermaidPromise;

  window.__hubMermaidPromise = new Promise<MermaidApi>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-hub-mermaid="true"]');

    if (existingScript) {
      existingScript.addEventListener('load', () => {
        if (window.mermaid) resolve(window.mermaid);
        else reject(new Error('Mermaid loaded without global API'));
      }, { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Mermaid')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = MERMAID_CDN;
    script.async = true;
    script.dataset.hubMermaid = 'true';
    script.addEventListener('load', () => {
      if (window.mermaid) resolve(window.mermaid);
      else reject(new Error('Mermaid loaded without global API'));
    }, { once: true });
    script.addEventListener('error', () => reject(new Error('Failed to load Mermaid')), { once: true });
    document.head.appendChild(script);
  });

  return window.__hubMermaidPromise;
}

function makeMermaidConfig(isDark: boolean): Record<string, unknown> {
  const t = makeTokens(isDark);
  return {
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    flowchart: {
      htmlLabels: true,
      curve: 'basis',
      useMaxWidth: false,
    },
    sequence: { useMaxWidth: false },
    gantt: { useMaxWidth: false },
    themeVariables: {
      darkMode: isDark,
      background: t.bg,
      mainBkg: t.surface,
      secondBkg: t.surfaceHov,
      primaryColor: t.surface,
      primaryTextColor: t.fg,
      primaryBorderColor: t.borderStrong,
      lineColor: t.fgMuted,
      textColor: t.fg,
      nodeBorder: t.borderStrong,
      clusterBkg: t.accentSoft,
      clusterBorder: t.accentBorder,
      edgeLabelBackground: t.bg,
      tertiaryColor: t.accentSoft,
      tertiaryBorderColor: t.accentBorder,
      noteBkgColor: t.warning,
      noteTextColor: isDark ? '#111111' : '#ffffff',
    },
  };
}

function prepareSvg(svg: string): string {
  const cleanedSvg = svg
    .replace(/<br>/g, '<br />')
    .replace(/max-width:\s*[^;"']+;?/gi, '')
    .replace(/height:\s*auto;?/gi, '');

  return DOMPurify.sanitize(cleanedSvg, {
    USE_PROFILES: { svg: true, svgFilters: true, html: true },
    ADD_TAGS: SANITIZE_SVG_TAGS,
    ADD_ATTR: SANITIZE_SVG_ATTR,
  });
}

function getDistance(a: PointerPoint, b: PointerPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getMidpoint(a: PointerPoint, b: PointerPoint): PointerPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function toLocalPoint(target: HTMLElement, event: React.PointerEvent<HTMLDivElement>): PointerPoint {
  const rect = target.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

const MermaidViewer: React.FC<MermaidViewerProps> = ({ chart, isDark }) => {
  const t = useMemo(() => makeTokens(isDark), [isDark]);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const pointersRef = useRef(new Map<number, PointerPoint>());
  const dragRef = useRef<{ pointerId: number; start: PointerPoint; origin: ViewState } | null>(null);
  const pinchRef = useRef<{ distance: number; midpoint: PointerPoint; origin: ViewState } | null>(null);
  const [view, setView] = useState<ViewState>({ scale: 1, x: 0, y: 0 });
  const [svg, setSvg] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const styles = useMemo(() => ({
    wrapBg: t.bg,
    panelBg: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.42)',
    border: t.border,
    text: t.fg,
    muted: t.fgMuted,
    buttonBg: t.surface,
    codeBg: t.codeBg,
  }), [isDark, t]);

  useEffect(() => {
    let cancelled = false;
    const id = `hub-mermaid-${Math.random().toString(36).slice(2)}`;

    setStatus('loading');
    setErrorMessage('');
    setSvg('');

    loadMermaid()
      .then(async (mermaid) => {
        mermaid.initialize(makeMermaidConfig(isDark));
        const rendered = await mermaid.render(id, chart.trim());
        if (cancelled) return;
        setSvg(prepareSvg(rendered.svg));
        setView({ scale: 1, x: 0, y: 0 });
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Не удалось отрисовать Mermaid-схему');
      });

    return () => { cancelled = true; };
  }, [chart, isDark]);

  const zoomAt = useCallback((nextScale: number, clientX?: number, clientY?: number) => {
    const viewport = viewportRef.current;
    const clampedScale = clamp(nextScale, MIN_SCALE, MAX_SCALE);

    setView((current) => {
      if (!viewport || clientX === undefined || clientY === undefined) {
        return { ...current, scale: clampedScale };
      }

      const rect = viewport.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      const ratio = clampedScale / current.scale;

      return {
        scale: clampedScale,
        x: localX - (localX - current.x) * ratio,
        y: localY - (localY - current.y) * ratio,
      };
    });
  }, []);

  const resetView = useCallback(() => {
    setView({ scale: 1, x: 0, y: 0 });
  }, []);

  const fitToScreen = useCallback(() => {
    const viewport = viewportRef.current;
    const svgElement = viewport?.querySelector('svg');
    if (!viewport || !svgElement) { resetView(); return; }

    const viewportRect = viewport.getBoundingClientRect();
    const svgBox = svgElement.getBBox?.();
    const svgWidth = svgBox?.width || svgElement.clientWidth || 1;
    const svgHeight = svgBox?.height || svgElement.clientHeight || 1;
    const scale = clamp(Math.min((viewportRect.width - 48) / svgWidth, (viewportRect.height - 48) / svgHeight), MIN_SCALE, MAX_SCALE);

    setView({
      scale,
      x: Math.max(24, (viewportRect.width - svgWidth * scale) / 2),
      y: Math.max(24, (viewportRect.height - svgHeight * scale) / 2),
    });
  }, [resetView]);

  const handleWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
    zoomAt(view.scale + delta, event.clientX, event.clientY);
  }, [view.scale, zoomAt]);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    const point = toLocalPoint(target, event);
    pointersRef.current.set(event.pointerId, point);

    if (pointersRef.current.size === 1) {
      dragRef.current = {
        pointerId: event.pointerId,
        start: point,
        origin: view,
      };
      pinchRef.current = null;
      return;
    }

    const points = Array.from(pointersRef.current.values());
    if (points.length >= 2) {
      dragRef.current = null;
      pinchRef.current = {
        distance: getDistance(points[0], points[1]),
        midpoint: getMidpoint(points[0], points[1]),
        origin: view,
      };
    }
  }, [view]);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, toLocalPoint(event.currentTarget, event));

    if (pointersRef.current.size >= 2 && pinchRef.current) {
      const points = Array.from(pointersRef.current.values());
      const distance = getDistance(points[0], points[1]);
      const midpoint = getMidpoint(points[0], points[1]);
      const nextScale = clamp(pinchRef.current.origin.scale * (distance / Math.max(1, pinchRef.current.distance)), MIN_SCALE, MAX_SCALE);
      const ratio = nextScale / pinchRef.current.origin.scale;

      setView({
        scale: nextScale,
        x: midpoint.x - (pinchRef.current.midpoint.x - pinchRef.current.origin.x) * ratio,
        y: midpoint.y - (pinchRef.current.midpoint.y - pinchRef.current.origin.y) * ratio,
      });
      return;
    }

    if (dragRef.current?.pointerId === event.pointerId) {
      setView({
        scale: dragRef.current.origin.scale,
        x: dragRef.current.origin.x + toLocalPoint(event.currentTarget, event).x - dragRef.current.start.x,
        y: dragRef.current.origin.y + toLocalPoint(event.currentTarget, event).y - dragRef.current.start.y,
      });
    }
  }, []);

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    dragRef.current = null;
    pinchRef.current = null;

    const remaining = Array.from(pointersRef.current.entries());
    if (remaining.length === 1) {
      const [pointerId, point] = remaining[0];
      dragRef.current = { pointerId, start: point, origin: view };
    }
  }, [view]);

  return (
    <div
      className="not-prose my-6 overflow-hidden rounded-2xl"
      style={{
        background: styles.wrapBg,
        border: `1px solid ${styles.border}`,
        boxShadow: isDark
          ? '0 18px 50px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.04)'
          : '0 14px 34px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.65)',
      }}
    >
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          padding: '10px 12px', borderBottom: `1px solid ${styles.border}`, color: styles.text,
          background: styles.panelBg,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <Move size={16} style={{ color: styles.muted, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Mermaid-схема</span>
          <span style={{ fontSize: 12, color: styles.muted, whiteSpace: 'nowrap' }}>
            {Math.round(view.scale * 100)}%
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button type="button" onClick={() => zoomAt(view.scale - SCALE_STEP)} aria-label="Уменьшить схему" style={buttonStyle(styles)}>
            <Minus size={15} />
          </button>
          <button type="button" onClick={() => zoomAt(view.scale + SCALE_STEP)} aria-label="Увеличить схему" style={buttonStyle(styles)}>
            <Plus size={15} />
          </button>
          <button type="button" onClick={fitToScreen} aria-label="Вписать схему" style={buttonStyle(styles)}>
            <Maximize2 size={15} />
          </button>
          <button type="button" onClick={resetView} aria-label="Сбросить масштаб" style={buttonStyle(styles)}>
            <RefreshCcw size={15} />
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          position: 'relative', minHeight: 360, maxHeight: 'min(72vh, 760px)', overflow: 'hidden',
          touchAction: 'none', cursor: status === 'ready' ? 'grab' : 'default', background: styles.codeBg,
        }}
      >
        {status === 'loading' && (
          <div style={centerStyle(styles)}>
            <div style={{ fontWeight: 700 }}>Рендерим Mermaid…</div>
            <div style={{ marginTop: 6, fontSize: 13, color: styles.muted }}>Схема будет доступна для зума и перемещения.</div>
          </div>
        )}

        {status === 'error' && (
          <div style={{ ...centerStyle(styles), alignItems: 'stretch', textAlign: 'left' }}>
            <div style={{ fontWeight: 700, color: styles.text }}>Не удалось отрисовать Mermaid-схему</div>
            <div style={{ marginTop: 6, color: styles.muted }}>{errorMessage}</div>
            <pre style={{
              marginTop: 14, maxHeight: 220, overflow: 'auto', padding: 12, borderRadius: 12,
              background: styles.wrapBg, border: `1px solid ${styles.border}`, color: styles.text,
              whiteSpace: 'pre-wrap', fontSize: 12,
            }}>{chart}</pre>
          </div>
        )}

        {status === 'ready' && (
          <div
            style={{
              position: 'absolute', left: 0, top: 0, transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
              transformOrigin: '0 0', padding: 24, minWidth: 'max-content', minHeight: 'max-content',
            }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        )}
      </div>

      <div style={{
        padding: '8px 12px', borderTop: `1px solid ${styles.border}`, color: styles.muted,
        fontSize: 12, background: styles.panelBg,
      }}>
        Перетаскивайте схему мышью/пальцем, крутите колесо для масштаба или используйте pinch-to-zoom на тач-экране.
      </div>
    </div>
  );
};

function buttonStyle(styles: { buttonBg: string; border: string; text: string }): React.CSSProperties {
  return {
    width: 30,
    height: 30,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    border: `1px solid ${styles.border}`,
    background: styles.buttonBg,
    color: styles.text,
    cursor: 'pointer',
  };
}

function centerStyle(styles: { text: string; muted: string }): React.CSSProperties {
  return {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    textAlign: 'center',
    color: styles.text,
  };
}

export default MermaidViewer;
