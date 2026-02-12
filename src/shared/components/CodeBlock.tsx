import React, { useState, useRef, useContext } from 'react';
import { Copy, Maximize2, ChevronDown, Search, X } from 'lucide-react';
import { TableContext } from '../lib/htmlParser';

interface CodeBlockProps {
  code: string;
}

const CodeBody: React.FC<{
  lines: string[];
  matchedLines: Set<number>;
  highlightMatch: (text: string) => JSX.Element;
  fg: string;
  bg: string;
  isDark: boolean;
}> = ({ lines, matchedLines, highlightMatch, fg, bg, isDark }) => (
  <pre
    className="p-4 text-sm font-mono not-prose"
    style={{ background: bg, color: fg }}
  >
    {lines.map((l, i) => (
      <div key={`line-${i}-${l.slice(0, 10)}`} className="whitespace-pre" style={{ color: fg }}>
        <span
          className="inline-block w-8 mr-4 text-right select-none"
          style={{ color: isDark ? '#888' : '#666' }}
        >
          {i + 1}
        </span>
        {matchedLines.has(i) ? highlightMatch(l) : <span>{l}</span>}
      </div>
    ))}
  </pre>
);

export function CodeBlock({ code }: Readonly<CodeBlockProps>) {
  const { isDark } = useContext(TableContext);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const codeRef = useRef<HTMLDivElement>(null);

  const lines = code.split('\n');
  const isLongCode = lines.length > 15;
  const displayedLines = isExpanded ? lines : lines.slice(0, 15);

  const matchedLines = new Set(
    searchQuery
      ? lines
          .map((l, i) => (l.toLowerCase().includes(searchQuery.toLowerCase()) ? i : -1))
          .filter(i => i !== -1)
      : []
  );

  // Подсветка совпадений без RegExp — разбиваем строку вручную по вхождениям
  const highlightMatch = (text: string): JSX.Element => {
    if (!searchQuery) return <>{text}</>;

    const lowerText = text.toLowerCase();
    const lowerQuery = searchQuery.toLowerCase();
    const queryLen = lowerQuery.length;
    const parts: JSX.Element[] = [];
    let lastIndex = 0;
    let partKey = 0;

    while (lastIndex < text.length) {
      const matchIndex = lowerText.indexOf(lowerQuery, lastIndex);
      if (matchIndex === -1) {
        parts.push(<span key={`t-${partKey}`}>{text.slice(lastIndex)}</span>);
        break;
      }
      if (matchIndex > lastIndex) {
        parts.push(<span key={`t-${partKey}`}>{text.slice(lastIndex, matchIndex)}</span>);
        partKey++;
      }
      parts.push(
        <span key={`h-${partKey}`} style={{ background: '#78350f', color: '#fff' }}>
          {text.slice(matchIndex, matchIndex + queryLen)}
        </span>
      );
      partKey++;
      lastIndex = matchIndex + queryLen;
    }

    return <>{parts}</>;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const bg = isDark ? '#0a0a0a' : '#E8E7E3';
  const fg = isDark ? '#ffffff' : '#000000';
  const border = isDark ? 'border-white/10' : 'border-black/10';

  const SearchBox = (
    <div
      className={`flex-1 flex items-center gap-2 px-3 py-2 rounded border mr-3 ${border}`}
      style={{ background: bg, color: fg }}
    >
      <Search size={16} opacity={0.6} />
      <input
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="Поиск..."
        style={{ color: fg }}
        className="flex-1 bg-transparent outline-none text-sm"
      />
      {searchQuery && (
        <button onClick={() => setSearchQuery('')}>
          <X size={14} />
        </button>
      )}
      {matchedLines.size > 0 && (
        <span className="text-xs opacity-60">{matchedLines.size} найдено</span>
      )}
    </div>
  );

  const NormalView = (
    <div
      className={`rounded-lg overflow-hidden border ${border} not-prose`}
      style={{ background: bg }}
    >
      <div
        className={`border-b px-4 py-3 flex justify-between ${border}`}
        style={{ background: bg }}
      >
        {SearchBox}
        <div className="flex gap-2">
          <button onClick={handleCopy}>
            <Copy size={16} />
          </button>
          <button onClick={() => setIsFullscreen(true)}>
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      <div ref={codeRef} className="overflow-auto max-h-96 not-prose">
        <CodeBody
          lines={displayedLines}
          matchedLines={matchedLines}
          highlightMatch={highlightMatch}
          fg={fg}
          bg={bg}
          isDark={isDark}
        />
      </div>

      {isLongCode && !isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className={`w-full border-t py-3 text-sm flex items-center justify-center gap-2 ${border}`}
          style={{ background: bg, color: fg }}
        >
          <ChevronDown size={16} />
          <span>Открыть полностью ({lines.length} строк)</span>
        </button>
      )}
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div
          className={`w-full max-w-4xl max-h-screen flex flex-col rounded-lg border ${border} not-prose`}
          style={{ background: bg }}
        >
          <div
            className={`border-b px-6 py-4 flex items-center justify-between gap-4 ${border}`}
            style={{ background: bg }}
          >
            {SearchBox}

            <div className="flex items-center gap-4 flex-shrink-0">
              <span className="text-sm opacity-60 whitespace-nowrap">
                Всего строк: {lines.length}
              </span>

              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
                }`}
                title={isCopied ? 'Скопировано!' : 'Копировать'}
              >
                <Copy size={14} />
                <span className="text-sm">{isCopied ? 'Скопировано!' : 'Копировать'}</span>
              </button>

              <button
                onClick={() => setIsFullscreen(false)}
                className={`p-2 rounded transition-colors ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
                }`}
                title="Закрыть"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto not-prose">
            <CodeBody
              lines={lines}
              matchedLines={matchedLines}
              highlightMatch={highlightMatch}
              fg={fg}
              bg={bg}
              isDark={isDark}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 not-prose">
      {NormalView}
      {isCopied && (
        <div className="mt-2 text-sm text-green-500">
          ✓ Код скопирован
        </div>
      )}
    </div>
  );
}