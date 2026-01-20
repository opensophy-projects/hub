import React, { useEffect, useRef, useState } from 'react';

interface MermaidDiagramProps {
  code: string;
  isDark: boolean;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code, isDark }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;

      try {
        const mermaid = (await import('mermaid')).default;
        
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          securityLevel: 'loose',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        });

        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, code);
        
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
        setError(null);
      } catch (err) {
        console.error('Mermaid render error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
      }
    };

    renderDiagram();
  }, [code, isDark]);

  if (error) {
    return (
      <div className={`rounded-lg border p-4 my-4 ${
        isDark ? 'border-red-800 bg-red-950/30' : 'border-red-200 bg-red-50'
      }`}>
        <div className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
          Ошибка рендеринга Mermaid: {error}
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`flex justify-center items-center p-4 rounded-lg border my-4 ${
        isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
      }`}
    />
  );
};

export default MermaidDiagram;
