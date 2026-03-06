import React, { useState, useRef, useContext, useMemo, useEffect } from 'react';
import { Copy, Maximize2, ChevronDown, Search, X } from 'lucide-react';
import { TableContext } from '../lib/htmlParser';
import hljs from 'highlight.js/lib/core';

const LANG_ALIASES: Record<string, string> = {
  'jsx': 'javascript',
  'tsx': 'typescript',
  'shell': 'bash',
  'sh': 'bash',
  'yml': 'yaml',
  'md': 'markdown',
  'c++': 'cpp',
  'cs': 'csharp',
};

const loadedLanguages = new Set<string>();
const pendingLanguages = new Map<string, Promise<void>>();

async function loadLanguage(lang: string): Promise<void> {
  const normalized = LANG_ALIASES[lang] ?? lang;
  if (loadedLanguages.has(normalized)) return;
  const existing = pendingLanguages.get(normalized);
  if (existing) return existing;

  const promise = (async () => {
    try {
      let module: { default: unknown } | null = null;

      switch (normalized) {
        case 'javascript': module = await import('highlight.js/lib/languages/javascript'); break;
        case 'typescript': module = await import('highlight.js/lib/languages/typescript'); break;
        case 'python':     module = await import('highlight.js/lib/languages/python'); break;
        case 'bash':       module = await import('highlight.js/lib/languages/bash'); break;
        case 'sql':        module = await import('highlight.js/lib/languages/sql'); break;
        case 'json':       module = await import('highlight.js/lib/languages/json'); break;
        case 'xml':        module = await import('highlight.js/lib/languages/xml'); break;
        case 'css':        module = await import('highlight.js/lib/languages/css'); break;
        case 'yaml':       module = await import('highlight.js/lib/languages/yaml'); break;
        case 'dockerfile': module = await import('highlight.js/lib/languages/dockerfile'); break;
        case 'markdown':   module = await import('highlight.js/lib/languages/markdown'); break;
        case 'go':         module = await import('highlight.js/lib/languages/go'); break;
        case 'rust':       module = await import('highlight.js/lib/languages/rust'); break;
        case 'php':        module = await import('highlight.js/lib/languages/php'); break;
        case 'cpp':        module = await import('highlight.js/lib/languages/cpp'); break;
        case 'csharp':     module = await import('highlight.js/lib/languages/csharp'); break;
        case 'java':       module = await import('highlight.js/lib/languages/java'); break;
        case 'html':
          module = await import('highlight.js/lib/languages/xml');
          normalized !== 'xml' && hljs.registerLanguage('html', (module as any).default);
          break;
        default:
          loadedLanguages.add(normalized);
          return;
      }

      if (module) {
        hljs.registerLanguage(normalized, (module as any).default);
        for (const [alias, target] of Object.entries(LANG_ALIASES)) {
          if (target === normalized && !loadedLanguages.has(alias)) {
            hljs.registerLanguage(alias, (module as any).default);
            loadedLanguages.add(alias);
          }
        }
        loadedLanguages.add(normalized);
      }
    } catch (e) {
      console.warn(`Failed to load highlight.js language: ${normalized}`, e);
      loadedLanguages.add(normalized);
    } finally {
      pendingLanguages.delete(normalized);
    }
  })();

  pendingLanguages.set(normalized, promise);
  return promise;
}

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBody: React.FC<{
  lines: string[];
  matchedLines: Set<number>;
  highlightMatch: (text: string) => JSX.Element;
  fg: string;
  bg: string;
  isDark: boolean;
  highlightedHtml?: string;
}> = ({ lines, matchedLines, highlightMatch, fg, bg, isDark, highlightedHtml }) => (
  <pre
    className="p-4 text-sm font-mono not-prose hljs"
    style={{ background: bg, color: fg }}
  >
    {highlightedHtml ? (
      <code
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        className="language-code"
        style={{ color: fg }}
      />
    ) : (
      lines.map((l, i) => (
        <div key={`line-${i}-${l.slice(0, 10)}`} className="whitespace-pre" style={{ color: fg }}>
          <span
            className="inline-block w-8 mr-4 text-right select-none"
            style={{ color: isDark ? '#888' : '#666' }}
          >
            {i + 1}
          </span>
          {matchedLines.has(i) ? highlightMatch(l) : <span>{l}</span>}
        </div>
      ))
    )}
  </pre>
);

export function CodeBlock({ code, language = '' }: Readonly<CodeBlockProps>) {
  const { isDark } = useContext(TableContext);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedHtml, setHighlightedHtml] = useState('');
  const codeRef = useRef<HTMLDivElement>(null);

  const lines = code.split('\n');
  const isLongCode = lines.length > 15;
  const displayedLines = isExpanded ? lines : lines.slice(0, 15);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (!language || !language.trim()) {
      setHighlightedHtml('');
      return;
    }

    const normalizedLang = (LANG_ALIASES[language.toLowerCase().trim()] ?? language.toLowerCase().trim());
    let cancelled = false;

    loadLanguage(normalizedLang).then(() => {
      if (cancelled) return;
      try {
        const result = hljs.highlight(code, { language: normalizedLang });
        const html = result.value
          .split('\n')
          .map(
            (line, i) =>
              `<span class="line-number" style="color:${isDark ? '#888' : '#666'};display:inline-block;width:32px;margin-right:16px;text-align:right;user-select:none;">${i + 1}</span>${line}`
          )
          .join('\n');
        if (!cancelled) setHighlightedHtml(html);
      } catch (err) {
        console.warn(`highlight.js error for language "${normalizedLang}":`, err);
        if (!cancelled) setHighlightedHtml('');
      }
    });

    return () => { cancelled = true; };
  }, [code, language, isDark]);

  const matchedLines = useMemo(
    () =>
      new Set(
        searchQuery
          ? lines
              .map((l, i) => (l.toLowerCase().includes(searchQuery.toLowerCase()) ? i : -1))
              .filter((i) => i !== -1)
          : []
      ),
    [lines, searchQuery]
  );

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
  const btnHover = isDark ? 'hover:bg-white/10' : 'hover:bg-black/10';

  const SearchBox = (
    <div
      className={`flex-1 flex items-center gap-2 px-3 py-2 rounded border ${border}`}
      style={{ background: bg, color: fg, minWidth: 0 }}
    >
      <Search size={16} opacity={0.6} className="flex-shrink-0" />
      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Поиск..."
        style={{ color: fg }}
        className="flex-1 bg-transparent outline-none text-sm min-w-0"
      />
      {searchQuery && (
        <button onClick={() => setSearchQuery('')} className="flex-shrink-0">
          <X size={14} />
        </button>
      )}
      {matchedLines.size > 0 && (
        <span className="text-xs opacity-60 whitespace-nowrap flex-shrink-0">{matchedLines.size} найдено</span>
      )}
    </div>
  );

  const NormalView = (
    <div
      className={`rounded-lg overflow-hidden border ${border} not-prose`}
      style={{ background: bg }}
    >
      <div
        className={`border-b px-3 md:px-4 py-3 flex flex-wrap gap-2 items-center ${border}`}
        style={{ background: bg }}
      >
        {SearchBox}
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={handleCopy} title={isCopied ? 'Скопировано!' : 'Копировать'} className="p-1.5 md:p-2">
            <Copy size={14} className="md:w-4 md:h-4" />
          </button>
          <button onClick={() => setIsFullscreen(true)} title="Полноэкранный режим" className="p-1.5 md:p-2">
            <Maximize2 size={14} className="md:w-4 md:h-4" />
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
          highlightedHtml={highlightedHtml}
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
      <div 
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <div
          className={`w-full max-w-4xl max-h-screen flex flex-col rounded-lg border ${border} not-prose`}
          style={{ background: bg }}
        >
          <div
            className={`border-b px-4 md:px-6 py-4 flex flex-wrap items-center justify-between gap-4 ${border}`}
            style={{ background: bg }}
          >
            {SearchBox}
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 flex-wrap">
              <span className="text-xs md:text-sm opacity-60 whitespace-nowrap">
                Всего строк: {lines.length}
              </span>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${btnHover}`}
                title={isCopied ? 'Скопировано!' : 'Копировать'}
              >
                <Copy size={14} />
                <span className="text-sm hidden md:inline">{isCopied ? 'Скопировано!' : 'Копировать'}</span>
              </button>
              <button
                onClick={() => setIsFullscreen(false)}
                className={`p-2 rounded transition-colors ${btnHover}`}
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
              highlightedHtml={highlightedHtml}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-4 not-prose">
      {NormalView}
      {isCopied && <div className="mt-2 text-sm text-green-500">✓ Код скопирован</div>}
    </div>
  );
}
