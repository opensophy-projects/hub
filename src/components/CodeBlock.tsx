import React, { useState, useRef } from 'react';
import { Copy, Maximize2, ChevronDown, ChevronUp, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  isDark: boolean;
  maxLines?: number;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ 
  code, 
  language = 'plaintext', 
  isDark,
  maxLines = 10 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  const lines = code.split('\n');
  const shouldCollapse = lines.length > maxLines;
  const displayCode = !isExpanded && shouldCollapse 
    ? lines.slice(0, maxLines).join('\n') 
    : code;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFullscreen = () => {
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  return (
    <>
      <div className={`relative my-4 rounded-lg overflow-hidden border ${
        isDark ? 'bg-[#1e1e1e] border-white/10' : 'bg-[#f5f5f5] border-black/10'
      }`}>
        {/* Header with language and buttons */}
        <div className={`flex items-center justify-between px-4 py-2 border-b ${
          isDark ? 'bg-[#2d2d2d] border-white/10' : 'bg-[#e8e8e8] border-black/10'
        }`}>
          <span className={`text-xs font-semibold ${
            isDark ? 'text-white/70' : 'text-black/70'
          }`}>
            {language}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className={`p-1.5 rounded transition-colors ${
                isDark 
                  ? 'hover:bg-white/10 text-white/70 hover:text-white' 
                  : 'hover:bg-black/10 text-black/70 hover:text-black'
              }`}
              title="Копировать код"
            >
              {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleFullscreen}
              className={`p-1.5 rounded transition-colors ${
                isDark 
                  ? 'hover:bg-white/10 text-white/70 hover:text-white' 
                  : 'hover:bg-black/10 text-black/70 hover:text-black'
              }`}
              title="Открыть во весь экран"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Code content */}
        <div className="relative">
          <pre className="p-4 overflow-x-auto m-0">
            <code
              ref={codeRef}
              className={`language-${language} text-sm ${
                isDark ? 'text-white' : 'text-black'
              }`}
              style={{ 
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                whiteSpace: 'pre'
              }}
            >
              {displayCode}
            </code>
          </pre>

          {/* Gradient overlay when collapsed */}
          {shouldCollapse && !isExpanded && (
            <div 
              className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
              style={{
                background: isDark 
                  ? 'linear-gradient(to bottom, transparent, #1e1e1e)' 
                  : 'linear-gradient(to bottom, transparent, #f5f5f5)'
              }}
            />
          )}
        </div>

        {/* Expand/Collapse button */}
        {shouldCollapse && (
          <div className={`border-t ${
            isDark ? 'border-white/10' : 'border-black/10'
          }`}>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`w-full px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                isDark 
                  ? 'text-white/70 hover:text-white hover:bg-white/5' 
                  : 'text-black/70 hover:text-black hover:bg-black/5'
              }`}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Свернуть
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Показать весь код ({lines.length} строк)
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={closeFullscreen}
        >
          <div
            className={`fixed inset-0 ${
              isDark ? 'bg-black/80' : 'bg-white/80'
            }`}
            style={{ backdropFilter: 'blur(4px)' }}
          />

          <div
            className={`relative z-[101] max-h-[90vh] max-w-[95vw] w-full rounded-lg shadow-2xl overflow-hidden ${
              isDark ? 'bg-[#1e1e1e]' : 'bg-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fullscreen Header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b ${
              isDark ? 'bg-[#2d2d2d] border-white/10' : 'bg-[#e8e8e8] border-black/10'
            }`}>
              <span className={`text-sm font-semibold ${
                isDark ? 'text-white' : 'text-black'
              }`}>
                {language} ({lines.length} строк)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className={`px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-2 ${
                    isDark 
                      ? 'hover:bg-white/10 text-white/70 hover:text-white' 
                      : 'hover:bg-black/10 text-black/70 hover:text-black'
                  }`}
                >
                  {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {isCopied ? 'Скопировано' : 'Копировать'}
                </button>
                <button
                  onClick={closeFullscreen}
                  className={`px-3 py-1.5 rounded text-sm transition-colors ${
                    isDark 
                      ? 'hover:bg-white/10 text-white/70 hover:text-white' 
                      : 'hover:bg-black/10 text-black/70 hover:text-black'
                  }`}
                >
                  Закрыть
                </button>
              </div>
            </div>

            {/* Fullscreen Code */}
            <div className="overflow-auto max-h-[calc(90vh-60px)]">
              <pre className="p-6 m-0">
                <code
                  className={`language-${language} text-sm ${
                    isDark ? 'text-white' : 'text-black'
                  }`}
                  style={{ 
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    whiteSpace: 'pre'
                  }}
                >
                  {code}
                </code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CodeBlock;