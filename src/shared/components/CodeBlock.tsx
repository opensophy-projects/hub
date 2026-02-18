import React, { useState, useRef, useContext, useMemo } from 'react';
import { Copy, Maximize2, ChevronDown, Search, X } from 'lucide-react';
import { TableContext } from '../lib/htmlParser';
import hljs from 'highlight.js/lib/core';

// Импортируем только нужные языки
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import bash from 'highlight.js/lib/languages/bash';
import sql from 'highlight.js/lib/languages/sql';
import json from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml'; // для HTML
import css from 'highlight.js/lib/languages/css';
import yaml from 'highlight.js/lib/languages/yaml';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import markdown from 'highlight.js/lib/languages/markdown';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import php from 'highlight.js/lib/languages/php';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import java from 'highlight.js/lib/languages/java';

// Регистрируем языки
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('jsx', javascript); // JSX использует JavaScript
hljs.registerLanguage('tsx', typescript); // TSX использует TypeScript
hljs.registerLanguage('python', python);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('shell', bash); // алиас для bash
hljs.registerLanguage('sh', bash); // алиас для bash
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('json', json);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml); // алиас для yaml
hljs.registerLanguage('dockerfile', dockerfile);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown); // алиас для markdown
hljs.registerLanguage('go', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('php', php);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('c++', cpp); // алиас для cpp
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('cs', csharp); // алиас для csharp
hljs.registerLanguage('java', java);

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
  const codeRef = useRef<HTMLDivElement>(null);

  const lines = code.split('\n');
  const isLongCode = lines.length > 15;
  const displayedLines = isExpanded ? lines : lines.slice(0, 15);

  const highlightedHtml = useMemo(() => {
    if (!language || language.trim() === '') return '';
    try {
      const normalizedLang = language.toLowerCase().trim();
      const highlighted = hljs.highlight(code, { language: normalizedLang });
      return highlighted.value
        .split('\n')
        .map(
          (line, i) =>
            `<span class="line-number" style="color: ${
              isDark ? '#888' : '#666'
            }; display: inline-block; width: 32px; margin-right: 16px; text-align: right; user-select: none;">${
              i + 1
            }</span>${line}`
        )
        .join('\n');
    } catch (error) {
      console.warn(`Failed to highlight code for language: ${language}`, error);
      return '';
    }
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
      className={`flex-1 flex items-center gap-2 px-3 py-2 rounded border mr-3 ${border}`}
      style={{ background: bg, color: fg }}
    >
      <Search size={16} opacity={0.6} />
      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
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
                className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${btnHover}`}
                title={isCopied ? 'Скопировано!' : 'Копировать'}
              >
                <Copy size={14} />
                <span className="text-sm">{isCopied ? 'Скопировано!' : 'Копировать'}</span>
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
