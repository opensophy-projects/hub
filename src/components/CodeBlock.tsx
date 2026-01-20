import { useState, useRef, useContext } from 'react';
import { Copy, Maximize2, ChevronDown, Search, X } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchIndex, setSearchIndex] = useState(0);
  const codeRef = useRef<HTMLDivElement>(null);

  const lines = code.split('\n');
  const isLongCode = lines.length > 15;
  const displayedLines = isExpanded ? lines : lines.slice(0, 15);

  // Поиск по коду
  const getMatchedLines = () => {
    if (!searchQuery.trim()) return new Set();
    
    const matchedSet = new Set<number>();
    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(searchQuery.toLowerCase())) {
        matchedSet.add(index);
      }
    });
    return matchedSet;
  };

  const matchedLines = getMatchedLines();
  const matchCount = matchedLines.size;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFullscreen = () => {
    setIsFullscreen(true);
  };

  const highlightMatch = (text: string) => {
    if (!searchQuery.trim()) return text;
    
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className={isDark ? 'bg-yellow-900 text-white' : 'bg-yellow-200 text-black'}>
          {part}
        </span>
      ) : part
    );
  };

  const codeContent = (
    <div className={`rounded-lg overflow-hidden border ${
      isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-black/10 bg-[#E8E7E3]'
    }`}>
      {/* Toolbar */}
      <div className={`border-b px-4 py-3 flex items-center justify-between ${
        isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-black/10 bg-[#E8E7E3]'
      }`}>
        {/* Search Input */}
        <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded border mr-3 ${
          isDark 
            ? 'border-white/10 bg-white/5' 
            : 'border-black/10 bg-black/5'
        }`}>
          <Search size={16} className={isDark ? 'text-white/50' : 'text-black/50'} />
          <input
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchIndex(0);
            }}
            className={`flex-1 bg-transparent outline-none text-sm ${
              isDark 
                ? 'text-white placeholder-white/40' 
                : 'text-black placeholder-black/40'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchIndex(0);
              }}
              className={`p-1 rounded transition-colors ${
                isDark 
                  ? 'text-white/50 hover:text-white hover:bg-white/10' 
                  : 'text-black/50 hover:text-black hover:bg-black/10'
              }`}
            >
              <X size={14} />
            </button>
          )}
          {matchCount > 0 && (
            <span className={`text-xs font-medium ml-2 ${
              isDark ? 'text-white/60' : 'text-black/60'
            }`}>
              {matchCount} найдено
            </span>
          )}
        </div>

        {/* Copy & Fullscreen buttons */}
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
          isDark ? 'text-white bg-[#0a0a0a]' : 'text-black bg-[#E8E7E3]'
        }`}>
          <code>
            {displayedLines.map((line, index) => {
              const actualLineIndex = isExpanded ? index : index;
              const lineNumber = actualLineIndex + 1;
              const isGradientLine = !isExpanded && isLongCode && lineNumber >= 14 && lineNumber <= 16;
              const isMatched = matchedLines.has(actualLineIndex);

              return (
                <div
                  key={index}
                  className={`whitespace-pre transition-colors ${
                    isMatched 
                      ? isDark 
                        ? 'bg-yellow-900/40' 
                        : 'bg-yellow-100/60'
                      : ''
                  } ${
                    isGradientLine
                      ? isDark
                        ? 'text-white/30'
                        : 'text-black/30'
                      : ''
                  }`}
                >
                  <span className={`mr-4 select-none inline-block w-8 text-right ${
                    isDark ? 'text-white/40' : 'text-black/40'
                  }`}>
                    {lineNumber}
                  </span>
                  {isMatched ? highlightMatch(line) : line}
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
    const matchedLinesFullscreen = getMatchedLines();
    
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className={`rounded-lg w-full max-w-4xl max-h-screen flex flex-col border ${
          isDark 
            ? 'bg-[#0a0a0a] border-white/10' 
            : 'bg-[#E8E7E3] border-black/10'
        }`}>
          {/* Fullscreen Header */}
          <div className={`border-b px-6 py-4 flex items-center justify-between ${
            isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-black/10 bg-[#E8E7E3]'
          }`}>
            <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded border mr-4 ${
              isDark 
                ? 'border-white/10 bg-white/5' 
                : 'border-black/10 bg-black/5'
            }`}>
              <Search size={16} className={isDark ? 'text-white/50' : 'text-black/50'} />
              <input
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`flex-1 bg-transparent outline-none text-sm ${
                  isDark 
                    ? 'text-white placeholder-white/40' 
                    : 'text-black placeholder-black/40'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={`p-1 rounded transition-colors ${
                    isDark 
                      ? 'text-white/50 hover:text-white hover:bg-white/10' 
                      : 'text-black/50 hover:text-black hover:bg-black/10'
                  }`}
                >
                  <X size={14} />
                </button>
              )}
              {matchedLinesFullscreen.size > 0 && (
                <span className={`text-xs font-medium ml-2 ${
                  isDark ? 'text-white/60' : 'text-black/60'
                }`}>
                  {matchedLinesFullscreen.size} найдено
                </span>
              )}
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              className={`transition-colors text-xl font-semibold p-2 rounded ${
                isDark 
                  ? 'text-white/70 hover:text-white hover:bg-white/10' 
                  : 'text-black/70 hover:text-black hover:bg-black/10'
              }`}
            >
              ✕
            </button>
          </div>

          {/* Fullscreen Code */}
          <div className="overflow-auto flex-1">
            <pre className={`p-6 text-sm font-mono leading-relaxed ${
              isDark ? 'text-white bg-[#0a0a0a]' : 'text-black bg-[#E8E7E3]'
            }`}>
              <code>
                {lines.map((line, index) => {
                  const isMatched = matchedLinesFullscreen.has(index);
                  
                  return (
                    <div 
                      key={index}
                      className={`whitespace-pre transition-colors ${
                        isMatched 
                          ? isDark 
                            ? 'bg-yellow-900/40' 
                            : 'bg-yellow-100/60'
                          : ''
                      }`}
                    >
                      <span className={`mr-4 select-none inline-block w-10 text-right ${
                        isDark ? 'text-white/40' : 'text-black/40'
                      }`}>
                        {index + 1}
                      </span>
                      {isMatched ? highlightMatch(line) : line}
                    </div>
                  );
                })}
              </code>
            </pre>
          </div>

          {/* Fullscreen Footer */}
          <div className={`border-t px-6 py-3 flex items-center justify-between ${
            isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-black/10 bg-[#E8E7E3]'
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
