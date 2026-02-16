import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface MathFormulaProps {
  formula: string;
  displayMode?: boolean;
}

const MathFormula: React.FC<MathFormulaProps> = ({ formula, displayMode = false }) => {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLSpanElement | HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderMath = async () => {
      if (!containerRef.current) return;

      try {
        const katex = (await import('katex')).default;
        
        katex.render(formula, containerRef.current, {
          displayMode,
          throwOnError: false,
          errorColor: isDark ? '#ff6b6b' : '#c92a2a',
          strict: false,
        });
        
        setError(null);
      } catch (err) {
        console.error('KaTeX rendering error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render formula');
      }
    };

    renderMath();
  }, [formula, displayMode, isDark]);

  useEffect(() => {
    const loadKatexCSS = async () => {
      if (!document.getElementById('katex-css')) {
        const link = document.createElement('link');
        link.id = 'katex-css';
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
        document.head.appendChild(link);
      }
    };

    loadKatexCSS();
  }, []);

  if (error) {
    return (
      <span
        className={`font-mono text-xs px-2 py-1 rounded ${
          isDark ? 'bg-red-900/20 text-red-300' : 'bg-red-100 text-red-700'
        }`}
        title={error}
      >
        [Math Error]
      </span>
    );
  }

  if (displayMode) {
    return (
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className="my-4 overflow-x-auto flex justify-center"
      />
    );
  }

  return <span ref={containerRef as React.RefObject<HTMLSpanElement>} className="inline-block mx-1" />;
};

export default MathFormula;
