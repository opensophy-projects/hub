import { useState, useRef, useContext } from 'react';
import { Copy, Maximize2, ChevronDown } from 'lucide-react';
import { TableContext } from '@/lib/htmlParser';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = 'bash' }: CodeBlockProps) {
  const { isDark } = useContext(TableContext);
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
    <div className={`rounded-lg overflow-hidden border ${
      isDark ? 'border-white/10' : 'border-black/10'
    }`}>
      {/* Toolbar */}
      <div className={`border-b px-4 py-3 flex items-center justify-end ${
        isDark ? 'border-white/10' : 'border-black/10'
      }`}>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className={`p-2 rounded transition-colors ${
              isDark 
                ? 'text-white/70 hover:text-white hover:bg-white/5' 
                : 'text-black/70 hover:text-black hover:bg-black/5'
            }`}
            title="Копировать"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={handleFullscreen}
            className={`p-2 rounded transition-colors ${
              isDark 
                ? 'text-white/70 hover:text-white hover:bg-white/5' 
                : 'text-black/70 hover:text-black hover:bg-black/5'
            }`}
            title="Полный экран"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* Code */}
      <div
        ref={codeRef}
        className="overflow-x-auto overflow-y-auto max-h-96"
      >
        <pre className={`p-4 text-sm font-mono leading-relaxed ${
          isDark ? 'text-white' : 'text-black'
        }`}>
          <code>
            {displayedLines.map((line, index) => {
              const lineNumber = index + 1;
              const isGradientLine = !isExpanded && isLongCode && lineNumber >= 14 && lineNumber <= 16;

              return (
                <div
                  key={index}
                  className={`whitespace-pre ${
                    isGradientLine
                      ? isDark
                        ? 'text-white/30'
                        : 'text-black/30'
                      : ''
                  }`}
                >
                  <span className={`mr-4 select-none ${
                    isDark ? 'text-white/40' : 'text-black/40'
                  }`}>
                    {lineNumber}
                  </span>
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
          className={`w-full border-t px-4 py-3 flex items-center justify-center gap-2 transition-colors text-sm font-medium ${
            isDark 
              ? 'border-white/10 text-white/70 hover:text-white hover:bg-white/5' 
              : 'border-black/10 text-black/70 hover:text-black hover:bg-black/5'
          }`}
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
        <div className={`rounded-lg w-full max-w-4xl max-h-screen flex flex-col border ${
          isDark 
            ? 'bg-[#0a0a0a] border-white/10' 
            : 'bg-[#E8E7E3] border-black/10'
        }`}>
          {/* Fullscreen Header */}
          <div className={`border-b px-6 py-4 flex items-center justify-between ${
            isDark ? 'border-white/10' : 'border-black/10'
          }`}>
            <span className={`text-sm font-medium ${
              isDark ? 'text-white/70' : 'text-black/70'
            }`}>
              {lines.length} строк
            </span>
            <button
              onClick={() => setIsFullscreen(false)}
              className={`transition-colors text-xl font-semibold ${
                isDark 
                  ? 'text-white/70 hover:text-white' 
                  : 'text-black/70 hover:text-black'
              }`}
            >
              ✕
            </button>
          </div>

          {/* Fullscreen Code */}
          <div className="overflow-auto flex-1">
            <pre className={`p-6 text-sm font-mono leading-relaxed ${
              isDark ? 'text-white' : 'text-black'
            }`}>
              <code>
                {lines.map((line, index) => (
                  <div key={index} className="whitespace-pre">
                    <span className={`mr-4 select-none inline-block w-10 text-right ${
                      isDark ? 'text-white/40' : 'text-black/40'
                    }`}>
                      {index + 1}
                    </span>
                    {line}
                  </div>
                ))}
              </code>
            </pre>
          </div>

          {/* Fullscreen Footer */}
          <div className={`border-t px-6 py-3 flex items-center justify-between ${
            isDark ? 'border-white/10' : 'border-black/10'
          }`}>
            <span className={`text-xs ${
              isDark ? 'text-white/50' : 'text-black/50'
            }`}>
              Всего строк: {lines.length}
            </span>
            <button
              onClick={handleCopy}
              className={`px-3 py-2 rounded transition-colors text-sm font-medium flex items-center gap-2 ${
                isDark 
                  ? 'bg-white/10 hover:bg-white/20 text-white' 
                  : 'bg-black/10 hover:bg-black/20 text-black'
              }`}
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
        <div className={`mt-2 text-sm flex items-center gap-2 ${
          isDark ? 'text-green-400' : 'text-green-600'
        }`}>
          ✓ Код скопирован в буфер обмена
        </div>
      )}
    </div>
  );
}
