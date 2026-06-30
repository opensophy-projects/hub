import React, { useState, useRef, useContext, useMemo, useEffect, useCallback } from 'react';
import {
  Copy, Check, Maximize2, Minimize2,
  ChevronDown, ChevronUp, Search, X, Menu,
} from 'lucide-react';
import { TableContext } from '../lib/htmlParser';
import Overlay from './Overlay';
import { useDragScroll } from '@/features/table/hooks/useDragScroll';
import hljs from 'highlight.js/lib/core';
import { makeTokens, themed } from '@/shared/tokens/theme';
import { PortalMenu, MenuTriggerButton } from '@/shared/components/portalMenuShared';
import { useMenuHelpers } from '@/shared/components/portalMenuHelpers';
import { createPortal } from 'react-dom';

function tk(isDark: boolean) {
  const t = makeTokens(isDark);
  const shared = {
    outerBg:     t.bg,
    barBg:       t.surface,
    codeBg:      t.codeBg,
    outerBorder: t.border,
    inpBg:       t.inpBg,
    inpBdr:      t.inpBdr,
    inpFoc:      t.inpBdrFocus,
    inpClr:      t.inpClr,
    plhClr:      t.plhClr,
    lineNum:     t.lineNum,
    thumb:       t.thumb,
    thumbHov:    t.thumbHov,
    track:       t.track,
    tabInactive: 'transparent',
  };
  return {
    ...shared,
    barBorder:    themed(isDark, 'rgba(255,255,255,0.08)', 'rgba(0,0,0,0.09)'),
    btnBg:        themed(isDark, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.06)'),
    btnBdr:       themed(isDark, 'rgba(255,255,255,0.11)', 'rgba(0,0,0,0.11)'),
    btnHov:       themed(isDark, 'rgba(255,255,255,0.13)', 'rgba(0,0,0,0.10)'),
    btnClr:       themed(isDark, 'rgba(255,255,255,0.65)', 'rgba(0,0,0,0.60)'),
    fg:           themed(isDark, '#e8e8e8', '#1a1a1a'),
    fgMuted:      themed(isDark, 'rgba(255,255,255,0.35)', 'rgba(0,0,0,0.38)'),
    footerClr:    themed(isDark, 'rgba(255,255,255,0.22)', 'rgba(0,0,0,0.32)'),
    outerShadow:  themed(isDark, '0 2px 12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)', '0 1px 6px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.07)'),
    modalShadow:  themed(isDark, '0 24px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.05)', '0 24px 80px rgba(0,0,0,0.2)'),
    fadeTo:       themed(isDark, '#0d0d0d', '#ECEAE5'),
    tabActive:    themed(isDark, 'rgba(255,255,255,0.10)', 'rgba(0,0,0,0.09)'),
    tabActiveBdr: themed(isDark, 'rgba(255,255,255,0.18)', 'rgba(0,0,0,0.18)'),
    expandBg:     themed(isDark, 'rgba(255,255,255,0.03)', 'rgba(0,0,0,0.03)'),
    expandHov:    themed(isDark, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.07)'),
    dropBg:       themed(isDark, '#121212', '#ECEBE7'),
    dropBorder:   themed(isDark, 'rgba(255,255,255,0.10)', 'rgba(0,0,0,0.10)'),
    dropShadow:   themed(isDark, '0 8px 32px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.07)', '0 8px 24px rgba(0,0,0,0.14)'),
    itemHov:      themed(isDark, 'rgba(255,255,255,0.06)', 'rgba(0,0,0,0.06)'),
    itemBdr:      themed(isDark, 'rgba(255,255,255,0.09)', 'rgba(0,0,0,0.09)'),
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
  let result = '', lastIdx = 0;
  let idx = lowerText.indexOf(lowerQuery);
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
      if (!norm) { if (!cancelled) setHtml(''); return; }
      await loadLanguage(norm);
      if (cancelled) return;
      try { setHtml(buildHighlightedHtml(code, norm, lineNumColor, query)); }
      catch { if (!cancelled) setHtml(''); }
    })();
    return () => { cancelled = true; };
  }, [code, language, lineNumColor, query]);
  return html;
}

// ─── Бургер-дропдаун (портал, с обновлением позиции при скролле) ─────────────
function BurgerMenu({ isDark, code, isModal, onFullscreen, t }: {
  readonly isDark: boolean;
  readonly code: string;
  readonly isModal: boolean | undefined;
  readonly onFullscreen: () => void;
  readonly t: ReturnType<typeof tk>;
}) {
  const [open,      setOpen]   = useState(false);
  const [copied,    setCopied] = useState(false);
  const [hoveredId, setHov]    = useState<string | null>(null);
  const ref      = useRef<HTMLButtonElement>(null);
  const popRef   = useRef<HTMLDivElement>(null);
  const [pos,    setPos]       = useState({ top: 0, left: 0 });

  const calcPos = useCallback(() => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const w = 210;
    setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8)) });
  }, []);

  const toggle = () => {
    if (open) { setOpen(false); return; }
    calcPos();
    setOpen(true);
  };

  // Закрытие по клику вне
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const tgt = e.target instanceof Node ? e.target : null;
      if (ref.current?.contains(tgt) || popRef.current?.contains(tgt)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Обновление позиции при скролле/ресайзе
  useEffect(() => {
    if (!open) return;
    window.addEventListener('scroll', calcPos, true);
    window.addEventListener('resize', calcPos);
    return () => {
      window.removeEventListener('scroll', calcPos, true);
      window.removeEventListener('resize', calcPos);
    };
  }, [open, calcPos]);

  const doCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => { setCopied(false); setOpen(false); }, 1500);
  };

  const itemStyle = (id: string): React.CSSProperties => ({
    width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.55rem 0.7rem', fontSize: '0.875rem', textAlign: 'left',
    cursor: 'pointer',
    color: id === 'copy' && copied ? '#22c55e' : (hoveredId === id ? t.fg : t.fgMuted),
    fontWeight: hoveredId === id || (id === 'copy' && copied) ? 600 : 400,
    background: hoveredId === id ? t.itemHov : 'transparent',
    borderRadius: '6px', border: 'none', transition: 'background 0.12s, color 0.12s',
  });

  return (
    <>
      <button
        ref={ref}
        onClick={toggle}
        title="Действия"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: 7,
          border: `1px solid ${open ? t.tabActiveBdr : t.btnBdr}`,
          background: open ? t.btnHov : t.btnBg,
          color: t.btnClr, cursor: 'pointer', flexShrink: 0,
          transition: 'background 0.13s, border-color 0.13s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = t.btnHov; }}
        onMouseLeave={e => { e.currentTarget.style.background = open ? t.btnHov : t.btnBg; }}
      >
        <Menu size={14} />
      </button>

      {open && createPortal(
        <div
          ref={popRef}
          style={{
            position: 'fixed', top: pos.top, left: pos.left, width: 210,
            borderRadius: 12, border: `1px solid ${t.dropBorder}`,
            background: t.dropBg, boxShadow: t.dropShadow,
            zIndex: 100020, overflow: 'hidden',
            animation: 'cbMenuIn 0.13s ease',
          }}
        >
          <style>{`@keyframes cbMenuIn{from{opacity:0;transform:translateY(-4px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 6 }}>
            <button
              onClick={doCopy}
              onMouseEnter={() => setHov('copy')}
              onMouseLeave={() => setHov(null)}
              style={itemStyle('copy')}
            >
              {copied
                ? <Check size={13} style={{ color: '#22c55e', flexShrink: 0 }} />
                : <Copy  size={13} style={{ flexShrink: 0, opacity: 0.55 }} />
              }
              <span>{copied ? 'Скопировано!' : 'Копировать'}</span>
            </button>

            <div style={{ height: 1, background: t.dropBorder, margin: '2px 4px' }} />

            <button
              onClick={() => { onFullscreen(); setOpen(false); }}
              onMouseEnter={() => setHov('fs')}
              onMouseLeave={() => setHov(null)}
              style={itemStyle('fs')}
            >
              {isModal
                ? <Minimize2 size={13} style={{ flexShrink: 0, opacity: 0.55 }} />
                : <Maximize2 size={13} style={{ flexShrink: 0, opacity: 0.55 }} />
              }
              <span>{isModal ? 'Свернуть' : 'Развернуть'}</span>
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

// ─── Вертикальная полоска Expand/Collapse слева ───────────────────────────────
function ExpandStrip({ isExpanded, onToggle, t }: {
  readonly isExpanded: boolean;
  readonly onToggle: () => void;
  readonly t: ReturnType<typeof tk>;
}) {
  return (
    <button
      onClick={onToggle}
      title={isExpanded ? 'Скрыть' : 'Открыть полностью'}
      style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: t.expandBg,
        borderRight: `1px solid ${t.barBorder}`,
        cursor: 'pointer', flexShrink: 0, zIndex: 2,
        transition: 'background 0.13s',
        border: 'none',
        borderRadius: 0,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = t.expandHov; }}
      onMouseLeave={e => { e.currentTarget.style.background = t.expandBg; }}
    >
      <span style={{
        writingMode: 'vertical-rl',
        transform: 'rotate(180deg)',
        fontSize: 9,
        fontWeight: 500,
        letterSpacing: '0.06em',
        color: t.footerClr,
        userSelect: 'none',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}>
        {isExpanded ? '↑ скрыть' : '↓ открыть'}
      </span>
    </button>
  );
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
  readonly paddingLeft?: number;
}

const CodeBody = React.forwardRef<HTMLDivElement, BodyProps>(
  ({ lines, matchedLines, searchQuery, fg, codeBg, lineNum, highlightedHtml, thumb, track, thumbHov, maxHeight, paddingLeft = 0 }) => {
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
            overflowX: 'auto', overflowY: 'auto',
            scrollbarWidth: 'thin', scrollbarColor: `${thumb} ${track}`,
            maxHeight: maxHeight === 'none' ? undefined : maxHeight,
            height: maxHeight === 'none' ? '100%' : undefined,
            flex: maxHeight === 'none' ? 1 : undefined,
            paddingLeft,
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

// ─── Поиск с toggle ───────────────────────────────────────────────────────────
function SearchToggle({ searchQuery, setSearchQuery, t }: {
  readonly searchQuery: string;
  readonly setSearchQuery: (v: string) => void;
  readonly t: ReturnType<typeof tk>;
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggle = () => {
    if (open) { setSearchQuery(''); setOpen(false); return; }
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: open ? '1 1 0' : undefined, minWidth: 0, transition: 'flex 0.15s' }}>
      {open && (
        <div style={{ position: 'relative', flex: '1 1 0', minWidth: 0 }}>
          <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: t.plhClr, pointerEvents: 'none' }} />
          <input
            ref={inputRef}
            type="text" placeholder="Поиск..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '0 28px 0 28px', height: 30,
              borderRadius: 6, border: `1px solid ${t.inpBdr}`,
              background: t.inpBg, color: t.inpClr, fontSize: 12,
              outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
            }}
            onFocus={e  => { e.target.style.borderColor = t.inpFoc; }}
            onBlur={e   => { e.target.style.borderColor = t.inpBdr; }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: t.plhClr, display: 'flex' }}
            >
              <X size={11} />
            </button>
          )}
        </div>
      )}
      <button
        onClick={toggle}
        title={open ? 'Закрыть поиск' : 'Поиск'}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: 7,
          border: `1px solid ${open ? t.tabActiveBdr : t.btnBdr}`,
          background: open ? t.btnHov : t.btnBg,
          color: open ? t.fg : t.btnClr,
          cursor: 'pointer', flexShrink: 0, transition: 'background 0.13s, border-color 0.13s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = t.btnHov; }}
        onMouseLeave={e => { e.currentTarget.style.background = open ? t.btnHov : t.btnBg; }}
      >
        <Search size={14} />
      </button>
    </div>
  );
}

// ─── Тулбар ───────────────────────────────────────────────────────────────────
function Toolbar({ searchQuery, setSearchQuery, isCopied, isDark, code, isModal, setIsFullscreen, t }: {
  readonly searchQuery: string;
  readonly setSearchQuery: (v: string) => void;
  readonly isCopied: boolean;
  readonly isDark: boolean;
  readonly code: string;
  readonly isModal: boolean | undefined;
  readonly setIsFullscreen: (v: boolean) => void;
  readonly t: ReturnType<typeof tk>;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px',
      borderBottom: `1px solid ${t.barBorder}`,
      background: t.barBg, flexWrap: 'nowrap', minWidth: 0, flexShrink: 0,
    }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
        <SearchToggle searchQuery={searchQuery} setSearchQuery={setSearchQuery} t={t} />
        <BurgerMenu
          isDark={isDark} code={code} isModal={isModal}
          onFullscreen={() => setIsFullscreen(!isModal)} t={t}
        />
      </div>
    </div>
  );
}

// ─── Таббар ───────────────────────────────────────────────────────────────────
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
    <div style={{
      display: 'flex', alignItems: 'center',
      background: t.barBg,
      borderBottom: `1px solid ${t.barBorder}`,
      overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0,
      padding: '6px 8px', gap: 4,
    }}>
      <style>{`.cb-tabs::-webkit-scrollbar{display:none}`}</style>
      <div className="cb-tabs" style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
        {tabs.map((tab, i) => {
          const active = i === activeIdx;
          return (
            <button
              key={`${tab.label}-${i}`}
              onClick={() => onSelect(i)}
              style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '4px 12px', height: 28,
                borderRadius: 6,
                border: `1px solid ${active ? t.tabActiveBdr : 'transparent'}`,
                background: active ? t.tabActive : 'transparent',
                color: active ? t.fg : t.fgMuted,
                fontSize: 11, fontWeight: active ? 600 : 400,
                cursor: 'pointer', flexShrink: 0, outline: 'none',
                fontFamily: 'ui-monospace, monospace',
                whiteSpace: 'nowrap', transition: 'background 0.13s, color 0.13s, border-color 0.13s',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = t.tabActive; e.currentTarget.style.color = t.fg; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = t.fgMuted; } }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Футер ────────────────────────────────────────────────────────────────────
function Footer({ lines, language, t }: { readonly lines: string[]; readonly language: string; readonly t: ReturnType<typeof tk> }) {
  function pluralLines(n: number): string {
    if (n === 1) return 'строка';
    if (n < 5)   return 'строки';
    return 'строк';
  }
  return (
    <div style={{
      padding: '5px 12px', borderTop: `1px solid ${t.barBorder}`,
      fontSize: 11, color: t.footerClr,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      userSelect: 'none', background: t.barBg, flexShrink: 0,
    }}>
      <span>{lines.length} {pluralLines(lines.length)}</span>
      {language && <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, opacity: 0.7 }}>{language}</span>}
    </div>
  );
}

// ─── Контент одного блока ─────────────────────────────────────────────────────
interface SingleCodeBlockProps {
  readonly code: string;
  readonly language: string;
  readonly isModal?: boolean;
  readonly searchQuery: string;
  readonly setSearchQuery: (v: string) => void;
  readonly isCopied: boolean;
  readonly handleCopy: () => void;
  readonly setIsFullscreen: (v: boolean) => void;
  readonly isExpanded: boolean;
  readonly setIsExpanded: (v: boolean) => void;
  readonly isDark: boolean;
  readonly t: ReturnType<typeof tk>;
}

const VISIBLE_LINES    = 7;
const LINE_HEIGHT_PX   = 21;
const PRE_PADDING      = 10;
const COLLAPSED_HEIGHT = PRE_PADDING + VISIBLE_LINES * LINE_HEIGHT_PX + PRE_PADDING;
const STRIP_WIDTH      = 22;

function SingleCodeContent({ code, language, isModal, searchQuery, setSearchQuery, isCopied, handleCopy, setIsFullscreen, isExpanded, setIsExpanded, isDark, t }: SingleCodeBlockProps) {
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
    paddingLeft: isLong && !isModal ? STRIP_WIDTH : 0,
  };

  const toolbar = (
    <Toolbar
      searchQuery={searchQuery} setSearchQuery={setSearchQuery}
      isCopied={isCopied} isDark={isDark} code={code}
      isModal={isModal} setIsFullscreen={setIsFullscreen} t={t}
    />
  );

  if (isModal) {
    return (
      <>
        {toolbar}
        <div style={{ flex: 1, overflow: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <CodeBody {...bodyProps} maxHeight="none" />
        </div>
        <Footer lines={lines} language={language} t={t} />
      </>
    );
  }

  return (
    <>
      {toolbar}
      <div style={{ position: 'relative' }}>
        {/* Вертикальная полоска expand/collapse — только если блок длинный */}
        {isLong && (
          <ExpandStrip isExpanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)} t={t} />
        )}
        <div style={{ overflow: 'hidden', maxHeight: isExpanded ? 'none' : COLLAPSED_HEIGHT, position: 'relative' }}>
          <CodeBody {...bodyProps} />
          {isLong && !isExpanded && (
            <div style={{
              position: 'absolute', bottom: 0, left: STRIP_WIDTH, right: 0,
              height: LINE_HEIGHT_PX * 2.5,
              background: `linear-gradient(to bottom, transparent, ${t.fadeTo})`,
              pointerEvents: 'none',
            }} />
          )}
        </div>
      </div>
      <Footer lines={lines} language={language} t={t} />
    </>
  );
}

// ─── Публичный компонент ──────────────────────────────────────────────────────
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

  useEffect(() => { setSearchQuery(''); setIsExpanded(false); }, [activeTab]);

  const currentCode     = hasTabs ? tabs[activeTab].code     : code;
  const currentLanguage = hasTabs ? tabs[activeTab].language : language;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(currentCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [currentCode]);

  const sharedProps = {
    code:           currentCode,
    language:       currentLanguage,
    searchQuery,    setSearchQuery,
    isCopied,       handleCopy,
    setIsFullscreen,
    isExpanded,     setIsExpanded,
    isDark,         t,
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
          {hasTabs && <TabBar tabs={tabs} activeIdx={activeTab} onSelect={setActiveTab} t={t} />}
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
        {hasTabs && <TabBar tabs={tabs} activeIdx={activeTab} onSelect={setActiveTab} t={t} />}
        <SingleCodeContent {...sharedProps} />
      </div>
    </div>
  );
}