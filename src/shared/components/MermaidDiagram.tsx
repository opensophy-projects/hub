import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface MermaidDiagramProps {
  code: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code }) => {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(true);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;

      try {
        setIsRendering(true);
        setError(null);

        const mermaid = (await import('mermaid')).default;

        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          securityLevel: 'loose',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        });

        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, code);

        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
      } finally {
        setIsRendering(false);
      }
    };

    renderDiagram();
  }, [code, isDark]);

  if (error) {
    return (
      <div
        className={`p-4 rounded-lg border my-4 ${
          isDark ? 'bg-red-900/20 border-red-500/50 text-red-300' : 'bg-red-100 border-red-300 text-red-700'
        }`}
      >
        <p className="font-semibold mb-2">Ошибка рендеринга диаграммы Mermaid:</p>
        <pre className="text-xs overflow-auto">{error}</pre>
      </div>
    );
  }

  return (
    <div className="my-6 not-prose">
      <div
        ref={containerRef}
        className={`flex items-center justify-center p-6 rounded-lg border overflow-auto ${
          isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
        }`}
        style={{ minHeight: isRendering ? '200px' : 'auto' }}
      >
        {isRendering && (
          <div className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            Загрузка диаграммы...
          </div>
        )}
      </div>
    </div>
  );
};

export default MermaidDiagram;
