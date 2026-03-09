import React, { useState, useRef, useContext, useMemo, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import {
  Copy, Check, Maximize2, Minimize2,
  ChevronDown, ChevronUp, Search, X, Code2,
} from 'lucide-react';
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

const SUPPORTED_LANGUAGES = [
  'javascript', 'typescript', 'python', 'bash',
  'sql', 'json', 'xml', 'html', 'css', 'yaml',
  'dockerfile', 'markdown', 'go', 'rust', 'php',
  'cpp', 'csharp', 'java',
] as const;

const loadedLanguages = new Set<string>();
const pendingLanguages = new Map<string, Promise<void>>();

async function loadLanguage(lang: string): Promise<void> {
  const normalized = LANG_ALIASES[lang] ?? lang;
  if (loadedLanguages.has(normalized)) return;
  const existing = pendingLanguages.get(normalized);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const loaders: Record<string, () => Promise<{ default: unknown }>> = {
        javascript: () => import('highlight.js/lib/languages/javascript'),
        typescript: () => import('highlight.js/lib/languages/typescript'),
        python:     () => import('highlight.js/lib/languages/python'),
        bash:       () => import('highlight.js/lib/languages/bash'),
        sql:        () => import('highlight.js/lib/languages/sql'),
        json:       () => import('highlight.js/lib/languages/json'),
        xml:        () => import('highlight.js/lib/languages/xml'),
        html:       () => import('highlight.js/lib/languages/xml'),
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
      if (!loader) { loadedLanguages.add(normalized); return; }
      const module = await loader();
      hljs.registerLanguage(normalized, (module as any).default);
      for (const [alias, target] of Object.entries(LANG_ALIASES)) {
        if (target === normalized && !loadedLanguages.has(alias)) {
          hljs.registerLanguage(alias, (module as any).default);
          loadedLanguages.add(alias);
        }
      }
      loadedLanguages.add(normalized);
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

// ---------------------------------------------------------------------------
// Highlight builder
// ---------------------------------------------------------------------------

function escapeHtml(str: string): string {
  // replaceAll is correct here: we want every occurrence replaced (S7781)
  return str.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

// Escapes all regex special characters in a string.
// The double-backslash in the replacement ('\\$&') is intentional and correct —
// this is NOT a candidate for String.raw (S7780 false positive here).
function escapeRegex(str: string): string {
  // NOSONAR: typescript:S7780 — double backslash in replacement string is required by RegExp semantics
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function injectSearchHighlight(html: string, query: string): string {
  if (!query) return html;
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  // .replace with a callback is required here — replaceAll does not support tag/text group splitting
  return html.replace(/(<[^>]*>)|([^<]+)/g, (match, tag, text) => {
    if (tag) return tag;
    return text.replace(
      regex,
      '<mark style="background:#854d0e;color:#fff;border-radius:2px;padding:0 1px;">$1</mark>',
    );
  });
}

function buildHighlightedHtml(code: string, lang: string, isDark: boolean, searchQuery: string): string {
  const lineColor = isDark ? '#555' : '#999';
  const lineStyle = [
    `color:${lineColor}`,
    'display:inline-block',
    'width:28px',
    'margin-right:14px',
    'text-align:right',
    'user-select:none',
    'font-size:11px',
  ].join(';');

  let highlighted: string;
  try {
    highlighted = hljs.highlight(code, { language: lang }).value;
  } catch {
    highlighted = escapeHtml(code);
  }

  return highlighted
    .replace(/\n$/, '')
    .split('\n')
    .map((line, i) => {
      const withSearch = injectSearchHighlight(line, searchQuery);
      return `<span class="line-number" style="${lineStyle}">${i + 1}</span>${withSearch}`;
    })
    .join('\n');
}

// ---------------------------------------------------------------------------
// HighlightedText — plain-text fallback
// ---------------------------------------------------------------------------

function HighlightedText({ text, query }: Readonly<{ text: string; query: string }>): JSX.Element {
  if (!query) return <>{text}</>;
  const lower = text.toLowerCase();
  const lowerQ = query.toLowerCase();
  const qLen = lowerQ.length;
  const parts: JSX.Element[] = [];
  let cursor = 0, key = 0;
  while (cursor < text.length) {
    const idx = lower.indexOf(lowerQ, cursor);
    if (idx === -1) { parts.push(<span key={key++}>{text.slice(cursor)}</span>); break; }
    if (idx > cursor) parts.push(<span key={key++}>{text.slice(cursor, idx)}</span>);
    parts.push(
      <span key={key++} style={{ background: '#854d0e', color: '#fff', borderRadius: '2px', padding: '0 1px' }}>
        {text.slice(idx, idx + qLen)}
      </span>,
    );
    cursor = idx + qLen;
  }
  return <>{parts}</>;
}

// ---------------------------------------------------------------------------
// useHighlightedHtml
// ---------------------------------------------------------------------------

function useHighlightedHtml(code: string, language: string, isDark: boolean, searchQuery: string): string {
  const [html, setHtml] = useState('');
  useEffect(() => {
    const normalizedLang = language?.trim()
      ? (LANG_ALIASES[language.toLowerCase().trim()] ?? language.toLowerCase().trim())
      : '';
    let cancelled = false;
    (async () => {
      if (!normalizedLang) {
        // S2681: curly braces required around multi-statement conditional body
        if (!cancelled) {
          setHtml('');
        }
        return;
      }
      await loadLanguage(normalizedLang);
      if (cancelled) return;
      try { setHtml(buildHighlightedHtml(code, normalizedLang, isDark, searchQuery)); }
      catch { if (!cancelled) setHtml(''); }
    })();
    return () => { cancelled = true; };
  }, [code, language, isDark, searchQuery]);
  return html;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface CodeBodyProps {
  readonly lines: string[];
  readonly matchedLines: Set<number>;
  readonly searchQuery: string;
  readonly fg: string;
  readonly bg: string;
  readonly isDark: boolean;
  readonly highlightedHtml: string;
}

const CodeBody = React.forwardRef<HTMLPreElement, CodeBodyProps>(
  ({ lines, matchedLines, searchQuery, fg, bg, isDark, highlightedHtml }, ref) => (
    <pre
      ref={ref}
      className="text-sm font-mono not-prose hljs"
      style={{ background: bg, color: fg, margin: 0, padding: '8px 12px' }}
    >
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
              className="inline-block mr-3.5 text-right select-none"
              style={{ color: isDark ? '#555' : '#999', width: '28px', fontSize: '11px' }}
            >
              {i + 1}
            </span>
            {matchedLines.has(i)
              ? <HighlightedText text={line} query={searchQuery} />
              : <span>{line}</span>}
          </div>
        ))
      )}
    </pre>
  )
);
CodeBody.displayName = 'CodeBody';

// ── ToolbarButton ──────────────────────────────────────────────────────────

interface ToolbarButtonProps {
  readonly onClick: () => void;
  readonly title: string;
  readonly label: string;
  readonly icon: React.ReactNode;
  readonly color?: string;
  readonly borderCls: string;
  readonly hoverCls: string;
  readonly fg: string;
  readonly active?: boolean;
  readonly activeBg?: string;
  readonly btnRef?: React.RefObject<HTMLButtonElement>;
}

function ToolbarButton({ onClick, title, label, icon, color, borderCls, hoverCls, fg, active, activeBg, btnRef }: ToolbarButtonProps) {
  return (
    <button
      ref={btnRef}
      onClick={onClick}
      title={title}
      className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg border transition-colors ${borderCls} ${hoverCls}`}
      style={{ color: color ?? fg, lineHeight: 1, background: active && activeBg ? activeBg : undefined }}
    >
      {icon}
      <span style={{ fontSize: '10px', whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  );
}

// ── SearchBox ──────────────────────────────────────────────────────────────

interface SearchBoxProps {
  readonly value: string;
  readonly onChange: (v: string) => void;
  readonly matchCount: number;
  readonly bg: string;
  readonly fg: string;
  readonly borderCls: string;
}

function SearchBox({ value, onChange, matchCount, bg, fg, borderCls }: SearchBoxProps) {
  return (
    <div className={`flex-1 flex items-center gap-1.5 px-2.5 py-1 rounded border ${borderCls}`}
      style={{ background: bg, color: fg, minWidth: '120px' }}>
      <Search size={13} opacity={0.5} className="flex-shrink-0" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Поиск..."
        style={{ color: fg, fontSize: '12px' }}
        className="flex-1 bg-transparent outline-none min-w-0"
      />
      {value && (
        <button onClick={() => onChange('')} className="flex-shrink-0 opacity-60 hover:opacity-100">
          <X size={12} />
        </button>
      )}
      {matchCount > 0 && (
        <span className="opacity-50 whitespace-nowrap flex-shrink-0" style={{ fontSize: '11px' }}>
          {matchCount} найдено
        </span>
      )}
    </div>
  );
}

// ── LangPicker — rendered into document.body via portal ───────────────────

interface LangPickerProps {
  readonly currentLang: string;
  readonly onSelect: (lang: string) => void;
  readonly onClose: () => void;
  readonly anchorRect: DOMRect;
  readonly bg: string;
  readonly fg: string;
  readonly borderCls: string;
  readonly isDark: boolean;
}

function LangPicker({ currentLang, onSelect, onClose, anchorRect, bg, fg, borderCls, isDark }: LangPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler, true);
    return () => document.removeEventListener('mousedown', handler, true);
  }, [onClose]);

  const top  = anchorRect.bottom + 4;
  const left = anchorRect.right - 140;

  return ReactDOM.createPortal(
    <div
      ref={ref}
      className={`rounded-lg border shadow-2xl overflow-y-auto ${borderCls}`}
      style={{
        position: 'fixed',
        top,
        left,
        background: bg,
        minWidth: '140px',
        maxHeight: '240px',
        zIndex: 99999,
      }}
    >
      {SUPPORTED_LANGUAGES.map((lang) => {
        // S3358: extract nested ternary into a variable
        const isActive = lang === currentLang;
        const activeBgColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
        const itemBg = isActive ? activeBgColor : 'transparent';

        return (
          <button
            key={lang}
            onClick={() => { onSelect(lang); onClose(); }}
            className="w-full flex items-center justify-between px-3 py-1.5 text-left transition-opacity hover:opacity-70"
            style={{ color: fg, background: itemBg, fontSize: '12px' }}
          >
            <span>{lang}</span>
            {isActive && <Check size={11} className="opacity-60 flex-shrink-0" />}
          </button>
        );
      })}
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface CodeBlockProps {
  readonly code: string;
  readonly language?: string;
}

const LINE_HEIGHT_PX  = 21;
const PRE_PADDING_TOP = 8;
const VISIBLE_LINES   = 7;
const COLLAPSED_HEIGHT = PRE_PADDING_TOP + VISIBLE_LINES * LINE_HEIGHT_PX + PRE_PADDING_TOP;

export function CodeBlock({ code, language = '' }: CodeBlockProps) {
  const { isDark } = useContext(TableContext);

  const [isExpanded, setIsExpanded]         = useState(false);
  const [isCopied, setIsCopied]             = useState(false);
  const [isFullscreen, setIsFullscreen]     = useState(false);
  const [searchQuery, setSearchQuery]       = useState('');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [langBtnRect, setLangBtnRect]       = useState<DOMRect | null>(null);
  const [activeLang, setActiveLang]         = useState<string>(language);

  const langBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setActiveLang(language); }, [language]);

  const bg        = isDark ? '#0d0d0d' : '#ECEAE5';
  const fg        = isDark ? '#e8e8e8' : '#1a1a1a';
  const borderCls = isDark ? 'border-white/10' : 'border-black/10';
  const hoverCls  = isDark ? 'hover:bg-white/10' : 'hover:bg-black/10';
  const activeBg  = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

  const lines = useMemo(() => {
    const raw = code.split('\n');
    if (raw[raw.length - 1] === '') raw.pop();
    return raw;
  }, [code]);

  const isLongCode = lines.length > VISIBLE_LINES;

  const highlightedHtml = useHighlightedHtml(code, activeLang, isDark, searchQuery);

  useEffect(() => {
    document.body.style.overflow = isFullscreen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isFullscreen]);

  const matchedLines = useMemo(() => {
    if (!searchQuery) return new Set<number>();
    const lowerQ = searchQuery.toLowerCase();
    return new Set(lines.reduce<number[]>((acc, line, i) => {
      if (line.toLowerCase().includes(lowerQ)) acc.push(i);
      return acc;
    }, []));
  }, [lines, searchQuery]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [code]);

  const handleLangBtnClick = useCallback(() => {
    if (langBtnRef.current) {
      setLangBtnRect(langBtnRef.current.getBoundingClientRect());
    }
    setShowLangPicker((p) => !p);
  }, []);

  const bodyProps: CodeBodyProps = {
    lines,
    matchedLines,
    searchQuery,
    fg,
    bg,
    isDark,
    highlightedHtml,
  };

  const fadeGradient = `linear-gradient(to bottom, transparent 0%, ${bg} 100%)`;

  // ── Shared toolbar elements ─────────────────────────────────────────────

  const copyBtn = (
    <ToolbarButton
      onClick={handleCopy}
      title={isCopied ? 'Скопировано!' : 'Копировать'}
      label={isCopied ? 'Готово' : 'Копировать'}
      icon={isCopied ? <Check size={14} /> : <Copy size={14} />}
      color={isCopied ? '#22c55e' : undefined}
      borderCls={borderCls}
      hoverCls={hoverCls}
      fg={fg}
    />
  );

  const langBtn = (
    <>
      <ToolbarButton
        btnRef={langBtnRef}
        onClick={handleLangBtnClick}
        title="Сменить подсветку"
        label={activeLang || 'Стандарт'}
        icon={<Code2 size={14} />}
        borderCls={borderCls}
        hoverCls={hoverCls}
        fg={fg}
        active={showLangPicker}
        activeBg={activeBg}
      />
      {showLangPicker && langBtnRect && (
        <LangPicker
          currentLang={activeLang}
          onSelect={setActiveLang}
          onClose={() => setShowLangPicker(false)}
          anchorRect={langBtnRect}
          bg={bg}
          fg={fg}
          borderCls={borderCls}
          isDark={isDark}
        />
      )}
    </>
  );

  const searchBoxEl = (
    <SearchBox
      value={searchQuery}
      onChange={setSearchQuery}
      matchCount={matchedLines.size}
      bg={bg}
      fg={fg}
      borderCls={borderCls}
    />
  );

  // ── Fullscreen overlay ──────────────────────────────────────────────────
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div
          className={`w-full max-w-4xl max-h-screen flex flex-col rounded-lg border ${borderCls} not-prose`}
          style={{ background: bg }}
        >
          <div className={`border-b px-3 py-2 flex flex-wrap items-center gap-2 ${borderCls}`} style={{ background: bg }}>
            {searchBoxEl}
            <span style={{ fontSize: '11px', color: fg, opacity: 0.4, whiteSpace: 'nowrap' }}>
              {lines.length} строк
            </span>
            {copyBtn}
            {langBtn}
            <ToolbarButton
              onClick={() => setIsFullscreen(false)}
              title="Свернуть"
              label="Свернуть"
              icon={<Minimize2 size={14} />}
              borderCls={borderCls}
              hoverCls={hoverCls}
              fg={fg}
            />
          </div>
          <div className="flex-1 overflow-auto not-prose">
            <CodeBody {...bodyProps} />
          </div>
        </div>
      </div>
    );
  }

  // ── Normal view ─────────────────────────────────────────────────────────
  return (
    <div className="my-3 not-prose">
      <div className={`rounded-lg overflow-hidden border ${borderCls} not-prose`} style={{ background: bg }}>

        {/* Toolbar */}
        <div className={`border-b px-3 py-2 flex flex-wrap items-center gap-2 ${borderCls}`} style={{ background: bg }}>
          {searchBoxEl}
          <div className="flex gap-1.5 flex-shrink-0">
            {copyBtn}
            {langBtn}
            <ToolbarButton
              onClick={() => setIsFullscreen(true)}
              title="Полноэкранный режим"
              label="Развернуть"
              icon={<Maximize2 size={14} />}
              borderCls={borderCls}
              hoverCls={hoverCls}
              fg={fg}
            />
          </div>
        </div>

        {/* Code area */}
        <div
          className="not-prose relative overflow-hidden transition-[max-height] duration-300"
          style={{ maxHeight: isExpanded ? 'none' : `${COLLAPSED_HEIGHT}px` }}
        >
          <CodeBody {...bodyProps} />

          {isLongCode && !isExpanded && (
            <div
              className="absolute bottom-0 left-0 right-0 pointer-events-none"
              style={{ height: `${LINE_HEIGHT_PX * 2.5}px`, background: fadeGradient }}
            />
          )}
        </div>

        {/* Expand / collapse */}
        {isLongCode && (
          <button
            onClick={() => setIsExpanded((p) => !p)}
            className={`w-full border-t py-2 text-xs flex items-center justify-center gap-1.5 transition-colors ${borderCls} ${hoverCls}`}
            style={{ background: bg, color: fg, opacity: 0.7 }}
          >
            {isExpanded
              ? <><ChevronUp size={13} /><span>Скрыть</span></>
              : <><ChevronDown size={13} /><span>Открыть полностью ({lines.length} строк)</span></>}
          </button>
        )}
      </div>
    </div>
  );
}