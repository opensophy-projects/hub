import { useState, useRef, useContext } from 'react';
import { Copy, Maximize2, ChevronDown, Search, X } from 'lucide-react';
import { TableContext } from '@/lib/htmlParser';

interface CodeBlockProps {
  code: string;
  language?: string;
}

// Безопасное экранирование спецсимволов регулярных выражений
const escapeRegExp = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export function CodeBlock({ code }: CodeBlockProps) {
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

  const highlightMatch = (text: string) => {
    if (!searchQuery) return <>{text}</>;
    
    const escapedQuery = escapeRegExp(searchQuery);
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    
    return (
      <>
        {parts.map((p, i) =>
          p.toLowerCase() === searchQuery.toLowerCase() ? (
            <span key={i} style={{ background: '#78350f', color: '#fff' }}>
              {p}
            </span>
          ) : (
            <span key={i}>{p}</span>
          )
        )}
      </>
    );
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

  const CodeBody = (list: string[]) => (
    <pre
      className="p-4 text-sm font-mono not-prose"
      style={{ background: bg, color: fg }}
    >
      {list.map((l, i) => (
        <div key={i} className="whitespace-pre" style={{ color: fg }}>
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
        {CodeBody(displayedLines)}
      </div>

      {isLongCode && !isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className={`w-full border-t py-3 text-sm ${border}`}
          style={{ background: bg, color: fg }}
        >
          <ChevronDown size={16} /> Открыть полностью ({lines.length} строк)
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
            className={`border-b px-6 py-4 flex justify-between ${border}`}
            style={{ background: bg }}
          >
            {SearchBox}
            <button onClick={() => setIsFullscreen(false)}>✕</button>
          </div>

          <div className="flex-1 overflow-auto not-prose">
            {CodeBody(lines)}
          </div>

          <div
            className={`border-t px-6 py-3 flex justify-between ${border}`}
            style={{ background: bg, color: fg }}
          >
            <span className="opacity-60">Всего строк: {lines.length}</span>
            <button onClick={handleCopy}>
              <Copy size={14} /> {isCopied ? 'Скопировано!' : 'Копировать'}
            </button>
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