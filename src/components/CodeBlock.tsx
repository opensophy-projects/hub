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
  const codeRef = useRef<HTMLDivElement>(null);

  const lines = code.split('\n');
  const isLongCode = lines.length > 15;
  const displayedLines = isExpanded ? lines : lines.slice(0, 15);

  const getMatchedLines = () => {
    if (!searchQuery.trim()) return new Set<number>();
    const set = new Set<number>();
    lines.forEach((l, i) => {
      if (l.toLowerCase().includes(searchQuery.toLowerCase())) set.add(i);
    });
    return set;
  };

  const matchedLines = getMatchedLines();

  const highlightMatch = (text: string) => {
    if (!searchQuery) return text;
    const r = new RegExp(`(${searchQuery})`, 'gi');
    return text.split(r).map((p, i) =>
      r.test(p) ? (
        <span key={i} className={isDark ? 'bg-yellow-900 text-white' : 'bg-yellow-200 text-black'}>
          {p}
        </span>
      ) : p
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const baseBg = isDark ? 'bg-[#0a0a0a]' : 'bg-[#E8E7E3]';

  const SearchBox = (
    <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded border mr-3 ${
      isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-black/10 bg-black/5'
    }`}>
      <Search size={16} className={isDark ? 'text-white/50' : 'text-black/50'} />
      <input
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="Поиск..."
        className={`flex-1 bg-transparent outline-none text-sm ${
          isDark ? 'text-white placeholder-white/40' : 'text-black placeholder-black/40'
        }`}
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          className={`p-1 rounded ${
            isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'
          }`}
        >
          <X size={14} />
        </button>
      )}
      {matchedLines.size > 0 && (
        <span className={`text-xs ml-2 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          {matchedLines.size} найдено
        </span>
      )}
    </div>
  );

  const CodeView = (
    <div className={`rounded-lg overflow-hidden border ${
      isDark ? 'border-white/10' : 'border-black/10'
    } ${baseBg}`}>
      <div className={`border-b px-4 py-3 flex justify-between ${baseBg} ${
        isDark ? 'border-white/10' : 'border-black/10'
      }`}>
        {SearchBox}
        <div className="flex gap-2">
          <button onClick={handleCopy} className={isDark ? 'text-white/70 hover:text-white' : ''}>
            <Copy size={16} />
          </button>
          <button onClick={() => setIsFullscreen(true)} className={isDark ? 'text-white/70 hover:text-white' : ''}>
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      <div ref={codeRef} className="overflow-auto max-h-96">
        <pre className={`p-4 text-sm font-mono ${baseBg} ${isDark ? 'text-white' : 'text-black'}`}>
          <code>
            {displayedLines.map((l, i) => (
              <div key={i} className="whitespace-pre">
                <span className={`inline-block w-8 mr-4 text-right ${
                  isDark ? 'text-white/40' : 'text-black/40'
                }`}>
                  {i + 1}
                </span>
                {matchedLines.has(i) ? highlightMatch(l) : l}
              </div>
            ))}
          </code>
        </pre>
      </div>

      {isLongCode && !isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className={`w-full border-t py-3 text-sm ${
            isDark
              ? 'border-white/10 text-white/70 hover:text-white'
              : 'border-black/10 text-black/70 hover:text-black'
          }`}
        >
          <ChevronDown size={16} /> Открыть полностью ({lines.length} строк)
        </button>
      )}
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className={`w-full max-w-4xl max-h-screen flex flex-col rounded-lg border ${
          isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-black/10 bg-[#E8E7E3]'
        }`}>
          <div className={`border-b px-6 py-4 flex justify-between ${baseBg} ${
            isDark ? 'border-white/10' : 'border-black/10'
          }`}>
            {SearchBox}
            <button onClick={() => setIsFullscreen(false)} className="text-xl">✕</button>
          </div>

          <div className="flex-1 overflow-auto">
            <pre className={`p-6 text-sm font-mono ${baseBg} ${isDark ? 'text-white' : 'text-black'}`}>
              {lines.map((l, i) => (
                <div key={i} className="whitespace-pre">
                  <span className={`inline-block w-10 mr-4 text-right ${
                    isDark ? 'text-white/40' : 'text-black/40'
                  }`}>
                    {i + 1}
                  </span>
                  {matchedLines.has(i) ? highlightMatch(l) : l}
                </div>
              ))}
            </pre>
          </div>

          <div className={`border-t px-6 py-3 flex justify-between ${baseBg} ${
            isDark ? 'border-white/10' : 'border-black/10'
          }`}>
            <span className={isDark ? 'text-white/50' : 'text-black/50'}>
              Всего строк: {lines.length}
            </span>
            <button onClick={handleCopy} className={isDark ? 'text-white' : 'text-black'}>
              <Copy size={14} /> {isCopied ? 'Скопировано!' : 'Копировать'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4">
      {CodeView}
      {isCopied && (
        <div className={`mt-2 text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>
          ✓ Код скопирован
        </div>
      )}
    </div>
  );
}
