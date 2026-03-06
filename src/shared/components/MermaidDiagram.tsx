import React, { useEffect, useRef, useState, useContext } from 'react';
import { TableContext } from '../lib/htmlParser';

interface MermaidDiagramProps {
  code: string;
  color?: string;
  isDark?: boolean;
}

// Lazy-load mermaid once
let mermaidPromise: Promise<typeof import('mermaid')> | null = null;

async function getMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid');
  }
  return mermaidPromise;
}

let idCounter = 0;

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code, color, isDark = false }) => {
  // Single container ref — always rendered in the DOM
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Stable unique ID per component instance
  const idRef = useRef(`mermaid-${++idCounter}`);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      setLoading(true);
      setError(null);

      // Clear previous render immediately
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }

      try {
        const mermaidModule = await getMermaid();
        const mermaid = mermaidModule.default;

        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          securityLevel: 'loose',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          themeVariables: isDark
            ? {
                primaryColor: '#1a1a2e',
                primaryTextColor: '#e0e0e0',
                primaryBorderColor: color || 'rgba(255,255,255,0.2)',
                lineColor: 'rgba(255,255,255,0.4)',
                secondaryColor: '#16213e',
                tertiaryColor: '#0f3460',
                background: '#0a0a0a',
                mainBkg: '#111',
                nodeBorder: color || 'rgba(255,255,255,0.25)',
                clusterBkg: 'rgba(255,255,255,0.04)',
                titleColor: '#e0e0e0',
                edgeLabelBackground: '#1a1a1a',
              }
            : {
                primaryColor: '#f0f0f0',
                primaryTextColor: '#1a1a1a',
                primaryBorderColor: color || 'rgba(0,0,0,0.2)',
                lineColor: 'rgba(0,0,0,0.4)',
                secondaryColor: '#e8e8e8',
                tertiaryColor: '#ddd',
                background: '#E8E7E3',
                mainBkg: '#f8f8f6',
                nodeBorder: color || 'rgba(0,0,0,0.2)',
                clusterBkg: 'rgba(0,0,0,0.04)',
                titleColor: '#1a1a1a',
                edgeLabelBackground: '#f0f0f0',
              },
        });

        // Use a unique id per render to avoid mermaid's internal cache collisions
        const renderId = `${idRef.current}-${Date.now()}`;
        const { svg } = await mermaid.render(renderId, code.trim());

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          const svgEl = containerRef.current.querySelector('svg');
          if (svgEl) {
            svgEl.style.maxWidth = '100%';
            svgEl.style.height = 'auto';
            svgEl.removeAttribute('width');
          }
        }
      } catch (e: unknown) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : String(e);
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    render();
    return () => { cancelled = true; };
  }, [code, isDark, color]);

  const borderColor = color || (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)');
  const hasColor    = !!color;

  return (
    <div
      style={{
        margin: '1.5rem 0',
        borderRadius: 12,
        border: `1px solid ${borderColor}`,
        background: isDark ? '#0a0a0a' : '#f9f9f7',
        overflow: 'hidden',
        position: 'relative',
        ...(hasColor ? { boxShadow: `0 0 0 1px ${borderColor}22` } : {}),
      }}
    >
      {/* Цветная полоска сверху */}
      {hasColor && (
        <div style={{
          height: 3,
          background: color,
          borderRadius: '12px 12px 0 0',
        }} />
      )}

      {loading && (
        <div style={{
          padding: '32px 24px',
          textAlign: 'center',
          fontSize: 13,
          color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
        }}>
          Загрузка диаграммы…
        </div>
      )}

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
          <div style={{
            marginTop: 10, padding: '8px 12px',
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
            borderRadius: 7, fontSize: 11,
            color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
            fontFamily: 'ui-monospace, monospace', whiteSpace: 'pre',
          }}>
            {code}
          </div>
        </div>
      )}

      {/*
        FIX: The container is always in the DOM (not conditionally rendered).
        We just hide it while loading so mermaid.render() always has a real
        DOM node to inject the SVG into via containerRef.
      */}
      <div
        ref={containerRef}
        style={{
          padding: !loading && !error ? '20px 24px' : undefined,
          display: !loading && !error ? 'flex' : 'none',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: !loading && !error ? 80 : undefined,
        }}
      />
    </div>
  );
};

// Context-aware wrapper
const MermaidDiagramWithContext: React.FC<Omit<MermaidDiagramProps, 'isDark'>> = (props) => {
  const { isDark } = useContext(TableContext);
  return <MermaidDiagram {...props} isDark={isDark} />;
};

export { MermaidDiagram };
export default MermaidDiagramWithContext;