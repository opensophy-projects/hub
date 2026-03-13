/**
 * UnifiedSearchPanel — Command Palette style search
 *
 * Features:
 * - Desktop: centered modal with backdrop blur
 * - Mobile: fullscreen
 * - Full-text search via loadDocument(slug) — reads .md files from Docs/
 * - Content indexing starts eagerly on mount
 * - Filters: typename, category, tags, date
 * - "Load more" pagination in BOTH recent-docs mode AND search-results mode
 * - Keyboard nav: ↑↓ Enter Esc
 */

import React, {
  useState, useMemo, useEffect, useCallback, useRef, memo,
} from 'react';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useDocuments } from '@/features/docs/hooks/useDocuments';
import {
  Search, X, Hash, Clock, ChevronRight,
  Loader2, RefreshCw, CalendarDays, SlidersHorizontal,
  ArrowUpDown, Layers, Tag, ArrowDown, ArrowUp,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UnifiedSearchPanelProps {
  onClose: () => void;
}

interface CategoryPathItem {
  slug: string;
  title: string;
  icon: string | null;
}

interface DocMeta {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  typename?: string;
  author?: string;
  date?: string;
  updated?: string;
  tags?: string[];
  icon?: string;
  navSlug?: string;
  navTitle?: string;
  categoryPath?: CategoryPathItem[];
}

interface IndexedDoc extends DocMeta {
  plainText: string;
}

type DateFilter = 'all' | 'new' | 'updated';
type SortOrder  = 'date-desc' | 'date-asc';

const PAGE_SIZE   = 10;
const LOAD_MORE_N = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getSnippet(text: string, query: string, radius = 100): string {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, radius * 2).trim() + '…';
  const start = Math.max(0, idx - radius);
  const end   = Math.min(text.length, idx + query.length + radius);
  return (start > 0 ? '…' : '') + text.slice(start, end).trim() + (end < text.length ? '…' : '');
}

function scoreDoc(doc: IndexedDoc, q: string): number {
  const lq = q.toLowerCase();
  let s = 0;
  if (doc.title.toLowerCase().includes(lq))              s += 12;
  if (doc.typename?.toLowerCase().includes(lq))          s +=  4;
  if (doc.description.toLowerCase().includes(lq))        s +=  3;
  if (doc.tags?.some(t => t.toLowerCase().includes(lq))) s +=  2;
  if (doc.plainText.toLowerCase().includes(lq))          s +=  1;
  return s;
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getDocUrl(doc: DocMeta): string {
  if (doc.slug === 'welcome') return '/';
  return `/${doc.slug}`;
}

// ─── Module-level content cache (survives re-mounts) ─────────────────────────
// slug → plain text from loadDocument(slug).content (HTML from MD, stripped)
const contentCache = new Map<string, string>();

// ─── Highlight ────────────────────────────────────────────────────────────────

const Highlight = memo(function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const re    = new RegExp(`(${escapeRe(query)})`, 'gi');
  const parts = text.split(re);
  return (
    <>
      {parts.map((part, i) =>
        re.test(part)
          ? <mark key={i} style={{ background: 'rgba(255,200,50,0.3)', color: 'inherit', borderRadius: '2px', padding: '0 1px' }}>{part}</mark>
          : part
      )}
    </>
  );
});

// ─── Dynamic Lucide icon ──────────────────────────────────────────────────────

const lucideIconCache = new Map<string, React.FC<{ size?: number; style?: React.CSSProperties }>>();

const LucideIcon = memo(function LucideIcon({
  name, size = 14, style,
}: {
  name: string;
  size?: number;
  style?: React.CSSProperties;
}) {
  const [Icon, setIcon] = useState<React.FC<{ size?: number; style?: React.CSSProperties }> | null>(
    () => lucideIconCache.get(name) ?? null
  );
  useEffect(() => {
    if (!name || lucideIconCache.has(name)) return;
    const pascal = name.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
    import('lucide-react').then((mod) => {
      const ic = (mod as Record<string, unknown>)[pascal] as React.FC<{ size?: number; style?: React.CSSProperties }> | undefined;
      if (ic) { lucideIconCache.set(name, ic); setIcon(() => ic); }
    });
  }, [name]);
  if (!Icon) return <span style={{ width: size, height: size, display: 'inline-block', flexShrink: 0 }} />;
  return <Icon size={size} style={style} />;
});

// ─── Color theme ──────────────────────────────────────────────────────────────

function makeColors(isDark: boolean) {
  return isDark ? {
    overlay:          'rgba(0,0,0,0.65)',
    bg:               '#0F0F0F',
    surface:          '#141414',
    border:           'rgba(255,255,255,0.08)',
    borderStrong:     'rgba(255,255,255,0.16)',
    fg:               '#e8e8e8',
    fgMuted:          'rgba(255,255,255,0.42)',
    fgSub:            'rgba(255,255,255,0.22)',
    pillBg:           'rgba(255,255,255,0.06)',
    pillActive:       'rgba(255,255,255,0.13)',
    pillBorder:       'rgba(255,255,255,0.09)',
    pillActiveBorder: 'rgba(255,255,255,0.32)',
    itemHover:        'rgba(255,255,255,0.04)',
    itemActive:       'rgba(255,255,255,0.09)',
    kbd:              'rgba(255,255,255,0.07)',
    kbdBorder:        'rgba(255,255,255,0.13)',
    tagBg:            'rgba(255,255,255,0.06)',
    divider:          'rgba(255,255,255,0.07)',
    iconBg:           'rgba(255,255,255,0.06)',
    iconBorder:       'rgba(255,255,255,0.09)',
    contentBadge:     'rgba(59,130,246,0.15)',
    contentBadgeFg:   'rgba(147,197,253,0.9)',
    filterActiveBg:   'rgba(255,255,255,0.09)',
    sectionLabel:     'rgba(255,255,255,0.2)',
    resetBg:          'rgba(239,68,68,0.1)',
    resetBorder:      'rgba(239,68,68,0.3)',
    resetFg:          '#f87171',
    loadMoreBg:       'rgba(255,255,255,0.06)',
    loadMoreBorder:   'rgba(255,255,255,0.1)',
    loadMoreFg:       'rgba(255,255,255,0.45)',
    loadMoreHoverBg:  'rgba(255,255,255,0.1)',
  } : {
    overlay:          'rgba(0,0,0,0.28)',
    bg:               '#E1E0DC',
    surface:          '#D8D7D3',
    border:           'rgba(0,0,0,0.08)',
    borderStrong:     'rgba(0,0,0,0.16)',
    fg:               '#111111',
    fgMuted:          'rgba(0,0,0,0.45)',
    fgSub:            'rgba(0,0,0,0.28)',
    pillBg:           'rgba(0,0,0,0.05)',
    pillActive:       'rgba(0,0,0,0.11)',
    pillBorder:       'rgba(0,0,0,0.09)',
    pillActiveBorder: 'rgba(0,0,0,0.32)',
    itemHover:        'rgba(0,0,0,0.03)',
    itemActive:       'rgba(0,0,0,0.07)',
    kbd:              'rgba(0,0,0,0.06)',
    kbdBorder:        'rgba(0,0,0,0.12)',
    tagBg:            'rgba(0,0,0,0.06)',
    divider:          'rgba(0,0,0,0.07)',
    iconBg:           'rgba(0,0,0,0.05)',
    iconBorder:       'rgba(0,0,0,0.08)',
    contentBadge:     'rgba(37,99,235,0.1)',
    contentBadgeFg:   'rgba(37,99,235,0.85)',
    filterActiveBg:   'rgba(0,0,0,0.08)',
    sectionLabel:     'rgba(0,0,0,0.25)',
    resetBg:          'rgba(239,68,68,0.08)',
    resetBorder:      'rgba(239,68,68,0.25)',
    resetFg:          '#dc2626',
    loadMoreBg:       'rgba(0,0,0,0.04)',
    loadMoreBorder:   'rgba(0,0,0,0.1)',
    loadMoreFg:       'rgba(0,0,0,0.45)',
    loadMoreHoverBg:  'rgba(0,0,0,0.07)',
  };
}
type C = ReturnType<typeof makeColors>;

// ─── Pill ─────────────────────────────────────────────────────────────────────

const Pill: React.FC<{
  label: React.ReactNode;
  active: boolean;
  C: C;
  onClick: () => void;
}> = ({ label, active, C, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '4px 11px', borderRadius: '20px',
      border: `1px solid ${active ? C.pillActiveBorder : C.pillBorder}`,
      background: active ? C.pillActive : C.pillBg,
      color: active ? C.fg : C.fgMuted,
      fontSize: '12px', fontWeight: active ? 600 : 400,
      cursor: 'pointer', transition: 'all 0.1s',
      lineHeight: 1.5, whiteSpace: 'nowrap', flexShrink: 0,
    }}
  >
    {label}
  </button>
);

// ─── FilterSection ────────────────────────────────────────────────────────────

const FilterSection: React.FC<{
  icon: React.ReactNode;
  label: string;
  C: C;
  children: React.ReactNode;
}> = ({ icon, label, C, children }) => (
  <div>
    <div style={{
      display: 'flex', alignItems: 'center', gap: '5px',
      fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.07em', color: C.sectionLabel, marginBottom: '7px',
    }}>
      {icon}{label}
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
      {children}
    </div>
  </div>
);

// ─── ResultItem ───────────────────────────────────────────────────────────────

interface ResultItemProps {
  doc: IndexedDoc;
  query: string;
  isSelected: boolean;
  idx: number;
  C: C;
  onHover: () => void;
}

const ResultItem = memo(function ResultItem({
  doc, query, isSelected, idx, C, onHover,
}: ResultItemProps) {
  const q = query.toLowerCase();
  const inTitle   = Boolean(q && doc.title.toLowerCase().includes(q));
  const inDesc    = Boolean(q && doc.description.toLowerCase().includes(q));
  const inContent = Boolean(q && doc.plainText.toLowerCase().includes(q));

  let snippet = doc.description.slice(0, 140) + (doc.description.length > 140 ? '…' : '');
  if (query) {
    if (inContent && !inTitle && !inDesc) {
      snippet = getSnippet(doc.plainText, query);
    } else if (inDesc) {
      snippet = getSnippet(doc.description, query);
    }
  }

  const showContentBadge = Boolean(query && inContent && !inTitle && !inDesc);
  const url = getDocUrl(doc);

  return (
    <a
      href={url}
      data-idx={idx}
      onMouseEnter={onHover}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        padding: '9px 10px', borderRadius: '10px',
        textDecoration: 'none', color: 'inherit',
        background: isSelected ? C.itemActive : 'transparent',
        transition: 'background 0.07s',
        marginBottom: '1px', outline: 'none',
      }}
    >
      <div style={{
        flexShrink: 0, width: '32px', height: '32px',
        borderRadius: '8px', background: C.iconBg,
        border: `1px solid ${C.iconBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginTop: '1px',
      }}>
        {doc.icon
          ? <LucideIcon name={doc.icon} size={14} style={{ color: C.fgMuted }} />
          : <Search size={12} style={{ color: C.fgSub }} />
        }
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: C.fg, lineHeight: 1.3 }}>
            <Highlight text={doc.title} query={query} />
          </span>
          {doc.typename?.trim() && (
            <span style={{
              fontSize: '10px', padding: '1px 7px', borderRadius: '10px',
              background: C.tagBg, color: C.fgMuted,
              fontWeight: 600, letterSpacing: '0.05em',
              textTransform: 'uppercase', flexShrink: 0,
            }}>
              {doc.typename}
            </span>
          )}
          {showContentBadge && (
            <span style={{
              fontSize: '10px', padding: '1px 6px', borderRadius: '8px',
              background: C.contentBadge, color: C.contentBadgeFg, flexShrink: 0,
            }}>
              в тексте
            </span>
          )}
        </div>

        <p style={{
          fontSize: '12px', color: C.fgMuted, margin: 0, lineHeight: 1.5,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
        }}>
          <Highlight text={snippet} query={query} />
        </p>

        {((doc.tags && doc.tags.length > 0) || doc.date || doc.updated) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px', flexWrap: 'wrap' }}>
            {doc.tags?.slice(0, 4).map(tag => (
              <span key={tag} style={{
                display: 'inline-flex', alignItems: 'center', gap: '2px',
                fontSize: '10px', color: C.fgSub,
                background: C.tagBg, padding: '1px 6px', borderRadius: '8px',
              }}>
                <Hash size={8} />{tag}
              </span>
            ))}
            <span style={{ flex: 1 }} />
            {doc.updated ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: C.fgSub }}>
                <RefreshCw size={8} />{fmtDate(doc.updated)}
              </span>
            ) : doc.date ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: C.fgSub }}>
                <CalendarDays size={8} />{fmtDate(doc.date)}
              </span>
            ) : null}
          </div>
        )}
      </div>

      <ChevronRight size={13} style={{
        color: isSelected ? C.fgMuted : 'transparent',
        flexShrink: 0, marginTop: '9px', transition: 'color 0.1s',
      }} />
    </a>
  );
});

// ─── Main ─────────────────────────────────────────────────────────────────────

const UnifiedSearchPanel: React.FC<UnifiedSearchPanelProps> = ({ onClose }) => {
  const { isDark } = useTheme();
  const { manifest: docs, loadDocument } = useDocuments();
  const C = useMemo(() => makeColors(isDark), [isDark]);

  const [query, setQuery]                   = useState('');
  const [filterTypename, setFilterTypename] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [activeTags, setActiveTags]         = useState<Set<string>>(new Set());
  const [dateFilter, setDateFilter]         = useState<DateFilter>('all');
  const [sortOrder, setSortOrder]           = useState<SortOrder>('date-desc');
  const [showFilters, setShowFilters]       = useState(false);
  const [indexing, setIndexing]             = useState(false);
  const [indexed, setIndexed]               = useState(false);
  const [contentIndex, setContentIndex]     = useState<Map<string, string>>(new Map());
  const [selectedIdx, setSelectedIdx]       = useState(0);
  const [isMobile, setIsMobile]             = useState(false);
  const [visibleCount, setVisibleCount]     = useState(PAGE_SIZE);
  const [loadMoreHover, setLoadMoreHover]   = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);
  const debouncedQ = useDebounce(query, 200);

  // ── Mobile detection ──────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Mount: focus + scroll lock + Esc ──────────────────────────────────────
  useEffect(() => {
    inputRef.current?.focus();
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // ── EAGER full-text index ─────────────────────────────────────────────────
  // loadDocument(slug) reads the .md file from Docs/ via the existing hook.
  // Returns { content: string } where content is rendered HTML.
  // We strip tags to get plain text for full-text search.
  useEffect(() => {
    if (docs.length === 0 || indexed || indexing) return;

    const allCached = (docs as DocMeta[]).every(d => contentCache.has(d.slug));
    if (allCached) {
      const map = new Map<string, string>();
      (docs as DocMeta[]).forEach(d => map.set(d.slug, contentCache.get(d.slug)!));
      setContentIndex(map);
      setIndexed(true);
      return;
    }

    setIndexing(true);

    const build = async () => {
      const map = new Map<string, string>();

      await Promise.allSettled(
        (docs as DocMeta[]).map(async (doc) => {
          if (contentCache.has(doc.slug)) {
            map.set(doc.slug, contentCache.get(doc.slug)!);
            return;
          }
          let text = '';
          try {
            const full = await loadDocument(doc.slug);
            if (full?.content) text = stripHtml(full.content);
          } catch { /* skip — search will still work on title/desc/tags */ }

          contentCache.set(doc.slug, text);
          map.set(doc.slug, text);
        })
      );

      setContentIndex(map);
      setIndexed(true);
      setIndexing(false);
    };

    build();
  }, [docs, indexed, indexing, loadDocument]);

  // ── Derived filter options ─────────────────────────────────────────────────
  const allTypenames = useMemo(() => {
    const s = new Set<string>();
    (docs as DocMeta[]).forEach(d => { if (d.typename?.trim()) s.add(d.typename.trim()); });
    return Array.from(s).sort();
  }, [docs]);

  const allCategories = useMemo(() => {
    const m = new Map<string, string>();
    (docs as DocMeta[]).forEach(d => {
      d.categoryPath?.forEach(cp => { m.set(cp.slug, cp.title); });
    });
    return Array.from(m.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [docs]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    (docs as DocMeta[]).forEach(d => d.tags?.forEach(t => s.add(t)));
    return Array.from(s).sort();
  }, [docs]);

  const hasUpdatedDocs = useMemo(() =>
    (docs as DocMeta[]).some(d => d.updated), [docs]);

  // ── allResults: full sorted/filtered list (no pagination here) ────────────
  const allResults = useMemo<IndexedDoc[]>(() => {
    let list = (docs as DocMeta[]).map(d => ({
      ...d,
      plainText: contentIndex.get(d.slug) ?? '',
    }));

    if (filterTypename !== 'all')
      list = list.filter(d => d.typename === filterTypename);
    if (filterCategory !== 'all')
      list = list.filter(d => d.categoryPath?.some(cp => cp.slug === filterCategory));
    if (activeTags.size > 0)
      list = list.filter(d => d.tags?.some(t => activeTags.has(t)));

    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    if (dateFilter === 'new')
      list = list.filter(d => d.date && new Date(d.date).getTime() >= cutoff);
    else if (dateFilter === 'updated')
      list = list.filter(d => d.updated && new Date(d.updated).getTime() >= cutoff);

    const q = debouncedQ.trim();
    if (q) {
      list = list
        .map(d => ({ d, score: scoreDoc(d, q) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ d }) => d);
    } else {
      list = list.sort((a, b) => {
        const diff = new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
        return sortOrder === 'date-desc' ? diff : -diff;
      });
    }

    return list;
  }, [debouncedQ, docs, contentIndex, filterTypename, filterCategory, activeTags, dateFilter, sortOrder]);

  // Reset pagination when results change
  useEffect(() => {
    setSelectedIdx(0);
    setVisibleCount(PAGE_SIZE);
  }, [allResults]);

  // Paginated slice — same for both modes
  const results  = useMemo(() => allResults.slice(0, visibleCount), [allResults, visibleCount]);
  const hasMore  = visibleCount < allResults.length;
  const remaining = allResults.length - visibleCount;

  const activeFiltersCount = [
    filterTypename !== 'all',
    filterCategory !== 'all',
    activeTags.size > 0,
    dateFilter !== 'all',
  ].filter(Boolean).length;
  const hasActiveFilters = activeFiltersCount > 0;

  // recent-docs mode = no query AND no active filters
  const showResults = debouncedQ.trim().length > 0 || hasActiveFilters;

  // ── Keyboard navigation ───────────────────────────────────────────────────
  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIdx]) {
      e.preventDefault();
      const el = listRef.current?.querySelector<HTMLAnchorElement>(`[data-idx="${selectedIdx}"]`);
      if (el) el.click();
    }
  }, [results, selectedIdx]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIdx}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  const toggleTag = useCallback((tag: string) => {
    setActiveTags(prev => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilterTypename('all');
    setFilterCategory('all');
    setActiveTags(new Set());
    setDateFilter('all');
  }, []);

  // ── Layout ────────────────────────────────────────────────────────────────
  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed', inset: 0, zIndex: 62,
        background: C.bg,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }
    : {
        position: 'fixed',
        top: '10vh', left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(680px, 92vw)', maxHeight: '78vh',
        zIndex: 62,
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: '16px',
        boxShadow: isDark
          ? '0 40px 100px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04) inset'
          : '0 40px 100px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.6) inset',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        animation: 'sp-panel-in 0.18s cubic-bezier(.22,.61,.36,1)',
      };

  return (
    <>
      <style>{`
        @keyframes sp-panel-in {
          from { opacity:0; transform:translateX(-50%) translateY(-8px) scale(0.97); }
          to   { opacity:1; transform:translateX(-50%) translateY(0) scale(1); }
        }
        @keyframes sp-overlay-in { from{opacity:0;} to{opacity:1;} }
        @keyframes sp-spin { to { transform:rotate(360deg); } }
        .sp-scroll::-webkit-scrollbar       { width:4px; }
        .sp-scroll::-webkit-scrollbar-track { background:transparent; }
        .sp-scroll::-webkit-scrollbar-thumb { background:rgba(128,128,128,0.25); border-radius:4px; }
      `}</style>

      {/* Backdrop (desktop only) */}
      {!isMobile && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 61,
            background: C.overlay,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            animation: 'sp-overlay-in 0.15s ease',
          }}
        />
      )}

      <div style={panelStyle}>

        {/* ── Search row ──────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '0 14px',
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}>
          {indexing
            ? <Loader2 size={17} style={{ color: C.fgMuted, flexShrink: 0, animation: 'sp-spin 0.9s linear infinite' }} />
            : <Search size={17} style={{ color: C.fgMuted, flexShrink: 0 }} />
          }

          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Поиск по документам…"
            style={{
              flex: 1, border: 'none', outline: 'none',
              background: 'transparent', color: C.fg,
              fontSize: '15px', padding: '15px 0',
              fontFamily: 'inherit', lineHeight: 1,
            }}
          />

          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              style={{
                border: 'none', background: 'none', cursor: 'pointer',
                color: C.fgMuted, padding: '4px', borderRadius: '6px',
                display: 'flex', flexShrink: 0,
              }}
            >
              <X size={15} />
            </button>
          )}

          <button
            onClick={() => setShowFilters(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              border: `1px solid ${showFilters || hasActiveFilters ? C.borderStrong : C.border}`,
              background: showFilters || hasActiveFilters ? C.filterActiveBg : C.kbd,
              borderRadius: '8px',
              color: showFilters || hasActiveFilters ? C.fg : C.fgMuted,
              fontSize: '12px', padding: '5px 10px',
              cursor: 'pointer', fontFamily: 'inherit',
              lineHeight: 1, flexShrink: 0,
              fontWeight: hasActiveFilters ? 600 : 400,
            }}
          >
            <SlidersHorizontal size={13} />
            {!isMobile && 'Фильтры'}
            {hasActiveFilters && (
              <span style={{
                background: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)',
                borderRadius: '10px', padding: '0 5px',
                fontSize: '10px', lineHeight: '1.6',
              }}>
                {activeFiltersCount}
              </span>
            )}
          </button>

          <button
            onClick={onClose}
            title="Закрыть"
            style={{
              border: 'none', background: 'none', cursor: 'pointer',
              color: C.fgMuted, padding: '4px', borderRadius: '6px',
              display: 'flex', flexShrink: 0, transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = C.fg)}
            onMouseLeave={e => (e.currentTarget.style.color = C.fgMuted)}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Filter panel (collapsible) ─────────────────────────────────── */}
        {showFilters && (
          <div
            className="sp-scroll"
            style={{
              borderBottom: `1px solid ${C.border}`,
              background: C.surface,
              padding: '12px 14px',
              display: 'flex', flexDirection: 'column', gap: '14px',
              flexShrink: 0, overflowY: 'auto', maxHeight: '260px',
            }}
          >
            <FilterSection icon={<CalendarDays size={10} />} label="Дата публикации" C={C}>
              <Pill label="Все" active={dateFilter === 'all'} C={C} onClick={() => setDateFilter('all')} />
              <Pill
                label={<><CalendarDays size={10} />Новые (30д)</>}
                active={dateFilter === 'new'} C={C}
                onClick={() => setDateFilter(v => v === 'new' ? 'all' : 'new')}
              />
              {hasUpdatedDocs && (
                <Pill
                  label={<><RefreshCw size={10} />Обновлённые (30д)</>}
                  active={dateFilter === 'updated'} C={C}
                  onClick={() => setDateFilter(v => v === 'updated' ? 'all' : 'updated')}
                />
              )}
            </FilterSection>

            <FilterSection icon={<ArrowUpDown size={10} />} label="Сортировка" C={C}>
              <Pill
                label={<><ArrowDown size={10} />Сначала новые</>}
                active={sortOrder === 'date-desc'} C={C}
                onClick={() => setSortOrder('date-desc')}
              />
              <Pill
                label={<><ArrowUp size={10} />Сначала старые</>}
                active={sortOrder === 'date-asc'} C={C}
                onClick={() => setSortOrder('date-asc')}
              />
            </FilterSection>

            {allTypenames.length > 0 && (
              <FilterSection icon={<Layers size={10} />} label="Тип" C={C}>
                <Pill label="Все" active={filterTypename === 'all'} C={C}
                  onClick={() => setFilterTypename('all')} />
                {allTypenames.map(t => (
                  <Pill key={t} label={t} active={filterTypename === t} C={C}
                    onClick={() => setFilterTypename(v => v === t ? 'all' : t)} />
                ))}
              </FilterSection>
            )}

            {allCategories.length > 0 && (
              <FilterSection icon={<Layers size={10} />} label="Категория" C={C}>
                <Pill label="Все" active={filterCategory === 'all'} C={C}
                  onClick={() => setFilterCategory('all')} />
                {allCategories.map(([slug, title]) => (
                  <Pill key={slug} label={title} active={filterCategory === slug} C={C}
                    onClick={() => setFilterCategory(v => v === slug ? 'all' : slug)} />
                ))}
              </FilterSection>
            )}

            {allTags.length > 0 && (
              <FilterSection icon={<Tag size={10} />} label="Теги" C={C}>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '3px',
                      padding: '4px 9px', borderRadius: '20px',
                      border: `1px solid ${activeTags.has(tag) ? C.pillActiveBorder : C.pillBorder}`,
                      background: activeTags.has(tag) ? C.pillActive : 'transparent',
                      color: activeTags.has(tag) ? C.fg : C.fgSub,
                      fontSize: '11px', fontWeight: activeTags.has(tag) ? 600 : 400,
                      cursor: 'pointer', transition: 'all 0.1s', lineHeight: 1.5,
                    }}
                  >
                    <Hash size={9} />{tag}
                  </button>
                ))}
              </FilterSection>
            )}

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                style={{
                  alignSelf: 'flex-start',
                  border: `1px solid ${C.resetBorder}`,
                  background: C.resetBg,
                  borderRadius: '8px', color: C.resetFg,
                  fontSize: '12px', padding: '5px 12px',
                  cursor: 'pointer',
                }}
              >
                × Сбросить фильтры
              </button>
            )}
          </div>
        )}

        {/* ── Results / Recent docs list ────────────────────────────────── */}
        <div
          ref={listRef}
          className="sp-scroll"
          style={{ flex: 1, overflowY: 'auto', padding: '6px 6px 10px' }}
        >
          {/* Search results mode */}
          {showResults && (
            <>
              <div style={{
                padding: '3px 10px 5px', fontSize: '11px', color: C.fgSub,
                display: 'flex', gap: '6px', alignItems: 'center',
              }}>
                <span>
                  {allResults.length} результат{allResults.length === 1 ? '' : allResults.length < 5 ? 'а' : 'ов'}
                </span>
                {indexed  && debouncedQ && <span style={{ opacity: 0.7 }}>· с поиском по содержимому</span>}
                {indexing && <span style={{ opacity: 0.7 }}>· индексируем…</span>}
              </div>

              {allResults.length === 0 && (
                <div style={{ padding: '48px 16px', textAlign: 'center' }}>
                  <Search size={26} style={{ color: C.fgSub, margin: '0 auto 10px' }} />
                  <p style={{ color: C.fgMuted, fontSize: '14px', margin: 0 }}>Ничего не найдено</p>
                  <p style={{ color: C.fgSub, fontSize: '12px', margin: '4px 0 0' }}>
                    Попробуйте другой запрос или сбросьте фильтры
                  </p>
                </div>
              )}

              {results.map((doc, i) => (
                <ResultItem
                  key={doc.id} doc={doc} query={debouncedQ}
                  isSelected={i === selectedIdx} idx={i} C={C}
                  onHover={() => setSelectedIdx(i)}
                />
              ))}
            </>
          )}

          {/* Recent docs mode */}
          {!showResults && (
            <>
              <div style={{
                padding: '8px 10px 4px', fontSize: '10px', color: C.fgSub,
                textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '5px',
              }}>
                <Clock size={10} /> Последние документы
              </div>

              {results.map((doc, i) => (
                <ResultItem
                  key={doc.id} doc={doc} query=""
                  isSelected={i === selectedIdx} idx={i} C={C}
                  onHover={() => setSelectedIdx(i)}
                />
              ))}
            </>
          )}

          {/* "Load more" — shown in BOTH modes whenever there are more items */}
          {hasMore && (
            <div style={{ padding: '8px 6px 4px', display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => setVisibleCount(v => v + LOAD_MORE_N)}
                onMouseEnter={() => setLoadMoreHover(true)}
                onMouseLeave={() => setLoadMoreHover(false)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '7px 20px', borderRadius: '10px',
                  border: `1px solid ${C.loadMoreBorder}`,
                  background: loadMoreHover ? C.loadMoreHoverBg : C.loadMoreBg,
                  color: C.loadMoreFg,
                  fontSize: '12px', fontWeight: 500,
                  cursor: 'pointer', transition: 'background 0.15s',
                  fontFamily: 'inherit',
                }}
              >
                <ArrowDown size={12} />
                Показать ещё {Math.min(LOAD_MORE_N, remaining)}
              </button>
            </div>
          )}
        </div>

        {/* ── Footer (desktop only) ─────────────────────────────────────── */}
        {!isMobile && (
          <div style={{
            borderTop: `1px solid ${C.divider}`,
            padding: '6px 14px',
            display: 'flex', alignItems: 'center', gap: '14px',
            flexShrink: 0,
          }}>
            {([
              { keys: ['↑', '↓'], label: 'навигация' },
              { keys: ['↵'],      label: 'открыть'   },
              { keys: ['Esc'],    label: 'закрыть'   },
            ] as const).map(({ keys, label }) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: C.fgSub }}>
                {keys.map(k => (
                  <kbd key={k} style={{
                    background: C.kbd, border: `1px solid ${C.kbdBorder}`,
                    borderRadius: '4px', padding: '1px 5px',
                    fontFamily: 'monospace', fontSize: '10px', color: C.fgMuted,
                  }}>
                    {k}
                  </kbd>
                ))}
                <span>{label}</span>
              </span>
            ))}
            {indexed && (
              <span style={{ marginLeft: 'auto', fontSize: '10px', color: C.fgSub, opacity: 0.6 }}>
                full-text ✓
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default UnifiedSearchPanel;