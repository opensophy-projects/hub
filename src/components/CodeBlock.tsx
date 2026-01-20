import { useState, useRef } from 'react';
import { Copy, Maximize2, ChevronDown } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = 'bash' }: CodeBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const codeRef = useRef<HTMLDivElement>(null);

  const lines = code.split('\n');
  const isLongCode = lines.length > 15;
  const displayedLines = isExpanded ? lines : lines.slice(0, 15);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFullscreen = () => {
    setIsFullscreen(true);
  };

  const codeContent = (
    <div className="bg-slate-950 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          {language}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2 rounded hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200"
            title="Копировать"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={handleFullscreen}
            className="p-2 rounded hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200"
            title="Полный экран"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* Code */}
      <div
        ref={codeRef}
        className="overflow-x-auto max-h-96"
      >
        <pre className="p-4 text-sm font-mono text-slate-100 leading-relaxed">
          <code>
            {displayedLines.map((line, index) => {
              const lineNumber = index + 1;
              const isGradientLine = !isExpanded && isLongCode && lineNumber >= 14 && lineNumber <= 16;

              return (
                <div
                  key={index}
                  className={`${
                    isGradientLine
                      ? 'bg-gradient-to-r from-slate-950/50 to-slate-950/0 text-slate-600'
                      : ''
                  }`}
                >
                  <span className="text-slate-600 mr-4 select-none">{lineNumber}</span>
                  {line}
                </div>
              );
            })}
          </code>
        </pre>
      </div>

      {/* Expand button */}
      {isLongCode && !isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full bg-slate-900 border-t border-slate-800 px-4 py-3 flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200 text-sm font-medium"
        >
          <ChevronDown size={16} />
          Открыть полностью ({lines.length} строк)
        </button>
      )}
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-950 rounded-lg w-full max-w-4xl max-h-screen flex flex-col">
          {/* Fullscreen Header */}
          <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400 uppercase tracking-wide">
              {language} ({lines.length} строк)
            </span>
            <button
              onClick={() => setIsFullscreen(false)}
              className="text-slate-400 hover:text-slate-200 transition-colors text-xl font-semibold"
            >
              ✕
            </button>
          </div>

          {/* Fullscreen Code */}
          <div className="overflow-auto flex-1">
            <pre className="p-6 text-sm font-mono text-slate-100 leading-relaxed">
              <code>
                {lines.map((line, index) => (
                  <div key={index}>
                    <span className="text-slate-600 mr-4 select-none inline-block w-10 text-right">
                      {index + 1}
                    </span>
                    {line}
                  </div>
                ))}
              </code>
            </pre>
          </div>

          {/* Fullscreen Footer */}
          <div className="bg-slate-900 border-t border-slate-800 px-6 py-3 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Всего строк: {lines.length}
            </span>
            <button
              onClick={handleCopy}
              className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 transition-colors text-white text-sm font-medium flex items-center gap-2"
            >
              <Copy size={14} />
              {isCopied ? 'Скопировано!' : 'Копировать'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4">
      {codeContent}
      {isCopied && (
        <div className="mt-2 text-sm text-green-400 flex items-center gap-2">
          ✓ Код скопирован в буфер обмена
        </div>
      )}
    </div>
  );
}
