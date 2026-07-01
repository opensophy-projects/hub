import React, { useState, useRef, useContext, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Copy, Check, Maximize2, Minimize2,
  ChevronDown, ChevronUp, Search, X, Menu,
} from 'lucide-react';
import { TableContext } from '../lib/htmlParser';
import Overlay from './Overlay';
import { useDragScroll } from '@/features/table/hooks/useDragScroll';
import hljs from 'highlight.js/lib/core';
import { makeTokens, themed } from '@/shared/tokens/theme';

// ─── Токены ───────────────────────────────────────────────────────────────────
//
// Единый фон блока (тулбар/код/футер/тулбар "открыть полностью") — как у ChartBlock:
// #0a0a0a в тёмной теме, #e8e7e3 в светлой. Разделительные линии между секциями убраны.

function tk(isDark: boolean) {
  const t = makeTokens(isDark);
  const unifiedBg = isDark ? '#0a0a0a' : '#e8e7e3';
  return {
    outerBg:     unifiedBg,
    barBg:       unifiedBg,
    codeBg:      unifiedBg,
    outerBorder: t.border,
    inpBg:       unifiedBg,
    inpBdr:      t.inpBdr,
    inpFoc:      t.inpBdrFocus,
    inpClr:      t.inpClr,
    plhClr:      t.plhClr,
    lineNum:     t.lineNum,
    thumb:       t.thumb,
    thumbHov:    t.thumbHov,
    track:       t.track,
    tabInactive: 'transparent',
    btnBg:        themed(isDark, 'rgba(255,255,255,0.08)', 'rgba(0,0,0,0.07)'),
    btnBdr:       themed(isDark, 'rgba(255,255,255,0.12)', 'rgba(0,0,0,0.12)'),
    btnHov:       themed(isDark, 'rgba(255,255,255,0.14)', 'rgba(0,0,0,0.12)'),
    btnClr:       themed(isDark, 'rgba(255,255,255,0.72)', 'rgba(0,0,0,0.68)'),
    fg:           themed(isDark, '#e8e8e8', '#1a1a1a'),
    fgMuted:      themed(isDark, 'rgba(255,255,255,0.35)', 'rgba(0,0,0,0.38)'),
    footerClr:    themed(isDark, 'rgba(255,255,255,0.22)', 'rgba(0,0,0,0.32)'),
    outerShadow:  themed(isDark, '0 2px 12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)', '0 1px 6px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.07)'),
    modalShadow:  themed(isDark, '0 24px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.05)', '0 24px 80px rgba(0,0,0,0.2)'),
    fadeTo:       unifiedBg,
    tabActive:    themed(isDark, 'rgba(255,255,255,0.1)', 'rgba(0,0,0,0.1)'),
    tabActiveBdr: themed(isDark, 'rgba(255,255,255,0.2)', 'rgba(0,0,0,0.2)'),
    elevatedBorder: t.borderElevated,
    elevatedShadow: t.shadowElevated,
    dropdownBg:     unifiedBg,
  };
}

const LANG_ALIASES: Record<string, string> = {
  jsx: 'javascript', tsx: 'typescript', shell: 'bash', sh: 'bash',
  yml: 'yaml', md: 'markdown', 'c++': 'cpp', cs: 'csharp',
};

const loadedLanguages  = new Set<string>();
const pendingLanguages = new Map<string, Promise<void>>();

type HljsLanguageModule = { default: Parameters<typeof hljs.registerLanguage>[1] };

async function loadLanguage(lang: string): Promise<void> {
  const normalized = LANG_ALIASES[lang] ?? lang;
  if (loadedLanguages.has(normalized)) return;
  const existing = pendingLanguages.get(normalized);
  if (existing !== undefined) return existing;
  const promise = (async () => {
    try {
      const loaders: Record<string, () => Promise<HljsLanguageModule>> = {
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
      hljs.registerLanguage(normalized, module.default);
      for (const [alias, target] of Object.entries(LANG_ALIASES)) {
        if (target === normalized && !loadedLanguages.has(alias)) {
          hljs.registerLanguage(alias, module.default);
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

function highlightTextMatches(text: string, query: string): string {
  const lowerText  = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const queryLen   = query.length;

  let result  = '';
  let lastIdx = 0;
  let idx     = lowerText.indexOf(lowerQuery);

  while (idx !== -1) {
    result += text.slice(lastIdx, idx);
    result += `<mark style="background:#854d0e;color:#fff;border-radius:2px;padding:0 1px;">${text.slice(idx, idx + queryLen)}</mark>`;
    lastIdx = idx + queryLen;
    idx = lowerText.indexOf(lowerQuery, lastIdx);
  }

  result += text.slice(lastIdx);
  return result;
}

function injectSearchHighlight(html: string, query: string): string {
  if (!query) return html;
  return html.replace(/(<[^>]*>)|([^<]+)/g, (_, tag, text) => { // NOSONAR
    if (tag) return tag;
    return highlightTextMatches(text, query);
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
  ({ lines, matchedLines, searchQuery, fg, codeBg, lineNum, highlightedHtml, thumb, track, thumbHov, maxHeight }) => {
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

// ─── Меню-гамбургер (Поиск / Копировать / Развернуть) ────────────────────────
//
// Перенос механики из AskAIButton: createPortal, позиционирование по rect
// триггера, обновление позиции при скролле/ресайзе, закрытие по клику вне,
// анимация появления. Единственное отличие — список действий и то, что клик
// на "Поиск" не переходит по ссылке, а просит родителя развернуть инпут
// прямо в тулбаре и закрывает меню.

interface ToolbarMenuProps {
  readonly isDark: boolean;
  readonly isCopied: boolean;
  readonly isModal: boolean | undefined;
  readonly onSearch: () => void;
  readonly onCopy: () => void;
  readonly onToggleFullscreen: () => void;
  readonly t: ReturnType<typeof tk>;
}

function ToolbarMenu({ isDark, isCopied, isModal, onSearch, onCopy, onToggleFullscreen, t }: ToolbarMenuProps) {
  const [open, setOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const ref      = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const clearCloseTimer = () => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  };

  const positionMenu = () => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      const width = 190;
      setMenuPos({
        top:  rect.bottom + 6,
        left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
      });
    }
  };

  const openMenu = () => {
    clearCloseTimer();
    positionMenu();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target instanceof Node ? e.target : null;
      if (ref.current?.contains(target) || popupRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener('scroll', positionMenu, true);
    window.addEventListener('resize', positionMenu);
    return () => {
      window.removeEventListener('scroll', positionMenu, true);
      window.removeEventListener('resize', positionMenu);
    };
  }, [open]);

  useEffect(() => () => clearCloseTimer(), []);

  const toggleOpen = () => {
    if (open) { setOpen(false); return; }
    openMenu();
  };

  const getUnifiedControlStyle = (isActive: boolean) => ({
    border: `1px solid ${isActive ? (isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)') : t.btnBdr}`,
    background: 'transparent',
    borderRadius: '8px',
  });

  const items = [
    {
      id: 'search',
      label: 'Поиск',
      icon: <Search size={13} />,
      onClick: () => { onSearch(); setOpen(false); },
    },
    {
      id: 'copy',
      label: isCopied ? 'Скопировано!' : 'Копировать',
      icon: isCopied ? <Check size={13} style={{ color: '#22c55e' }} /> : <Copy size={13} style={{ opacity: 0.45 }} />,
      onClick: () => { onCopy(); },
    },
    {
      id: 'fullscreen',
      label: isModal ? 'Свернуть' : 'Развернуть',
      icon: isModal ? <Minimize2 size={13} /> : <Maximize2 size={13} />,
      onClick: () => { onToggleFullscreen(); setOpen(false); },
    },
  ];

  return (
    <div
      ref={ref}
      style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        onClick={toggleOpen}
        title="Меню"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: 8,
          border: `1px solid ${open ? t.btnBdr : 'transparent'}`,
          background: open ? t.btnBg : 'transparent',
          color: t.btnClr, cursor: 'pointer', flexShrink: 0,
          transition: 'background 0.13s, border-color 0.13s',
        }}
      >
        <Menu size={16} />
      </button>

      {open && createPortal(
        <div
          ref={popupRef}
          onMouseEnter={clearCloseTimer}
          onMouseLeave={scheduleClose}
          style={{
            position: 'fixed',
            top:          menuPos.top,
            left:         menuPos.left,
            width:        '190px',
            borderRadius: '12px',
            border:       `1px solid ${t.elevatedBorder}`,
            background:   t.dropdownBg,
            boxShadow:    t.elevatedShadow,
            zIndex:       100020,
            overflow:     'hidden',
            animation:    'cbMenuIn 0.13s ease',
          }}
        >
          <style>{`
            @keyframes cbMenuIn {
              from { opacity:0; transform:translateY(-4px) scale(0.98); }
              to   { opacity:1; transform:translateY(0)   scale(1); }
            }
          `}</style>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px' }}>
            {items.map(item => {
              const isActive = hoveredId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    width:      '100%',
                    display:    'flex',
                    alignItems: 'center',
                    gap:        '0.5rem',
                    padding:    '0.55rem 0.7rem',
                    fontSize:   '0.875rem',
                    textAlign:  'left',
                    cursor:     'pointer',
                    color:      item.id === 'copy' && isCopied ? '#22c55e' : (isActive ? t.fg : t.btnClr),
                    fontWeight: isActive ? 600 : 400,
                    ...getUnifiedControlStyle(isActive),
                  }}
                >
                  {item.icon}
                  <span style={{ wordBreak: 'break-word', lineHeight: 1.3 }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

interface SingleCodeBlockProps {
  readonly code: string;
  readonly language: string;
  readonly isModal?: boolean;
  readonly searchQuery: string;
  readonly setSearchQuery: (v: string) => void;
  readonly isExpanded: boolean;
  readonly setIsExpanded: (v: boolean) => void;
  readonly t: ReturnType<typeof tk>;
}

const VISIBLE_LINES    = 7;
const LINE_HEIGHT_PX   = 21;
const PRE_PADDING      = 10;
const COLLAPSED_HEIGHT = PRE_PADDING + VISIBLE_LINES * LINE_HEIGHT_PX + PRE_PADDING;

function SingleCodeContent({ code, language, isModal, searchQuery, setSearchQuery, isExpanded, setIsExpanded, t }: SingleCodeBlockProps) {
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
      if (l.toLowerCase().includes(lq)) acc.push(i);
      return acc;
    }, []));
  }, [lines, searchQuery]);

  const bodyProps = {
    lines, matchedLines, searchQuery,
    fg: t.fg, codeBg: t.codeBg, lineNum: t.lineNum, highlightedHtml,
    thumb: t.thumb, track: t.track, thumbHov: t.thumbHov,
  };

  if (isModal) {
    return (
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <CodeBody {...bodyProps} maxHeight="none" />
      </div>
    );
  }

  return (
    <>
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
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            width: '100%', padding: '7px 12px', background: t.barBg,
            border: 'none',
            color: t.footerClr, fontSize: 11, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            transition: 'background 0.13s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = t.btnHov; }}
          onMouseLeave={e => { e.currentTarget.style.background = t.barBg; }}
        >
          {isExpanded
            ? <><ChevronUp size={13} /><span>Скрыть</span></>
            : <><ChevronDown size={13} /><span>Открыть полностью ({lines.length} строк)</span></>
          }
        </button>
      )}
    </>
  );
}

export interface CodeTab {
  label: string;
  code: string;
  language: string;
}

interface TabBarProps {
  readonly tabs: CodeTab[];
  readonly activeIdx: number;
  readonly onSelect: (idx: number) => void;
  readonly t: ReturnType<typeof tk>;
}

function TabBar({ tabs, activeIdx, onSelect, t }: TabBarProps) {
  return (
    <div className="cb-tabs" style={{ display: 'flex', alignItems: 'center', gap: 2, flex: '0 1 auto', minWidth: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
      <style>{`.cb-tabs::-webkit-scrollbar{display:none}`}</style>
      {tabs.map((tab, i) => {
        const active = i === activeIdx;
        return (
          <button
            key={`${tab.label}-${i}`}
            onClick={() => onSelect(i)}
            style={{
              display: 'flex', alignItems: 'center',
              padding: '7px 14px',
              border: 'none',
              borderRadius: '8px',
              background: active ? t.tabActive : 'transparent',
              color: active ? t.fg : t.fgMuted,
              fontSize: 12, fontWeight: active ? 600 : 400,
              cursor: 'pointer', flexShrink: 0,
              outline: 'none',
              fontFamily: 'ui-monospace, monospace',
              whiteSpace: 'nowrap',
              transition: 'background 0.13s, color 0.13s',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = t.btnBg; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── TopBar ───────────────────────────────────────────────────────────────────
//
// Единственный верхний ряд карточки: вкладки (если есть) слева, поиск и
// кнопка-меню справа. Раньше вкладки (TabBar) и тулбар с меню (внутри
// SingleCodeContent) рендерились как два отдельных div-ряда друг под другом —
// из-за этого при закрытом поиске второй ряд выглядел как пустая полоса под
// вкладками. Теперь это один flex-ряд, который никогда не остаётся пустым:
// при отсутствии вкладок в нём просто меньше контента слева.

interface TopBarProps {
  readonly tabs?: CodeTab[];
  readonly activeIdx: number;
  readonly onSelectTab: (idx: number) => void;
  readonly isDark: boolean;
  readonly isCopied: boolean;
  readonly isModal: boolean | undefined;
  readonly searchQuery: string;
  readonly setSearchQuery: (v: string) => void;
  readonly handleCopy: () => void;
  readonly setIsFullscreen: (v: boolean) => void;
  readonly t: ReturnType<typeof tk>;
}

function TopBar({ tabs, activeIdx, onSelectTab, isDark, isCopied, isModal, searchQuery, setSearchQuery, handleCopy, setIsFullscreen, t }: TopBarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hasTabs = tabs && tabs.length > 1;

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    requestAnimationFrame(() => searchInputRef.current?.focus());
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
  }, [setSearchQuery]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
      background: t.barBg, flexWrap: 'nowrap', minWidth: 0, flexShrink: 0,
    }}>
      {hasTabs && !searchOpen && (
        <TabBar tabs={tabs} activeIdx={activeIdx} onSelect={onSelectTab} t={t} />
      )}

      {searchOpen ? (
        <div style={{ position: 'relative', flex: '1 1 0', minWidth: 0 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: t.plhClr, pointerEvents: 'none' }} />
          <input
            ref={searchInputRef}
            type="text" placeholder="Поиск..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') closeSearch(); }}
            style={{
              width: '100%', padding: '0 30px 0 30px', height: 36,
              borderRadius: 8, border: `1px solid ${t.inpBdr}`,
              background: t.inpBg, color: t.inpClr, fontSize: 13,
              outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.target.style.borderColor = t.inpFoc; }}
            onBlur={e  => { e.target.style.borderColor = t.inpBdr; }}
          />
          <button onClick={closeSearch} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: t.plhClr, display: 'flex' }}>
            <X size={12} />
          </button>
        </div>
      ) : (
        <div style={{ flex: '1 1 0', minWidth: 0 }} />
      )}

      <ToolbarMenu
        isDark={isDark}
        isCopied={isCopied}
        isModal={isModal}
        onSearch={openSearch}
        onCopy={handleCopy}
        onToggleFullscreen={() => setIsFullscreen(!isModal)}
        t={t}
      />
    </div>
  );
}

interface CodeBlockProps {
  readonly code: string;
  readonly language?: string;
  readonly tabs?: CodeTab[];
}

export function CodeBlock({ code, language = '', tabs }: CodeBlockProps) {
  const { isDark } = useContext(TableContext);
  const t = tk(isDark);

  const [activeTab,    setActiveTab]    = useState(0);
  const [isExpanded,   setIsExpanded]   = useState(false);
  const [isCopied,     setIsCopied]     = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');

  const hasTabs = tabs && tabs.length > 1;

  useEffect(() => {
    setSearchQuery('');
    setIsExpanded(false);
  }, [activeTab]);

  const currentCode     = hasTabs ? tabs[activeTab].code     : code;
  const currentLanguage = hasTabs ? tabs[activeTab].language : language;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(currentCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [currentCode]);

  const sharedProps = {
    code:            currentCode,
    language:        currentLanguage,
    searchQuery,
    setSearchQuery,
    isExpanded,
    setIsExpanded,
    t,
  };

  if (isFullscreen) {
    return (
      <Overlay onClose={() => setIsFullscreen(false)} zIndex={10000} backdropCursor="default">
        <div style={{
          position: 'relative', width: 'min(95vw, 1100px)', maxHeight: '90vh',
          borderRadius: 14, border: `1px solid ${t.outerBorder}`,
          background: t.outerBg, boxShadow: t.modalShadow,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <TopBar
            tabs={tabs}
            activeIdx={activeTab}
            onSelectTab={setActiveTab}
            isDark={isDark}
            isCopied={isCopied}
            isModal
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleCopy={handleCopy}
            setIsFullscreen={setIsFullscreen}
            t={t}
          />
          <SingleCodeContent {...sharedProps} isModal />
        </div>
      </Overlay>
    );
  }

  return (
    <div className="not-prose" style={{ margin: '1.25rem 0' }}>
      <div style={{
        borderRadius: 12, border: `1px solid ${t.outerBorder}`,
        background: t.outerBg, boxShadow: t.outerShadow,
        overflow: 'clip', display: 'flex', flexDirection: 'column',
        width: '100%', minWidth: 0,
      }}>
        <TopBar
          tabs={tabs}
          activeIdx={activeTab}
          onSelectTab={setActiveTab}
          isDark={isDark}
          isCopied={isCopied}
          isModal={false}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleCopy={handleCopy}
          setIsFullscreen={setIsFullscreen}
          t={t}
        />
        <SingleCodeContent {...sharedProps} />
      </div>
    </div>
  );
}