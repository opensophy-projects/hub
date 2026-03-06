import React, { useEffect, useRef, useState, useContext, useCallback } from 'react';
import { TableContext } from '../lib/htmlParser';

interface MermaidDiagramProps {
  code: string;
  /** Accent color — top stripe + node borders inside diagram */
  color?: string;
  /** Custom outer border color (independent from accent) */
  borderColor?: string;
  isDark?: boolean;
}

// ─── Lazy-load mermaid once ───────────────────────────────────────────────────

let mermaidPromise: Promise<typeof import('mermaid')> | null = null;
async function getMermaid() {
  if (!mermaidPromise) mermaidPromise = import('mermaid');
  return mermaidPromise;
}

let idCounter = 0;

// ─── Zoom button ──────────────────────────────────────────────────────────────

const ZoomBtn: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  isDark: boolean;
  children: React.ReactNode;
  title: string;
}> = ({ onClick, disabled, isDark, children, title }) => {
  const base   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const hover  = isDark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.11)';
  const border = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)';
  const fg     = isDark ? 'rgba(255,255,255,0.7)'  : 'rgba(0,0,0,0.65)';
  const fgDis  = isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.2)';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: 26, height: 26, borderRadius: 6,
        border: `1px solid ${border}`,
        background: disabled ? 'transparent' : base,
        color: disabled ? fgDis : fg,
        fontSize: 16, lineHeight: 1, cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.12s, color 0.12s',
        flexShrink: 0,
        fontFamily: 'ui-monospace, monospace',
        userSelect: 'none',
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = hover; }}
      onMouseLeave={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = disabled ? 'transparent' : base; }}
    >
      {children}
    </button>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const ZOOM_STEP    = 0.2;
const ZOOM_MIN     = 0.4;
const ZOOM_MAX     = 3.0;
const ZOOM_DEFAULT = 1.0;

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({
  code,
  color,
  borderColor: borderColorProp,
  isDark = false,
}) => {
  const containerRef  = useRef<HTMLDivElement>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom,    setZoom]    = useState(ZOOM_DEFAULT);
  // Stable unique ID per component instance — used as prefix only
  const instanceId = useRef(`mmd-${++idCounter}`);

  // ─── Render mermaid ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      setLoading(true);
      setError(null);

      if (containerRef.current) containerRef.current.innerHTML = '';

      try {
        const { default: mermaid } = await getMermaid();

        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          securityLevel: 'loose',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          themeVariables: isDark
            ? {
                primaryColor:        '#1a1a2e',
                primaryTextColor:    '#e0e0e0',
                primaryBorderColor:  color || 'rgba(255,255,255,0.2)',
                lineColor:           'rgba(255,255,255,0.4)',
                secondaryColor:      '#16213e',
                tertiaryColor:       '#0f3460',
                background:          '#0a0a0a',
                mainBkg:             '#111',
                nodeBorder:          color || 'rgba(255,255,255,0.25)',
                clusterBkg:          'rgba(255,255,255,0.04)',
                titleColor:          '#e0e0e0',
                edgeLabelBackground: '#1a1a1a',
              }
            : {
                primaryColor:        '#f0f0f0',
                primaryTextColor:    '#1a1a1a',
                primaryBorderColor:  color || 'rgba(0,0,0,0.2)',
                lineColor:           'rgba(0,0,0,0.4)',
                secondaryColor:      '#e8e8e8',
                tertiaryColor:       '#ddd',
                background:          '#E8E7E3',
                mainBkg:             '#f8f8f6',
                nodeBorder:          color || 'rgba(0,0,0,0.2)',
                clusterBkg:          'rgba(0,0,0,0.04)',
                titleColor:          '#1a1a1a',
                edgeLabelBackground: '#f0f0f0',
              },
        });

        // Each render needs a truly unique id to avoid mermaid's internal cache
        const renderId = `${instanceId.current}-${Date.now()}`;

        // ─── KEY FIX ────────────────────────────────────────────────────────
        // mermaid v11 writes a temporary <div id="renderId"> straight into
        // document.body if we don't pass a container element as the 3rd arg.
        // Passing containerRef.current keeps everything scoped to our node
        // and prevents the "mermaid version X.Y.Z / Syntax error in text"
        // ghost element appearing at the bottom of the page.
        // ────────────────────────────────────────────────────────────────────
        const { svg } = await mermaid.render(
          renderId,
          code.trim(),
          containerRef.current ?? undefined,
        );

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          const svgEl = containerRef.current.querySelector('svg');
          if (svgEl) {
            svgEl.style.maxWidth = '100%';
            svgEl.style.height   = 'auto';
            svgEl.removeAttribute('width');
          }
        }
      } catch (e: unknown) {
        if (!cancelled) {
          const raw = e instanceof Error ? e.message : String(e);
          // Strip the noisy "Syntax error in text\nmermaid version X.Y.Z\n" prefix
          const clean = raw
            .replace(/^Syntax error in text\s*/i, '')
            .replace(/mermaid version[\s\S]*?\n/gi, '')
            .trim();
          setError(clean || raw);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    render();
    return () => { cancelled = true; };
  }, [code, isDark, color]);

  // ─── Zoom ───────────────────────────────────────────────────────────────────
  const zoomIn    = useCallback(() => setZoom(z => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2))), []);
  const zoomOut   = useCallback(() => setZoom(z => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2))), []);
  const zoomReset = useCallback(() => setZoom(ZOOM_DEFAULT), []);

  // ─── Visual tokens ──────────────────────────────────────────────────────────
  const outerBorder   = borderColorProp || color || (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)');
  const hasAccent     = !!color;
  const toolbarBg     = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.025)';
  const toolbarBorder = isDark ? 'rgba(255,255,255,0.07)'  : 'rgba(0,0,0,0.07)';
  const mutedFg       = isDark ? 'rgba(255,255,255,0.35)'  : 'rgba(0,0,0,0.35)';
  const activeFg      = isDark ? 'rgba(255,255,255,0.7)'   : 'rgba(0,0,0,0.65)';

  return (
    <div
      style={{
        margin: '1.5rem 0',
        borderRadius: 12,
        border: `1px solid ${outerBorder}`,
        background: isDark ? '#0a0a0a' : '#f9f9f7',
        overflow: 'hidden',
        position: 'relative',
        ...(hasAccent || borderColorProp
          ? { boxShadow: `0 0 0 1px ${outerBorder}22` }
          : {}),
      }}
    >
      {/* Цветная полоска-акцент сверху */}
      {hasAccent && (
        <div style={{ height: 3, background: color, borderRadius: '12px 12px 0 0' }} />
      )}

      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 10px',
        borderBottom: `1px solid ${toolbarBorder}`,
        background: toolbarBg,
      }}>
        <ZoomBtn onClick={zoomOut} disabled={zoom <= ZOOM_MIN} isDark={isDark} title="Уменьшить (−)">
          −
        </ZoomBtn>

        <button
          onClick={zoomReset}
          title="Сбросить масштаб до 100%"
          style={{
            minWidth: 44, padding: '2px 5px', borderRadius: 6,
            border: `1px solid ${toolbarBorder}`,
            background: 'transparent', cursor: 'pointer',
            fontSize: 11, fontFamily: 'ui-monospace, monospace',
            color: zoom === ZOOM_DEFAULT ? mutedFg : activeFg,
            transition: 'color 0.12s',
          }}
        >
          {Math.round(zoom * 100)}%
        </button>

        <ZoomBtn onClick={zoomIn} disabled={zoom >= ZOOM_MAX} isDark={isDark} title="Увеличить (+)">
          +
        </ZoomBtn>

        <div style={{ flex: 1 }} />

        {borderColorProp && (
          <div
            title={`Цвет рамки: ${borderColorProp}`}
            style={{
              width: 12, height: 12, borderRadius: 3,
              background: borderColorProp,
              border: `1px solid ${toolbarBorder}`,
              flexShrink: 0,
            }}
          />
        )}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{
          padding: '32px 24px', textAlign: 'center',
          fontSize: 13, color: mutedFg,
        }}>
          Загрузка диаграммы…
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{
          padding: '16px 20px',
          background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.06)',
        }}>
          <div style={{
            fontSize: 12, fontWeight: 700, color: '#ef4444',
            textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6,
          }}>
            Ошибка парсинга диаграммы
          </div>
          <pre style={{
            fontSize: 11, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
            margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, monospace',
          }}>
            {error}
          </pre>
          <details style={{ marginTop: 10 }}>
            <summary style={{
              fontSize: 11, cursor: 'pointer',
              color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
            }}>
              Исходный код
            </summary>
            <div style={{
              marginTop: 6, padding: '8px 12px',
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
              borderRadius: 7, fontSize: 11,
              color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              fontFamily: 'ui-monospace, monospace', whiteSpace: 'pre',
            }}>
              {code}
            </div>
          </details>
        </div>
      )}

      {/*
        The container is always in the DOM so mermaid always has a real node.
        Hidden via display:none while loading or on error.
        The 3rd arg to mermaid.render() keeps the temp element scoped here,
        preventing body pollution ("mermaid version X / Syntax error in text").
      */}
      <div
        style={{
          display: !loading && !error ? 'flex' : 'none',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '20px 24px',
          minHeight: 80,
          overflow: 'auto',
        }}
      >
        <div
          ref={containerRef}
          style={{
            transformOrigin: 'top center',
            transform: `scale(${zoom})`,
            transition: 'transform 0.18s cubic-bezier(0.4,0,0.2,1)',
            marginBottom: zoom > 1 ? `${(zoom - 1) * 50}%` : 0,
          }}
        />
      </div>
    </div>
  );
};

// ─── Context-aware wrapper ────────────────────────────────────────────────────

const MermaidDiagramWithContext: React.FC<Omit<MermaidDiagramProps, 'isDark'>> = (props) => {
  const { isDark } = useContext(TableContext);
  return <MermaidDiagram {...props} isDark={isDark} />;
};

export { MermaidDiagram };
export default MermaidDiagramWithContext;