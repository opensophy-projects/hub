import React, { useEffect, useRef, useState, useContext, useCallback } from 'react';
import { TableContext } from '../lib/htmlParser';

interface MermaidDiagramProps {
  code: string;
  color?: string;
  isDark?: boolean;
}

// ─── Mermaid lazy singleton ────────────────────────────────────────────────────

let mermaidPromise: Promise<any> | null = null;

async function getMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(m => m.default);
  }
  return mermaidPromise;
}

// Глобальный счётчик — ID должен быть уникальным на весь lifetime страницы
let globalIdCounter = 0;
function nextId() {
  return `mermaid-svg-${++globalIdCounter}-${Date.now()}`;
}

// ─── Component ─────────────────────────────────────────────────────────────────

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code, color, isDark = false }) => {
  // Один ref — всегда монтирован, mermaid пишет в него напрямую
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  const render = useCallback(async () => {
    if (!containerRef.current) return;

    setStatus('loading');
    setErrorMsg('');
    containerRef.current.innerHTML = '';

    try {
      const mermaid = await getMermaid();

      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? 'dark' : 'default',
        securityLevel: 'loose',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        themeVariables: isDark
          ? {
              primaryColor: '#1e1e2e',
              primaryTextColor: '#cdd6f4',
              primaryBorderColor: color || 'rgba(255,255,255,0.18)',
              lineColor: 'rgba(255,255,255,0.35)',
              secondaryColor: '#181825',
              tertiaryColor: '#1e1e2e',
              background: '#11111b',
              mainBkg: '#1e1e2e',
              nodeBorder: color || 'rgba(255,255,255,0.22)',
              clusterBkg: 'rgba(255,255,255,0.04)',
              titleColor: '#cdd6f4',
              edgeLabelBackground: '#181825',
            }
          : {
              primaryColor: '#ede9fe',
              primaryTextColor: '#1e1b4b',
              primaryBorderColor: color || 'rgba(0,0,0,0.15)',
              lineColor: 'rgba(0,0,0,0.35)',
              secondaryColor: '#f5f3ff',
              tertiaryColor: '#ddd6fe',
              background: '#faf9f7',
              mainBkg: '#f5f3ff',
              nodeBorder: color || 'rgba(0,0,0,0.18)',
              clusterBkg: 'rgba(0,0,0,0.03)',
              titleColor: '#1e1b4b',
              edgeLabelBackground: '#f5f3ff',
            },
      });

      // Каждый вызов render() получает уникальный ID
      const id = nextId();
      const { svg } = await mermaid.render(id, code.trim());

      if (containerRef.current) {
        containerRef.current.innerHTML = svg;
        const svgEl = containerRef.current.querySelector('svg');
        if (svgEl) {
          svgEl.style.maxWidth = '100%';
          svgEl.style.height = 'auto';
          svgEl.style.display = 'block';
          svgEl.removeAttribute('width');
          svgEl.removeAttribute('height');
        }
        setStatus('ready');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMsg(msg);
      setStatus('error');
    }
  }, [code, isDark, color]);

  useEffect(() => {
    // setTimeout(0) гарантирует что ref уже примонтирован
    const timer = setTimeout(render, 0);
    return () => clearTimeout(timer);
  }, [render]);

  const hasColor = !!color;
  const borderColor = color || (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)');

  return (
    <div
      style={{
        margin: '1.5rem 0',
        borderRadius: 12,
        border: `1px solid ${borderColor}`,
        background: isDark ? '#11111b' : '#faf9f7',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Цветная полоска сверху */}
      {hasColor && (
        <div style={{ height: 3, background: color, flexShrink: 0 }} />
      )}

      {/* Загрузка */}
      {status === 'loading' && (
        <div style={{
          padding: '32px 24px', textAlign: 'center', fontSize: 13,
          color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
        }}>
          Загрузка диаграммы…
        </div>
      )}

      {/* Ошибка */}
      {status === 'error' && (
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
            {errorMsg}
          </pre>
          <div style={{
            marginTop: 10, padding: '8px 12px', borderRadius: 7, fontSize: 11,
            background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
            color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
            fontFamily: 'ui-monospace, monospace', whiteSpace: 'pre',
          }}>
            {code}
          </div>
        </div>
      )}

      {/*
        Контейнер SVG — ВСЕГДА в DOM чтобы ref не терял элемент при смене статуса.
        Скрыт через visibility/height пока не 'ready'.
      */}
      <div
        ref={containerRef}
        style={{
          padding: status === 'ready' ? '20px 24px' : 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          visibility: status === 'ready' ? 'visible' : 'hidden',
          height: status === 'ready' ? 'auto' : 0,
          overflow: 'hidden',
        }}
      />
    </div>
  );
};

// ─── Context-aware wrapper ─────────────────────────────────────────────────────

const MermaidDiagramWithContext: React.FC<Omit<MermaidDiagramProps, 'isDark'>> = (props) => {
  const { isDark } = useContext(TableContext);
  return <MermaidDiagram {...props} isDark={isDark} />;
};

export { MermaidDiagram };
export default MermaidDiagramWithContext;