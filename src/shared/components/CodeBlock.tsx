import React, { useState, useRef, useContext, useMemo, useEffect } from 'react';
import { Copy, Check, Maximize2, Minimize2, ChevronDown, Search, X } from 'lucide-react';
import { TableContext } from '../lib/htmlParser';
import hljs from 'highlight.js/lib/core';

// ---------------------------------------------------------------------------
// Language aliases & lazy loader
// ---------------------------------------------------------------------------

const LANG_ALIASES: Record<string, string> = {
  jsx: 'javascript',
  tsx: 'typescript',
  shell: 'bash',
  sh: 'bash',
  yml: 'yaml',
  md: 'markdown',
  'c++': 'cpp',
  cs: 'csharp',
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
      // prettier-ignore
      const loaders: Record<string, () => Promise<{ default: unknown }>> = {
        javascript: () => import('highlight.js/lib/languages/javascript'),
        typescript: () => import('highlight.js/lib/languages/typescript'),
        python:     () => import('highlight.js/lib/languages/python'),
        bash:       () => import('highlight.js/lib/languages/bash'),
        sql:        () => import('highlight.js/lib/languages/sql'),
        json:       () => import('highlight.js/lib/languages/json'),
        xml:        () => import('highlight.js/lib/languages/xml'),
        html:       () => import('highlight.js/lib/languages/xml'), // html → xml grammar
        css:        () => import('highlight.js/lib/languages/css'),
        yaml:       () => import('highlight.js/lib/languages/yaml'),
        dockerfile: () => import('highlight.js/lib/languages/dockerfile'),
        markdown:   () => import('highlight.js/lib/languages/markdown'),
        go:         () => import('highlight.js/lib/languages/go'),
        rust:       () => import('highlight.js/lib/languages/rust'),
        php:        () => import('highlight.js/lib/languages/php'),
        cpp:        () => import('highlight.js/lib/languages/cpp'),
        csharp:     () => import('highlight.js/lib/languages/csharp'),
        java:       () => import('highlight.js/lib/languages/java'),
      };

      const loader = loaders[normalized];
      if (!loader) {
        loadedLanguages.add(normalized);
        return;
      }

      const module = await loader();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hljs.registerLanguage(normalized, (module as any).default);

      // Register all aliases that map to this language
      for (const [alias, target] of Object.entries(LANG_ALIASES)) {
        if (target === normalized && !loadedLanguages.has(alias)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          hljs.registerLanguage(alias, (module as any).default);
          loadedLanguages.add(alias);
        }
      }
      loadedLanguages.add(normalized);
    } catch (e) {
      console.warn(`Failed to load highlight.js language: ${normalized}`, e);
      loadedLanguages.add(normalized); // mark as attempted so we don't retry forever
    } finally {
      pendingLanguages.delete(normalized);
    }
  })();

  pendingLanguages.set(normalized, promise);
  return promise;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build syntax-highlighted HTML with inline line numbers. */
function buildHighlightedHtml(code: string, lang: string, isDark: boolean): string {
  const lineColor = isDark ? '#888' : '#666';
  const lineStyle = `color:${lineColor};display:inline-block;width:32px;margin-right:16px;text-align:right;user-select:none;`;

  const result = hljs.highlight(code, { language: lang });
  return result.value
    .split('\n')
    .map((line, i) => `<span class="line-number" style="${lineStyle}">${i + 1}</span>${line}`)
    .join('\n');
}

/** Highlight all occurrences of `query` inside `text`. */
function HighlightedText({ text, query }: { text: string; query: string }): JSX.Element {
  if (!query) return <>{text}</>;

  const lower = text.toLowerCase();
  const lowerQ = query.toLowerCase();
  const qLen = lowerQ.length;
  const parts: JSX.Element[] = [];
  let cursor = 0;
  let key = 0;

  while (cursor < text.length) {
    const idx = lower.indexOf(lowerQ, cursor);
    if (idx === -1) {
      parts.push(<span key={key++}>{text.slice(cursor)}</span>);
      break;
    }
    if (idx > cursor) parts.push(<span key={key++}>{text.slice(cursor, idx)}</span>);
    parts.push(
      <span key={key++} style={{ background: '#78350f', color: '#fff' }}>
        {text.slice(idx, idx + qLen)}
      </span>
    );
    cursor = idx + qLen;
  }

  return <>{parts}</>;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface CodeBodyProps {
  lines: string[];
  matchedLines: Set<number>;
  searchQuery: string;
  fg: string;
  bg: string;
  isDark: boolean;
  highlightedHtml: string;
}

const CodeBody: React.FC<CodeBodyProps> = ({
  lines,
  matchedLines,
  searchQuery,
  fg,
  bg,
  isDark,
  highlightedHtml,
}) => (
  <pre className="p-4 text-sm font-mono not-prose hljs" style={{ background: bg, color: fg }}>
    {highlightedHtml ? (
      <code
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        className="language-code"
        style={{ color: fg }}
      />
    ) : (
      lines.map((line, i) => (
        <div key={`${i}-${line.slice(0, 8)}`} className="whitespace-pre" style={{ color: fg }}>
          <span
            className="inline-block w-8 mr-4 text-right select-none"
            style={{ color: isDark ? '#888' : '#666' }}
          >
            {i + 1}
          </span>
          {matchedLines.has(i) ? (
            <HighlightedText text={line} query={searchQuery} />
          ) : (
            <span>{line}</span>
          )}
        </div>
      ))
    )}
  </pre>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface CodeBlockProps {
  code: string;
  language?: string;
}

const PREVIEW_LINES = 15;

export function CodeBlock({ code, language = '' }: Readonly<CodeBlockProps>) {
  const { isDark } = useContext(TableContext);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedHtml, setHighlightedHtml] = useState('');

  const codeRef = useRef<HTMLDivElement>(null);
  const lines = useMemo(() => code.split('\n'), [code]);
  const isLongCode = lines.length > PREVIEW_LINES;
  const displayedLines = isExpanded ? lines : lines.slice(0, PREVIEW_LINES);

  // Lock body scroll in fullscreen
  useEffect(() => {
    document.body.style.overflow = isFullscreen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  // Syntax highlighting
  useEffect(() => {
    // FIX (SonarCloud S6582):
    // Optional chaining is preferred here and semantically correct:
    // !language?.trim() is true when language is undefined, null, or an empty/whitespace string.
    if (!language?.trim()) {
      setHighlightedHtml('');
      return;
    }

    const normalizedLang =
      LANG_ALIASES[language.toLowerCase().trim()] ?? language.toLowerCase().trim();
    let cancelled = false;

    loadLanguage(normalizedLang).then(() => {
      if (cancelled) return;
      try {
        setHighlightedHtml(buildHighlightedHtml(code, normalizedLang, isDark));
      } catch (err) {
        console.warn(`highlight.js error for language "${normalizedLang}":`, err);
        setHighlightedHtml('');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [code, language, isDark]);

  // Search — find which line indices match the query
  const matchedLines = useMemo(() => {
    if (!searchQuery) return new Set<number>();
    const lowerQ = searchQuery.toLowerCase();
    return new Set(
      lines.reduce<number[]>((acc, line, i) => {
        if (line.toLowerCase().includes(lowerQ)) acc.push(i);
        return acc;
      }, [])
    );
  }, [lines, searchQuery]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Theme tokens
  const bg = isDark ? '#0a0a0a' : '#E8E7E3';
  const fg = isDark ? '#ffffff' : '#000000';
  const border = isDark ? 'border-white/10' : 'border-black/10';
  const btnHover = isDark ? 'hover:bg-white/10' : 'hover:bg-black/10';

  // Shared props passed to CodeBody
  const bodyProps: CodeBodyProps = {
    lines: displayedLines,
    matchedLines,
    searchQuery,
    fg,
    bg,
    isDark,
    highlightedHtml,
  };

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
        <span className="text-xs opacity-60 whitespace-nowrap flex-shrink-0">
          {matchedLines.size} найдено
        </span>
      )}
    </div>
  );

  // ── Fullscreen overlay ──────────────────────────────────────────────────
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div
          className={`w-full max-w-4xl max-h-screen flex flex-col rounded-lg border ${border} not-prose`}
          style={{ background: bg }}
        >
          <div
            className={`border-b px-4 md:px-6 py-4 flex flex-wrap items-center justify-between gap-4 ${border}`}
            style={{ background: bg }}
          >
            {SearchBox}
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <span className="text-xs md:text-sm opacity-60 whitespace-nowrap">
                Строк: {lines.length}
              </span>
              <button
                onClick={handleCopy}
                className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${border} ${btnHover}`}
                style={{ color: isCopied ? '#22c55e' : fg }}
                title={isCopied ? 'Скопировано!' : 'Копировать'}
              >
                {isCopied ? <Check size={14} /> : <Copy size={14} />}
                <span className="leading-none" style={{ fontSize: '10px' }}>
                  {isCopied ? 'Готово' : 'Копировать'}
                </span>
              </button>
              <button
                onClick={() => setIsFullscreen(false)}
                className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${border} ${btnHover}`}
                style={{ color: fg }}
                title="Закрыть"
              >
                <Minimize2 size={14} />
                <span className="leading-none" style={{ fontSize: '10px' }}>Свернуть</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto not-prose">
            {/* Pass full lines list (not just preview) in fullscreen */}
            <CodeBody {...bodyProps} lines={lines} />
          </div>
        </div>
      </div>
    );
  }

  // ── Normal view ─────────────────────────────────────────────────────────
  return (
    <div className="my-4 not-prose">
      <div
        className={`rounded-lg overflow-hidden border ${border} not-prose`}
        style={{ background: bg }}
      >
        <div
          className={`border-b px-3 md:px-4 py-3 flex flex-wrap gap-2 items-center ${border}`}
          style={{ background: bg }}
        >
          {SearchBox}
          <div className="flex gap-1.5 flex-shrink-0">
            <button
              onClick={handleCopy}
              title={isCopied ? 'Скопировано!' : 'Копировать'}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${border} ${btnHover}`}
              style={{ color: isCopied ? '#22c55e' : fg }}
            >
              {isCopied ? <Check size={14} /> : <Copy size={14} />}
              <span className="leading-none" style={{ fontSize: '10px' }}>
                {isCopied ? 'Готово' : 'Копировать'}
              </span>
            </button>
            <button
              onClick={() => setIsFullscreen(true)}
              title="Полноэкранный режим"
              className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${border} ${btnHover}`}
              style={{ color: fg }}
            >
              <Maximize2 size={14} />
              <span className="leading-none" style={{ fontSize: '10px' }}>Развернуть</span>
            </button>
          </div>
        </div>

        <div ref={codeRef} className="overflow-auto max-h-96 not-prose">
          <CodeBody {...bodyProps} />
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

    </div>
  );
}