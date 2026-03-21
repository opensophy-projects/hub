import React, { useState, useRef, useContext, useMemo, useEffect, useCallback } from 'react';
import {
  Copy, Check, Maximize2, Minimize2,
  ChevronDown, ChevronUp, Search, X, MoreHorizontal,
} from 'lucide-react';
import { TableContext } from '../lib/htmlParser';
import Overlay from './Overlay';
import { useDragScroll } from '@/features/table/hooks/useDragScroll';
import hljs from 'highlight.js/lib/core';

function tk(isDark: boolean) {
  return isDark ? {
    outerBg:     '#0a0a0a',
    barBg:       '#111111',
    codeBg:      '#0d0d0d',
    outerBorder: 'rgba(255,255,255,0.08)',
    barBorder:   'rgba(255,255,255,0.08)',
    btnBg:       'rgba(255,255,255,0.08)',
    btnBdr:      'rgba(255,255,255,0.12)',
    btnHov:      'rgba(255,255,255,0.14)',
    btnClr:      'rgba(255,255,255,0.72)',
    inpBg:       '#1a1a1a',
    inpBdr:      'rgba(255,255,255,0.12)',
    inpFoc:      'rgba(255,255,255,0.26)',
    inpClr:      'rgba(255,255,255,0.88)',
    plhClr:      'rgba(255,255,255,0.28)',
    fg:          '#e8e8e8',
    fgMuted:     'rgba(255,255,255,0.35)',
    lineNum:     '#555',
    footerClr:   'rgba(255,255,255,0.22)',
    outerShadow: '0 2px 12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
    modalShadow: '0 24px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.05)',
    fadeTo:      '#0d0d0d',
    thumb:       'rgba(255,255,255,0.14)',
    thumbHov:    'rgba(255,255,255,0.26)',
    track:       'rgba(255,255,255,0.04)',
  } : {
    outerBg:     '#E8E7E3',
    barBg:       '#d8d7d3',
    codeBg:      '#ECEAE5',
    outerBorder: 'rgba(0,0,0,0.1)',
    barBorder:   'rgba(0,0,0,0.09)',
    btnBg:       'rgba(0,0,0,0.07)',
    btnBdr:      'rgba(0,0,0,0.12)',
    btnHov:      'rgba(0,0,0,0.12)',
    btnClr:      'rgba(0,0,0,0.68)',
    inpBg:       '#E8E7E3',
    inpBdr:      'rgba(0,0,0,0.12)',
    inpFoc:      'rgba(0,0,0,0.28)',
    inpClr:      '#000000',
    plhClr:      'rgba(0,0,0,0.35)',
    fg:          '#1a1a1a',
    fgMuted:     'rgba(0,0,0,0.38)',
    lineNum:     '#999',
    footerClr:   'rgba(0,0,0,0.32)',
    outerShadow: '0 1px 6px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.07)',
    modalShadow: '0 24px 80px rgba(0,0,0,0.2)',
    fadeTo:      '#ECEAE5',
    thumb:       'rgba(0,0,0,0.16)',
    thumbHov:    'rgba(0,0,0,0.28)',
    track:       'rgba(0,0,0,0.04)',
  };
}

const LANG_ALIASES: Record<string, string> = {
  jsx: 'javascript', tsx: 'typescript', shell: 'bash', sh: 'bash',
  yml: 'yaml', md: 'markdown', 'c++': 'cpp', cs: 'csharp',
};

const loadedLanguages  = new Set<string>();
const pendingLanguages = new Map<string, Promise<void>>();

async function loadLanguage(lang: string): Promise<void> {
  const normalized = LANG_ALIASES[lang] ?? lang;
  if (loadedLanguages.has(normalized)) return;
  const existing = pendingLanguages.get(normalized);
  if (existing !== undefined) return existing;
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
    } finally { pendingLanguages.delete(normalized); }
  })();
  pendingLanguages.set(normalized, promise);
  return promise;
}

function escapeHtml(str: string): string {
  return str.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // NOSONAR
}

function injectSearchHighlight(html: string, query: string): string {
  if (!query) return html;
  const re = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return html.replace(/(<[^>]*>)|([^<]+)/g, (_, tag, text) => { // NOSONAR
    if (tag) return tag;
    return text.replace(re, '<mark style="background:#854d0e;color:#fff;border-radius:2px;padding:0 1px;">$1</mark>'); // NOSONAR
  });
}

function buildHighlightedHtml(code: string, lang: string, lineNumColor: string, query: string): string {
  const lineStyle = [
    `color:${lineNumColor}`, 'display:inline-block', 'width:28px',
    'margin-right:14px', 'text-align:right', 'user-select:none', 'font-size:11px',
  ].join(';');
  let highlighted: string;
  try { highlighted = hljs.highlight(code, { language: lang }).value; }
  catch { highlighted = escapeHtml(code); }
  return highlighted.replace(/\n$/, '').split('\n').map((line, i) =>
    `<span style="${lineStyle}">${i + 1}</span>${injectSearchHighlight(line, query)}`
  ).join('\n');
}

function HighlightedText({ text, query }: { readonly text: string; readonly query: string }): JSX.Element {
  if (!query) return <>{text}</>;
  const lower = text.toLowerCase(), lq = query.toLowerCase(), qLen = lq.length;
  const parts: JSX.Element[] = [];
  let cur = 0, k = 0;
  while (cur < text.length) {
    const idx = lower.indexOf(lq, cur);
    if (idx === -1) { parts.push(<span key={k++}>{text.slice(cur)}</span>); break; }
    if (idx > cur) parts.push(<span key={k++}>{text.slice(cur, idx)}</span>);
    parts.push(<span key={k++} style={{ background: '#854d0e', color: '#fff', borderRadius: '2px', padding: '0 1px' }}>{text.slice(idx, idx + qLen)}</span>);
    cur = idx + qLen;
  }
  return <>{parts}</>;
}

function useHighlightedHtml(code: string, language: string, lineNumColor: string, query: string): string {
  const [html, setHtml] = useState('');
  useEffect(() => {
    const norm = language?.trim()
      ? (LANG_ALIASES[language.toLowerCase().trim()] ?? language.toLowerCase().trim())
      : '';
    let cancelled = false;
    (async () => {
      if (!norm) {
        if (!cancelled) setHtml('');
        return;
      }
      await loadLanguage(norm);
      if (cancelled) return;
      try { setHtml(buildHighlightedHtml(code, norm, lineNumColor, query)); }
      catch { if (!cancelled) setHtml(''); }
    })();
    return () => { cancelled = true; };
  }, [code, language, lineNumColor, query]);
  return html;
}

interface BodyProps {
  readonly lines: string[];
  readonly matchedLines: Set<number>;
  readonly searchQuery: string;
  readonly fg: string;
  readonly codeBg: string;
  readonly lineNum: string;
  readonly highlightedHtml: string;
  readonly thumb: string;
  readonly track: string;
  readonly thumbHov: string;
  readonly maxHeight?: number | 'none';
}

const CodeBody = React.forwardRef<HTMLDivElement, BodyProps>(
  ({ lines, matchedLines, searchQuery, fg, codeBg, lineNum, highlightedHtml, thumb, track, thumbHov, maxHeight }, _ref) => {
    const { scrollRef, dragStyle, dragHandlers } = useDragScroll();
    return (
      <>
        <style>{`
          .cb-scroll::-webkit-scrollbar{width:6px;height:6px}
          .cb-scroll::-webkit-scrollbar-track{background:${track}}
          .cb-scroll::-webkit-scrollbar-thumb{background:${thumb};border-radius:99px}
          .cb-scroll::-webkit-scrollbar-thumb:hover{background:${thumbHov}}
          .cb-scroll::-webkit-scrollbar-corner{background:transparent}
        `}</style>
        <div
          ref={scrollRef}
          className="cb-scroll"
          style={{
            background: codeBg,
            overflowX: 'auto',
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: `${thumb} ${track}`,
            maxHeight: maxHeight === 'none' ? undefined : maxHeight,
            height: maxHeight === 'none' ? '100%' : undefined,
            flex: maxHeight === 'none' ? 1 : undefined,
            ...dragStyle,
          }}
          {...dragHandlers}
        >
          <pre
            className="not-prose hljs"
            style={{
              margin: 0, padding: '10px 14px', background: 'transparent', color: fg,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              fontSize: '0.875rem', lineHeight: '1.5',
              overflow: 'visible', whiteSpace: 'pre', minWidth: 'max-content',
            }}
          >
            {highlightedHtml
              ? <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} className="language-code" style={{ color: fg, display: 'block', whiteSpace: 'pre' }} />
              : lines.map((line, i) => (
                <div key={`${i}-${line.slice(0, 8)}`} style={{ whiteSpace: 'pre' }}>
                  <span style={{ color: lineNum, display: 'inline-block', width: '28px', marginRight: '14px', textAlign: 'right', userSelect: 'none', fontSize: '11px' }}>{i + 1}</span>
                  {matchedLines.has(i) ? <HighlightedText text={line} query={searchQuery} /> : <span>{line}</span>}
                </div>
              ))
            }
          </pre>
        </div>
      </>
    );
  }
);
CodeBody.displayName = 'CodeBody';

// Кнопка-таблетка тулбара
function Pill({ onClick, title, label, icon, t, active, success, btnRef }: {
  readonly onClick: () => void;
  readonly title: string;
  readonly label: string;
  readonly icon: React.ReactNode;
  readonly t: ReturnType<typeof tk>;
  readonly active?: boolean;
  readonly success?: boolean;
  readonly btnRef?: React.RefObject<HTMLButtonElement>;
}) {
  const bg = success ? 'rgba(34,197,94,0.16)' : t.btnBg;
  let bdr: string;
  if (success)      bdr = 'rgba(34,197,94,0.4)';
  else if (active)  bdr = 'rgba(255,255,255,0.2)';
  else              bdr = t.btnBdr;
  const color = success ? '#22c55e' : t.btnClr;
  return (
    <button ref={btnRef} onClick={onClick} title={title} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 3, padding: '5px 12px', minWidth: 52, height: 44,
      borderRadius: 8, border: `1px solid ${bdr}`,
      background: active ? t.btnHov : bg, color, cursor: 'pointer', flexShrink: 0,
      transition: 'background 0.13s',
    }}
      onMouseEnter={e => { if (!success) (e.currentTarget as HTMLButtonElement).style.background = t.btnHov; }}
      onMouseLeave={e => { if (!success) (e.currentTarget as HTMLButtonElement).style.background = active ? t.btnHov : bg; }}
    >
      {icon}
      <span style={{ fontSize: 10, fontWeight: active || success ? 600 : 400, whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  );
}

// Мобильное меню: копировать + развернуть
function MobileMenu({ t, code, onFullscreen }: {
  readonly t: ReturnType<typeof tk>;
  readonly code: string;
  readonly onFullscreen: () => void;
}) {
  const [open, setOpen]     = useState(false);
  const [copied, setCopied] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef    = useRef<HTMLDivElement>(null);

  // Закрытие по клику вне меню
  useEffect(() => {
    if (!open) return;
    const onMouse = (e: MouseEvent) => {
      if (
        menuRef.current?.contains(e.target as Node) ||
        triggerRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onMouse, true);
    return () => document.removeEventListener('mousedown', onMouse, true);
  }, [open]);

  const toggle = () => {
    if (open) { setOpen(false); return; }
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const mw = 200;
    setMenuPos({ top: r.bottom + 4, left: Math.max(8, Math.min(r.right - mw, window.innerWidth - mw - 8)) });
    setOpen(true);
  };

  const doCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => { setCopied(false); }, 2000);
  };

  const menuBg  = t.codeBg === '#0d0d0d' ? '#1a1a1a' : '#eceae6';

  return (
    <>
      <button ref={triggerRef} onClick={toggle} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 36, height: 36, borderRadius: 8,
        border: `1px solid ${t.btnBdr}`,
        background: open ? t.btnHov : t.btnBg,
        color: t.btnClr, cursor: 'pointer', flexShrink: 0,
      }}>
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <div ref={menuRef} style={{
          position: 'fixed', top: menuPos.top, left: menuPos.left,
          minWidth: 200, zIndex: 99999,
          background: menuBg, border: `1px solid ${t.btnBdr}`,
          borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}>
          <button onClick={doCopy} style={{
            width: '100%', padding: '11px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
            border: 'none', background: copied ? 'rgba(34,197,94,0.12)' : 'transparent',
            color: copied ? '#22c55e' : t.btnClr,
            fontSize: 13, fontWeight: copied ? 600 : 400,
            cursor: 'pointer', textAlign: 'left',
          }}>
            <span style={{ display: 'flex', opacity: copied ? 1 : 0.6 }}>
              {copied ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} />}
            </span>
            <span>{copied ? 'Скопировано!' : 'Скопировать код'}</span>
          </button>
          <div style={{ height: 1, background: t.btnBdr }} />
          <button onClick={() => { onFullscreen(); setOpen(false); }} style={{
            width: '100%', padding: '11px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
            border: 'none', background: 'transparent',
            color: t.btnClr, fontSize: 13, cursor: 'pointer', textAlign: 'left',
          }}>
            <span style={{ display: 'flex', opacity: 0.6 }}><Maximize2 size={14} /></span>
            <span>Развернуть</span>
          </button>
        </div>
      )}
    </>
  );
}

interface CodeBlockProps {
  readonly code: string;
  readonly language?: string;
}

const VISIBLE_LINES    = 7;
const LINE_HEIGHT_PX   = 21;
const PRE_PADDING      = 10;
const COLLAPSED_HEIGHT = PRE_PADDING + VISIBLE_LINES * LINE_HEIGHT_PX + PRE_PADDING;
const BORDER_RADIUS    = 12;

// Склонение слова "строка" по количеству
function pluralLines(n: number): string {
  if (n === 1) return 'строка';
  if (n < 5)   return 'строки';
  return 'строк';
}

export function CodeBlock({ code, language = '' }: CodeBlockProps) {
  const { isDark } = useContext(TableContext);
  const t = tk(isDark);

  const [isExpanded,   setIsExpanded]   = useState(false);
  const [isCopied,     setIsCopied]     = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [isMobile,     setIsMobile]     = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 580);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const lines = useMemo(() => {
    const raw = code.split('\n');
    if (raw.at(-1) === '') raw.pop();
    return raw;
  }, [code]);

  const isLong          = lines.length > VISIBLE_LINES;
  const highlightedHtml = useHighlightedHtml(code, language, t.lineNum, searchQuery);

  const matchedLines = useMemo(() => {
    if (!searchQuery) return new Set<number>();
    const lq = searchQuery.toLowerCase();
    return new Set(lines.reduce<number[]>((acc, l, i) => {
      if (l.toLowerCase().includes(lq)) { acc.push(i); }
      return acc;
    }, []));
  }, [lines, searchQuery]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [code]);

  const bodyProps = {
    lines, matchedLines, searchQuery,
    fg: t.fg, codeBg: t.codeBg, lineNum: t.lineNum, highlightedHtml,
    thumb: t.thumb, track: t.track, thumbHov: t.thumbHov,
  };

  const renderToolbar = (isModal: boolean) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
      borderBottom: `1px solid ${t.barBorder}`,
      background: t.barBg, flexWrap: 'nowrap', minWidth: 0, flexShrink: 0,
    }}>
      <div style={{ position: 'relative', flex: '1 1 0', minWidth: 0 }}>
        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: t.plhClr, pointerEvents: 'none' }} />
        <input
          type="text" placeholder="Поиск..." value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%', padding: '0 30px 0 30px', height: 36,
            borderRadius: 8, border: `1px solid ${t.inpBdr}`,
            background: t.inpBg, color: t.inpClr, fontSize: 13,
            outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
          }}
          onFocus={e => { (e.target as HTMLInputElement).style.borderColor = t.inpFoc; }}
          onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = t.inpBdr; }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: matchedLines.size > 0 ? 56 : 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: t.plhClr, display: 'flex' }}>
            <X size={12} />
          </button>
        )}
        {matchedLines.size > 0 && (
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: t.fgMuted, whiteSpace: 'nowrap' }}>
            {matchedLines.size} найдено
          </span>
        )}
      </div>

      {!isMobile && (
        <>
          <Pill onClick={handleCopy} title={isCopied ? 'Скопировано!' : 'Копировать'} label={isCopied ? 'Скопировано' : 'Копировать'} icon={isCopied ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} />} t={t} success={isCopied} />
          <Pill onClick={() => isModal ? setIsFullscreen(false) : setIsFullscreen(true)} title={isModal ? 'Свернуть' : 'Развернуть'} label={isModal ? 'Свернуть' : 'Развернуть'} icon={isModal ? <Minimize2 size={14} /> : <Maximize2 size={14} />} t={t} />
        </>
      )}

      {isMobile && (
        <MobileMenu t={t} code={code} onFullscreen={() => setIsFullscreen(true)} />
      )}
    </div>
  );

  const renderFooter = () => (
    <div style={{
      padding: '6px 12px', borderTop: `1px solid ${t.barBorder}`,
      fontSize: 11, color: t.footerClr,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      userSelect: 'none', background: t.outerBg, flexShrink: 0,
    }}>
      <span>{lines.length} {pluralLines(lines.length)}</span>
      {language && <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, opacity: 0.7 }}>{language}</span>}
    </div>
  );

  if (isFullscreen) {
    return (
      <Overlay onClose={() => setIsFullscreen(false)} zIndex={10000} backdropCursor="default">
        <div style={{
          position: 'relative', width: 'min(95vw, 1100px)', maxHeight: '90vh',
          borderRadius: 14, border: `1px solid ${t.outerBorder}`,
          background: t.outerBg, boxShadow: t.modalShadow,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {renderToolbar(true)}
          <div style={{ flex: 1, overflow: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <CodeBody {...bodyProps} maxHeight="none" />
          </div>
          {renderFooter()}
        </div>
      </Overlay>
    );
  }

  return (
    <div className="not-prose" style={{ margin: '1.25rem 0' }}>
      <div style={{
        borderRadius: BORDER_RADIUS, border: `1px solid ${t.outerBorder}`,
        background: t.outerBg, boxShadow: t.outerShadow,
        overflow: 'clip', display: 'flex', flexDirection: 'column',
        width: '100%', minWidth: 0,
      }}>
        {renderToolbar(false)}
        <div style={{ position: 'relative', overflow: 'hidden', maxHeight: isExpanded ? 'none' : COLLAPSED_HEIGHT }}>
          <CodeBody {...bodyProps} />
          {isLong && !isExpanded && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: LINE_HEIGHT_PX * 2.5,
              background: `linear-gradient(to bottom, transparent, ${t.fadeTo})`,
              pointerEvents: 'none',
            }} />
          )}
        </div>
        {isLong && (
          <button
            onClick={() => setIsExpanded(p => !p)}
            style={{
              width: '100%', padding: '7px 12px', background: t.barBg,
              border: 'none', borderTop: `1px solid ${t.barBorder}`,
              color: t.footerClr, fontSize: 11, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              transition: 'background 0.13s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = t.btnHov; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = t.barBg; }}
          >
            {isExpanded
              ? <><ChevronUp size={13} /><span>Скрыть</span></>
              : <><ChevronDown size={13} /><span>Открыть полностью ({lines.length} строк)</span></>
            }
          </button>
        )}
        {renderFooter()}
      </div>
    </div>
  );
}