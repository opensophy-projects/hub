/**
 * Navigation.tsx — Redesigned
 *
 * Desktop (>1000px): Rail 56px + slide-out panel + resize handle
 * Mobile (≤1000px):  Bottom bar + full-screen panels
 *
 * Key design improvements:
 * — Clearer visual hierarchy with section labels and dividers
 * — Better typography: weight/size scale for nav items
 * — Active state with left-border accent + soft bg
 * — Category nodes with proper indentation and collapse animation
 * — Rail icons with tooltip labels
 * — Panel has proper header with section title
 * — Search input with clear affordance
 * — Smooth transitions throughout
 */

import React, {
  useState, useEffect, useRef, useMemo, useCallback,
  lazy, Suspense, memo, startTransition,
} from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useManifest } from '@/features/docs/hooks/useDocuments';
import { storageSet } from '@/shared/lib/storage';
import { CONTACTS } from '@/shared/data/contacts';
import { scrollToElement } from '@/features/docs/utils/scrollUtils';
import { AnimatePresence } from 'framer-motion';
import {
  Search, Sun, Moon, ChevronDown, ChevronRight,
  Mail, X, Home, AlertTriangle,
  FolderOpen, List, PanelLeft, ArrowUp,
} from 'lucide-react';
import { useIsDesktopNav } from '@/shared/hooks/useBreakpoint';

const LazyUnifiedSearchPanel = lazy(() => import('./UnifiedSearchPanel'));

const RAIL_W        = 56;
const PANEL_DEFAULT = 288;
const PANEL_MIN     = 220;
const PANEL_MAX     = 480;

export interface TocItem { id: string; text: string; level: number; }
interface CategoryPathItem { slug: string; title: string; icon: string | null; }
interface Doc {
  id: string; slug: string; title: string; description: string;
  type: string; typename: string; icon?: string;
  navSlug?: string; navTitle?: string; navIcon?: string;
  categoryPath?: CategoryPathItem[];
}
interface NavNode { title: string; slug: string; icon: string | null; docs: Doc[]; children: Record<string, NavNode>; isCategory: boolean; }
interface NavSection { navSlug: string; navTitle: string; navIcon: string; }
export type PanelType = 'nav' | 'toc' | 'contacts' | null;

interface NavigationProps {
  currentDocSlug?: string;
  toc?: TocItem[];
  activeHeadingId?: string;
}

// ─── Design Tokens ────────────────────────────────────────────────────────────

const DARK = {
  railBg:       '#0d0d0d',
  panelBg:      '#0d0d0d',
  panelBorder:  'rgba(255,255,255,0.07)',
  // Text
  fg:           '#e2e2df',
  fgMuted:      'rgba(255,255,255,0.4)',
  fgSub:        'rgba(255,255,255,0.2)',
  fgDisabled:   'rgba(255,255,255,0.15)',
  // Interactive
  hov:          'rgba(255,255,255,0.04)',
  activeItem:   'rgba(255,255,255,0.06)',
  accent:       '#ffffff',
  accentLine:   '#ffffff',
  accentSoft:   'rgba(255,255,255,0.06)',
  // Inputs
  inputBg:      'rgba(255,255,255,0.05)',
  inputBorder:  'rgba(255,255,255,0.1)',
  inputFocus:   'rgba(255,255,255,0.18)',
  // Section label
  sectionLabel: 'rgba(255,255,255,0.22)',
  // Handle
  handle:       'rgba(255,255,255,0.15)',
  handleHov:    'rgba(255,255,255,0.5)',
  // Mobile
  mobBg:        '#0a0a0a',
  overlay:      'rgba(0,0,0,0.7)',
  surface:      '#141414',
  // Dropdown
  dropdownBg:   '#161616',
  dropdownShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07)',
  // Divider
  divider:      'rgba(255,255,255,0.06)',
  // Rail active
  railActiveInk:  '#ffffff',
  railInactiveInk: 'rgba(255,255,255,0.32)',
} as const;

const LIGHT = {
  railBg:       '#DDDCD8',
  panelBg:      '#DDDCD8',
  panelBorder:  'rgba(0,0,0,0.07)',
  fg:           '#1a1a18',
  fgMuted:      'rgba(0,0,0,0.45)',
  fgSub:        'rgba(0,0,0,0.28)',
  fgDisabled:   'rgba(0,0,0,0.18)',
  hov:          'rgba(0,0,0,0.04)',
  activeItem:   'rgba(0,0,0,0.06)',
  accent:       '#000000',
  accentLine:   '#1a1a18',
  accentSoft:   'rgba(0,0,0,0.07)',
  inputBg:      'rgba(0,0,0,0.04)',
  inputBorder:  'rgba(0,0,0,0.1)',
  inputFocus:   'rgba(0,0,0,0.2)',
  sectionLabel: 'rgba(0,0,0,0.3)',
  handle:       'rgba(0,0,0,0.15)',
  handleHov:    'rgba(0,0,0,0.5)',
  mobBg:        '#d8d7d3',
  overlay:      'rgba(0,0,0,0.3)',
  surface:      '#d0cfc9',
  dropdownBg:   '#E5E4E0',
  dropdownShadow: '0 8px 32px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.07)',
  divider:      'rgba(0,0,0,0.06)',
  railActiveInk:  '#000000',
  railInactiveInk: 'rgba(0,0,0,0.35)',
} as const;

function tk(isDark: boolean) { return isDark ? DARK : LIGHT; }

// ─── Lucide icon lazy loader ──────────────────────────────────────────────────

const iconCache = new Map<string, React.FC<{ size?: number }>>();
const LucideIcon: React.FC<{ name: string; size?: number }> = memo(({ name, size = 15 }) => {
  const [Icon, setIcon] = useState<React.FC<{ size?: number }> | null>(() => iconCache.get(name) ?? null);
  useEffect(() => {
    if (!name || iconCache.has(name)) return;
    const pascal = name.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
    import('lucide-react').then(mod => {
      const ic = (mod as Record<string, unknown>)[pascal] as React.FC<{ size?: number }> | undefined;
      if (ic) { iconCache.set(name, ic); setIcon(() => ic); }
    });
  }, [name]);
  if (!Icon) return <span style={{ width: size, height: size, display: 'inline-block' }} />;
  return <Icon size={size} />;
});

// ─── Nav tree builder ─────────────────────────────────────────────────────────

function buildTree(docs: Doc[], query: string, navSlug: string): NavNode {
  const root: NavNode = { title: '', slug: '', icon: null, docs: [], children: {}, isCategory: false };
  const q = query.toLowerCase();
  const filtered = docs.filter(d => (!q || d.title.toLowerCase().includes(q)) && (d.navSlug ?? '') === navSlug);
  for (const doc of filtered) {
    let slug = doc.slug;
    if (navSlug && slug.startsWith(navSlug + '/')) slug = slug.slice(navSlug.length + 1);
    const parts = slug.split('/');
    const cats  = doc.categoryPath ?? [];
    let cur = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      if (!cur.children[p]) {
        const ci = cats[i];
        cur.children[p] = { title: ci?.title ?? p, slug: p, icon: ci?.icon ?? null, docs: [], children: {}, isCategory: true };
      }
      cur = cur.children[p];
    }
    cur.docs.push(doc);
  }
  return root;
}

function countDocs(node: NavNode): number {
  return node.docs.length + Object.values(node.children).reduce((s, c) => s + countDocs(c), 0);
}

// ─── DocLink ──────────────────────────────────────────────────────────────────

const DocLink: React.FC<{
  doc: Doc; isDark: boolean; isActive: boolean; onClick?: () => void; mobile?: boolean;
}> = memo(({ doc, isDark, isActive, onClick, mobile }) => {
  const t = tk(isDark);
  const [hov, setHov] = useState(false);
  return (
    <a
      href={`/${doc.slug}`}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: mobile ? '10px 14px' : '5px 10px',
        borderRadius: '7px',
        fontSize: mobile ? '0.95rem' : '0.838rem',
        lineHeight: 1.45,
        textDecoration: 'none',
        borderLeft: `2px solid ${isActive ? t.accentLine : 'transparent'}`,
        color: isActive ? t.accent : hov ? t.fg : t.fgMuted,
        fontWeight: isActive ? 600 : 400,
        background: isActive ? t.activeItem : hov ? t.hov : 'transparent',
        transition: 'background 0.12s, color 0.12s, border-color 0.12s',
        letterSpacing: isActive ? '-0.01em' : 'normal',
      }}
    >
      {doc.icon && (
        <span style={{ flexShrink: 0, width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isActive ? 0.75 : 0.45 }}>
          <LucideIcon name={doc.icon} size={13} />
        </span>
      )}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'normal', wordBreak: 'break-word' }}>
        {doc.title}
      </span>
    </a>
  );
});

// ─── CategoryNode ─────────────────────────────────────────────────────────────

const CategoryNode: React.FC<{
  node: NavNode; path: string; expandedPaths: Set<string>;
  onToggle: (p: string) => void; isDark: boolean; currentDocSlug?: string;
  onDocClick?: () => void; mobile?: boolean; depth?: number;
}> = memo(({ node, path, expandedPaths, onToggle, isDark, currentDocSlug, onDocClick, mobile, depth = 0 }) => {
  const t = tk(isDark);
  const expanded = expandedPaths.has(path);
  const total = countDocs(node);
  const [hov, setHov] = useState(false);

  return (
    <div>
      <button
        onClick={() => onToggle(path)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: mobile ? '9px 14px' : '5px 10px',
          borderRadius: '7px',
          fontSize: mobile ? '0.9rem' : '0.8rem',
          fontWeight: 600,
          letterSpacing: '0.01em',
          border: 'none',
          background: hov ? t.hov : 'transparent',
          color: t.fgMuted,
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background 0.12s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{
            width: 14, height: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: t.fgSub,
            transition: 'transform 0.18s',
            transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}>
            <ChevronDown size={12} />
          </span>
          {node.icon && (
            <span style={{ width: 13, height: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.45 }}>
              <LucideIcon name={node.icon} size={12} />
            </span>
          )}
          <span style={{ wordBreak: 'break-word', lineHeight: 1.4, textTransform: 'uppercase', fontSize: mobile ? '0.72rem' : '0.69rem', letterSpacing: '0.07em' }}>{node.title}</span>
        </div>
        {total > 0 && (
          <span style={{
            fontSize: '0.67rem',
            padding: '1px 6px',
            borderRadius: '4px',
            background: t.accentSoft,
            color: t.fgSub,
            flexShrink: 0,
            fontWeight: 500,
          }}>
            {total}
          </span>
        )}
      </button>

      {expanded && (
        <div style={{
          marginLeft: '0.75rem',
          borderLeft: `1px solid ${t.divider}`,
          paddingLeft: '0.5rem',
          marginTop: '1px',
          marginBottom: '2px',
        }}>
          {[...node.docs].sort((a, b) => a.title.localeCompare(b.title)).map(doc => (
            <DocLink
              key={doc.id} doc={doc} isDark={isDark}
              isActive={currentDocSlug === doc.slug}
              onClick={onDocClick} mobile={mobile}
            />
          ))}
          {Object.entries(node.children).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => (
            <CategoryNode
              key={key} node={child} path={`${path}/${key}`}
              expandedPaths={expandedPaths} onToggle={onToggle}
              isDark={isDark} currentDocSlug={currentDocSlug}
              onDocClick={onDocClick} mobile={mobile} depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// ─── Section hooks ────────────────────────────────────────────────────────────

function useNavSections(docs: Doc[]): NavSection[] {
  return useMemo<NavSection[]>(() => {
    const map = new Map<string, NavSection>();
    map.set('', { navSlug: '', navTitle: 'Главная', navIcon: 'home' });
    for (const doc of docs) {
      const slug = doc.navSlug ?? '';
      if (slug && !map.has(slug)) {
        map.set(slug, { navSlug: slug, navTitle: doc.navTitle ?? slug, navIcon: doc.navIcon ?? '' });
      }
    }
    return Array.from(map.values());
  }, [docs]);
}

function useActiveNavSlug(sections: NavSection[]): [string, React.Dispatch<React.SetStateAction<string>>] {
  const [activeNavSlug, setActiveNavSlug] = useState('');
  useEffect(() => {
    if (!sections.length) return;
    const pathname = globalThis.location.pathname.replace(/^\//, '');
    const matched = sections.filter(s => s.navSlug).find(s => pathname === s.navSlug || pathname.startsWith(s.navSlug + '/'));
    startTransition(() => setActiveNavSlug(matched?.navSlug ?? ''));
  }, [sections]);
  return [activeNavSlug, setActiveNavSlug];
}

function useExpandedPaths(currentDocSlug: string | undefined, activeNavSlug: string): [Set<string>, React.Dispatch<React.SetStateAction<Set<string>>>] {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!currentDocSlug) return;
    let slug = currentDocSlug;
    if (activeNavSlug && slug.startsWith(activeNavSlug + '/')) slug = slug.slice(activeNavSlug.length + 1);
    const parts = slug.split('/');
    const pathParts = parts.slice(0, -1).map((_, i) => parts.slice(0, i + 1).join('/'));
    if (pathParts.length) startTransition(() => setExpandedPaths(new Set(pathParts)));
  }, [currentDocSlug, activeNavSlug]);
  return [expandedPaths, setExpandedPaths];
}

function useNavPanel(docs: Doc[], currentDocSlug: string | undefined) {
  const [query, setQuery] = useState('');
  const [sectionOpen, setSectionOpen] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const sections = useNavSections(docs);
  const [activeNavSlug, setActiveNavSlug] = useActiveNavSlug(sections);
  const [expandedPaths, setExpandedPaths] = useExpandedPaths(currentDocSlug, activeNavSlug);

  useEffect(() => {
    if (!sectionOpen) return;
    const h = (e: MouseEvent) => {
      if (sectionRef.current && !sectionRef.current.contains(e.target as Node)) setSectionOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [sectionOpen]);

  const navTree = useMemo(() => buildTree(docs, query, activeNavSlug), [docs, query, activeNavSlug]);
  const activeSection = sections.find(s => s.navSlug === activeNavSlug) ?? sections[0];

  const togglePath = useCallback((path: string) => {
    setExpandedPaths(prev => {
      const n = new Set(prev);
      n.has(path) ? n.delete(path) : n.add(path);
      return n;
    });
  }, []);

  const handleSectionSelect = useCallback((slug: string) => {
    storageSet('hub:activeNavSlug', slug);
    setActiveNavSlug(slug);
    setExpandedPaths(new Set());
    setSectionOpen(false);
  }, [setActiveNavSlug]);

  return { query, setQuery, sectionOpen, setSectionOpen, sectionRef, sections, activeNavSlug, expandedPaths, navTree, activeSection, togglePath, handleSectionSelect };
}

function useDesktopPanel() {
  const [activePanel, setActivePanel] = useState<PanelType>(() => {
    try {
      const s = sessionStorage.getItem('hub:activePanel');
      if (s === 'nav' || s === 'toc' || s === 'contacts') return s as PanelType;
    } catch { }
    return null;
  });

  const [panelWidth, setPanelWidth] = useState<number>(() => {
    try {
      const w = Number(sessionStorage.getItem('hub:panelWidth'));
      if (w >= PANEL_MIN && w <= PANEL_MAX) return w;
    } catch { }
    return PANEL_DEFAULT;
  });

  useEffect(() => {
    try { sessionStorage.setItem('hub:activePanel', activePanel ?? ''); } catch { }
  }, [activePanel]);

  useEffect(() => {
    try { sessionStorage.setItem('hub:panelWidth', String(panelWidth)); } catch { }
  }, [panelWidth]);

  const togglePanel = useCallback((panel: PanelType) => {
    setActivePanel(prev => {
      const next = prev === panel ? null : panel;
      try { sessionStorage.setItem('hub:activePanel', next ?? ''); } catch { }
      return next;
    });
  }, []);

  return { activePanel, setActivePanel, panelWidth, setPanelWidth, togglePanel };
}

function usePanelResize(panelWidth: number, setPanelWidth: (w: number) => void) {
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartW = useRef(0);

  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartW.current = panelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      setPanelWidth(Math.max(PANEL_MIN, Math.min(PANEL_MAX, dragStartW.current + ev.clientX - dragStartX.current)));
    };
    const onUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      globalThis.removeEventListener('mousemove', onMove);
      globalThis.removeEventListener('mouseup', onUp);
    };
    globalThis.addEventListener('mousemove', onMove);
    globalThis.addEventListener('mouseup', onUp);
  }, [panelWidth, setPanelWidth]);

  return { onResizeMouseDown };
}

// ─── Section Dropdown ─────────────────────────────────────────────────────────

const SectionDropdown: React.FC<{
  sections: NavSection[]; activeNavSlug: string; mobile: boolean;
  isDark: boolean; onSelect: (slug: string) => void;
}> = ({ sections, activeNavSlug, mobile, isDark, onSelect }) => {
  const t = tk(isDark);
  return (
    <>
      {sections.map(s => (
        <button
          key={s.navSlug}
          onClick={() => onSelect(s.navSlug)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            padding: mobile ? '0.7rem 1rem' : '0.5rem 0.8rem',
            fontSize: mobile ? '0.95rem' : '0.838rem',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            background: s.navSlug === activeNavSlug ? t.accentSoft : 'transparent',
            color: s.navSlug === activeNavSlug ? t.accent : t.fg,
            fontWeight: s.navSlug === activeNavSlug ? 600 : 400,
            transition: 'background 0.1s',
          }}
        >
          <span style={{ width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5, flexShrink: 0 }}>
            {s.navSlug === '' ? <Home size={13} /> : <LucideIcon name={s.navIcon} size={13} />}
          </span>
          <span>{s.navTitle}</span>
          {s.navSlug === activeNavSlug && (
            <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: t.accent, flexShrink: 0 }} />
          )}
        </button>
      ))}
    </>
  );
};

// ─── Nav Tree States ──────────────────────────────────────────────────────────

const NavTreeContent: React.FC<{
  error: boolean; loading: boolean; navTree: NavNode;
  currentDocSlug: string | undefined; expandedPaths: Set<string>;
  onToggle: (p: string) => void; isDark: boolean; mobile?: boolean;
}> = ({ error, loading, navTree, currentDocSlug, expandedPaths, onToggle, isDark, mobile }) => {
  const t = tk(isDark);

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
      <AlertTriangle size={20} style={{ color: 'rgba(251,191,36,0.7)' }} />
      <p style={{ margin: 0, fontSize: '0.82rem', color: t.fgMuted }}>Не удалось загрузить документы</p>
      <button
        onClick={() => globalThis.location.reload()}
        style={{ padding: '0.35rem 0.9rem', borderRadius: '6px', border: `1px solid ${t.panelBorder}`, background: 'transparent', color: t.fgMuted, fontSize: '0.78rem', cursor: 'pointer' }}
      >
        Обновить
      </button>
    </div>
  );

  if (loading) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[80, 65, 75, 55, 70].map((w, i) => (
          <div key={i} style={{
            height: '28px', borderRadius: '6px',
            background: `linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'} 0%, ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'} 50%, ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'} 100%)`,
            width: `${w}%`,
            animation: 'shimmer 1.5s ease-in-out infinite',
            animationDelay: `${i * 0.1}s`,
          }} />
        ))}
        <style>{`@keyframes shimmer{0%,100%{opacity:.5}50%{opacity:1}}`}</style>
      </div>
    </div>
  );

  const hasDocs = navTree.docs.length > 0;
  const hasCats = Object.keys(navTree.children).length > 0;

  return (
    <nav aria-label="Документация">
      {hasDocs && (
        <div style={{ marginBottom: hasCats ? '4px' : 0 }}>
          {[...navTree.docs].sort((a, b) => a.title.localeCompare(b.title)).map(doc => (
            <DocLink key={doc.id} doc={doc} isDark={isDark} isActive={currentDocSlug === doc.slug} mobile={mobile} />
          ))}
        </div>
      )}
      {hasDocs && hasCats && (
        <div style={{ height: '1px', background: tk(isDark).divider, margin: '4px 8px 4px' }} />
      )}
      {Object.entries(navTree.children).sort(([a], [b]) => a.localeCompare(b)).map(([key, node]) => (
        <CategoryNode
          key={key} node={node} path={key}
          expandedPaths={expandedPaths} onToggle={onToggle}
          isDark={isDark} currentDocSlug={currentDocSlug} mobile={mobile}
        />
      ))}
    </nav>
  );
};

// ─── NavPanelContent ──────────────────────────────────────────────────────────

const NavPanelContent: React.FC<{
  isDark: boolean; currentDocSlug?: string; mobile?: boolean;
}> = ({ isDark, currentDocSlug, mobile }) => {
  const t = tk(isDark);
  const { manifest: docs, loading, error } = useManifest();
  const {
    query, setQuery, sectionOpen, setSectionOpen, sectionRef,
    sections, activeNavSlug, expandedPaths, navTree, activeSection,
    togglePath, handleSectionSelect,
  } = useNavPanel(docs as Doc[], currentDocSlug);

  const [inputFocused, setInputFocused] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Search */}
      <div style={{ flexShrink: 0, padding: mobile ? '12px 14px' : '10px', borderBottom: `1px solid ${t.divider}` }}>
        <div style={{
          position: 'relative',
          borderRadius: '8px',
          border: `1px solid ${inputFocused ? t.inputFocus : t.inputBorder}`,
          background: t.inputBg,
          transition: 'border-color 0.15s',
        }}>
          <Search
            size={13}
            style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: t.fgSub, pointerEvents: 'none' }}
          />
          <input
            type="text"
            placeholder="Фильтр…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            style={{
              width: '100%',
              padding: mobile ? '0.55rem 0.55rem 0.55rem 2.1rem' : '0.4rem 0.4rem 0.4rem 1.9rem',
              borderRadius: '8px',
              fontSize: mobile ? '0.95rem' : '0.82rem',
              border: 'none',
              background: 'transparent',
              color: t.fg,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)',
                border: 'none', background: 'none', cursor: 'pointer', color: t.fgSub,
                display: 'flex', alignItems: 'center', padding: '2px',
                borderRadius: '4px',
              }}
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Section selector */}
      {sections.length > 1 && activeSection && (
        <div style={{ flexShrink: 0, padding: mobile ? '8px 14px' : '7px 10px', borderBottom: `1px solid ${t.divider}`, position: 'relative' }} ref={sectionRef}>
          <button
            onClick={() => setSectionOpen(v => !v)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: mobile ? '0.5rem 0.75rem' : '0.38rem 0.6rem',
              borderRadius: '7px',
              fontSize: mobile ? '0.9rem' : '0.82rem',
              border: `1px solid ${sectionOpen ? t.inputFocus : t.inputBorder}`,
              background: sectionOpen ? t.hov : 'transparent',
              color: t.fg,
              cursor: 'pointer',
              transition: 'background 0.1s, border-color 0.15s',
              fontWeight: 500,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
              <span style={{ opacity: 0.45, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                {activeSection.navSlug === '' ? <Home size={13} /> : <LucideIcon name={activeSection.navIcon} size={13} />}
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                {activeSection.navTitle}
              </span>
            </div>
            <ChevronDown
              size={11}
              style={{ color: t.fgSub, flexShrink: 0, transform: sectionOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s' }}
            />
          </button>

          {sectionOpen && (
            <div style={{
              position: 'absolute',
              left: mobile ? '14px' : '10px',
              right: mobile ? '14px' : '10px',
              top: 'calc(100% + 2px)',
              borderRadius: '10px',
              border: `1px solid ${t.panelBorder}`,
              background: t.dropdownBg,
              boxShadow: t.dropdownShadow,
              zIndex: 100,
              overflow: 'hidden',
              padding: '4px',
            }}>
              <SectionDropdown
                sections={sections} activeNavSlug={activeNavSlug}
                mobile={!!mobile} isDark={isDark} onSelect={handleSectionSelect}
              />
            </div>
          )}
        </div>
      )}

      {/* Nav tree */}
      <div style={{ flex: 1, overflowY: 'auto', padding: mobile ? '8px 6px' : '6px 6px' }}>
        <NavTreeContent
          error={!!error} loading={loading} navTree={navTree}
          currentDocSlug={currentDocSlug} expandedPaths={expandedPaths}
          onToggle={togglePath} isDark={isDark} mobile={mobile}
        />
      </div>
    </div>
  );
};

// ─── TOC ─────────────────────────────────────────────────────────────────────

function getTocItemStyle(item: TocItem, dist: number, activeId: string, isDark: boolean) {
  const t = tk(isDark);
  const isActive = item.id === activeId && activeId !== '';
  const hasActive = activeId !== '';

  let opacity: number;
  if (!hasActive) opacity = 0.6;
  else if (isActive) opacity = 1;
  else opacity = Math.max(0.3, 0.75 - dist * 0.14);

  const fontSize = `${0.836 - (item.level - 2) * 0.03}rem`;
  const paddingLeft = 12 + (item.level - 2) * 13;

  return {
    isActive,
    fontSize,
    paddingLeft,
    color: isActive ? t.accent : isDark ? `rgba(255,255,255,${opacity})` : `rgba(0,0,0,${opacity})`,
    borderColor: isActive ? t.accentLine : 'transparent',
    bg: isActive ? t.activeItem : 'transparent',
  };
}

const TocPanelContent: React.FC<{
  toc: TocItem[]; activeId: string; isDark: boolean; onItemClick?: () => void; mobile?: boolean;
}> = ({ toc, activeId, isDark, onItemClick, mobile = false }) => {
  const t = tk(isDark);

  if (!toc.length) return (
    <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', fontSize: '0.83rem', color: t.fgMuted }}>
      На этой странице нет заголовков
    </div>
  );

  const activeIndex = toc.findIndex(i => i.id === activeId);

  // Group h2s with their children for visual separation
  return (
    <nav aria-label="Оглавление" style={{ padding: mobile ? '8px 6px' : '6px 4px' }}>
      {toc.map((item, index) => {
        const dist = Math.abs(index - activeIndex);
        const s = getTocItemStyle(item, dist, activeId, isDark);
        return (
          <button
            key={item.id}
            onClick={() => { scrollToElement(item.id); onItemClick?.(); }}
            style={{
              width: '100%',
              textAlign: 'left',
              paddingTop: mobile ? '0.52rem' : '0.36rem',
              paddingBottom: mobile ? '0.52rem' : '0.36rem',
              paddingRight: mobile ? '1rem' : '0.75rem',
              paddingLeft: `${mobile ? s.paddingLeft + 2 : s.paddingLeft}px`,
              fontSize: mobile ? '0.95rem' : s.fontSize,
              lineHeight: 1.5,
              background: s.bg,
              border: 'none',
              cursor: 'pointer',
              borderLeft: `2px solid ${s.borderColor}`,
              borderRadius: '0 7px 7px 0',
              color: s.color,
              fontWeight: s.isActive ? 600 : item.level === 2 ? 450 : 400,
              transition: 'color 0.12s, background 0.12s, border-color 0.12s',
            }}
          >
            {item.text}
          </button>
        );
      })}
    </nav>
  );
};

// ─── Contacts ─────────────────────────────────────────────────────────────────

const ContactsPanelContent: React.FC<{ isDark: boolean; mobile?: boolean }> = ({ isDark, mobile }) => {
  const t = tk(isDark);
  return (
    <div style={{ padding: '6px' }}>
      {CONTACTS.map(c => (
        <a
          key={c.href}
          href={c.href}
          target={c.external ? '_blank' : undefined}
          rel={c.external ? 'noopener noreferrer' : undefined}
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: mobile ? '12px 14px' : '9px 10px',
            borderRadius: '8px',
            textDecoration: 'none',
            color: t.fg,
            fontSize: mobile ? '0.95rem' : '0.86rem',
            gap: '2px',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = t.hov; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <div style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>{c.title}</div>
          <div style={{ fontSize: mobile ? '0.82rem' : '0.76rem', color: t.fgMuted }}>{c.subtitle}</div>
        </a>
      ))}
    </div>
  );
};

// ─── Panel Header ─────────────────────────────────────────────────────────────

const PanelHeader: React.FC<{ title: string; isDark: boolean; onClose: () => void }> = ({ title, isDark, onClose }) => {
  const t = tk(isDark);
  return (
    <div style={{
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 12px 8px',
      borderBottom: `1px solid ${t.divider}`,
    }}>
      <span style={{
        fontSize: '0.69rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: t.sectionLabel,
      }}>
        {title}
      </span>
      <button
        onClick={onClose}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 22, height: 22, borderRadius: '5px',
          border: 'none', background: 'transparent',
          color: t.fgSub, cursor: 'pointer',
          transition: 'background 0.1s, color 0.1s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = t.hov;
          (e.currentTarget as HTMLElement).style.color = t.fg;
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = 'transparent';
          (e.currentTarget as HTMLElement).style.color = t.fgSub;
        }}
      >
        <X size={12} />
      </button>
    </div>
  );
};

// ─── RailBtn ──────────────────────────────────────────────────────────────────

const RailBtn: React.FC<{
  icon: React.ReactNode;
  isActive?: boolean;
  isDark: boolean;
  onClick: () => void;
  title?: string;
}> = ({ icon, isActive, isDark, onClick, title }) => {
  const t = tk(isDark);
  const [hov, setHov] = useState(false);

  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: RAIL_W,
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        background: isActive ? t.accentSoft : hov ? t.hov : 'transparent',
        color: isActive ? t.railActiveInk : hov ? t.fg : t.railInactiveInk,
        cursor: 'pointer',
        borderRadius: '8px',
        flexShrink: 0,
        transition: 'background 0.12s, color 0.12s',
        position: 'relative',
      }}
    >
      {/* Active indicator dot */}
      {isActive && (
        <span style={{
          position: 'absolute',
          left: '4px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '3px',
          height: '16px',
          borderRadius: '2px',
          background: t.accentLine,
        }} />
      )}
      <span style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </span>
    </button>
  );
};

// ─── Desktop Nav ──────────────────────────────────────────────────────────────

const DesktopNav: React.FC<{
  isDark: boolean; toggleTheme: () => void; currentDocSlug?: string; toc: TocItem[]; activeId: string;
}> = ({ isDark, toggleTheme, currentDocSlug, toc, activeId }) => {
  const t = tk(isDark);
  const [railVisible, setRailVisible] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [handleHov, setHandleHov] = useState(false);
  const { activePanel, setActivePanel, panelWidth, setPanelWidth, togglePanel } = useDesktopPanel();
  const { onResizeMouseDown } = usePanelResize(panelWidth, setPanelWidth);

  useEffect(() => {
    try {
      const panel = sessionStorage.getItem('hub:activePanel');
      const hasPanel = panel === 'nav' || panel === 'toc' || panel === 'contacts';
      const w = Number(sessionStorage.getItem('hub:panelWidth'));
      const pw = (w >= PANEL_MIN && w <= PANEL_MAX) ? w : PANEL_DEFAULT;
      const left = RAIL_W + (hasPanel ? pw : 0);
      document.documentElement.style.setProperty('--nav-left', `${left}px`);
    } catch { }
  }, []);

  useEffect(() => {
    const left = (railVisible ? RAIL_W : 0) + (activePanel ? panelWidth : 0);
    document.documentElement.style.setProperty('--nav-left', `${left}px`);
    return () => { document.documentElement.style.removeProperty('--nav-left'); };
  }, [railVisible, activePanel, panelWidth]);

  const panelTitles: Record<Exclude<PanelType, null>, string> = {
    nav: 'Навигация', toc: 'Оглавление', contacts: 'Контакты',
  };

  return (
    <>
      {railVisible && (
        <aside
          aria-label="Боковая панель"
          style={{
            position: 'fixed', left: 0, top: 0, height: '100vh',
            width: RAIL_W,
            background: t.railBg,
            borderRight: `1px solid ${t.panelBorder}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 50,
            padding: '8px 0',
            gap: '2px',
          }}
        >
          {/* Logo */}
          <div style={{ width: RAIL_W, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: '4px' }}>
            <img src="/favicon.png" alt="hub" style={{ width: 24, height: 24, objectFit: 'contain', opacity: 0.85 }} />
          </div>

          {/* Divider */}
          <div style={{ width: 28, height: '1px', background: t.divider, margin: '2px 0 4px', flexShrink: 0 }} />

          {/* Top actions */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', width: '100%', padding: '0 4px' }}>
            <RailBtn icon={<PanelLeft size={16} />} isDark={isDark} onClick={() => setRailVisible(false)} title="Скрыть панель" />
            <RailBtn icon={isDark ? <Sun size={16} /> : <Moon size={16} />} isDark={isDark} onClick={toggleTheme} title={isDark ? 'Светлая тема' : 'Тёмная тема'} />
            <RailBtn icon={<Search size={16} />} isDark={isDark} onClick={() => setSearchOpen(true)} title="Поиск (⌘K)" />
          </div>

          {/* Middle divider */}
          <div style={{ width: 28, height: '1px', background: t.divider, margin: '4px 0', flexShrink: 0 }} />

          {/* Navigation buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', width: '100%', padding: '0 4px', flex: 1 }}>
            <RailBtn icon={<FolderOpen size={16} />} isActive={activePanel === 'nav'} isDark={isDark} onClick={() => togglePanel('nav')} title="Разделы" />
            <RailBtn icon={<List size={16} />} isActive={activePanel === 'toc'} isDark={isDark} onClick={() => togglePanel('toc')} title="Оглавление" />
            <RailBtn icon={<Mail size={16} />} isActive={activePanel === 'contacts'} isDark={isDark} onClick={() => togglePanel('contacts')} title="Контакты" />
          </div>

          {/* Bottom */}
          <div style={{ width: 28, height: '1px', background: t.divider, margin: '4px 0 2px', flexShrink: 0 }} />
          <div style={{ padding: '0 4px', width: '100%' }}>
            <RailBtn icon={<ArrowUp size={16} />} isDark={isDark} onClick={() => globalThis.scrollTo({ top: 0, behavior: 'smooth' })} title="Наверх" />
          </div>
        </aside>
      )}

      {!railVisible && (
        <button
          onClick={() => setRailVisible(true)}
          title="Показать панель"
          style={{
            position: 'fixed', left: 8, top: 8, zIndex: 55,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: '7px',
            border: `1px solid ${t.panelBorder}`,
            background: t.railBg, color: t.fgMuted, cursor: 'pointer',
            transition: 'background 0.1s',
          }}
        >
          <PanelLeft size={13} />
        </button>
      )}

      {/* Side panel */}
      {railVisible && (
        <aside
          style={{
            position: 'fixed', left: RAIL_W, top: 0,
            height: '100vh',
            width: activePanel ? panelWidth : 0,
            background: t.panelBg,
            borderRight: activePanel ? `1px solid ${t.panelBorder}` : 'none',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 49,
            overflow: 'hidden',
            pointerEvents: activePanel ? 'auto' : 'none',
            visibility: activePanel ? 'visible' : 'hidden',
            transition: 'width 0.2s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {activePanel && (
            <>
              <PanelHeader title={panelTitles[activePanel]} isDark={isDark} onClose={() => setActivePanel(null)} />
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {activePanel === 'nav' && <NavPanelContent isDark={isDark} currentDocSlug={currentDocSlug} />}
                {activePanel === 'toc' && (
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    <TocPanelContent toc={toc} activeId={activeId} isDark={isDark} />
                  </div>
                )}
                {activePanel === 'contacts' && (
                  <div style={{ overflowY: 'auto' }}>
                    <ContactsPanelContent isDark={isDark} />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Resize handle */}
          {activePanel && (
            <button
              onMouseDown={onResizeMouseDown}
              onMouseEnter={() => setHandleHov(true)}
              onMouseLeave={() => setHandleHov(false)}
              aria-label="Изменить ширину панели"
              style={{
                position: 'absolute', right: 0, top: 0, bottom: 0,
                width: '8px', cursor: 'col-resize', zIndex: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: 'none', padding: 0,
              }}
            >
              <div style={{
                width: '2px', height: '48px', borderRadius: '2px',
                background: handleHov ? t.handleHov : t.handle,
                transition: 'background 0.15s',
                pointerEvents: 'none',
              }} />
            </button>
          )}
        </aside>
      )}

      <AnimatePresence>
        {searchOpen && (
          <Suspense fallback={null}>
            <LazyUnifiedSearchPanel onClose={() => setSearchOpen(false)} />
          </Suspense>
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Mobile ───────────────────────────────────────────────────────────────────

function tocSectionLabel(count: number): string {
  if (count === 1) return 'раздел';
  if (count < 5) return 'раздела';
  return 'разделов';
}

const MobilePanel: React.FC<{
  type: 'nav' | 'toc' | 'contacts';
  onClose: () => void;
  isDark: boolean;
  currentDocSlug?: string;
  toc: TocItem[];
  activeId: string;
}> = ({ type, onClose, isDark, currentDocSlug, toc, activeId }) => {
  const t = tk(isDark);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const PANEL_TITLES: Record<string, string> = { nav: 'Навигация', toc: 'Оглавление', contacts: 'Контакты' };

  const content = (
    <div style={{
      position: 'fixed', inset: 0,
      zIndex: 62,
      background: t.panelBg,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      animation: 'mobPanelIn 0.22s cubic-bezier(0.4,0,0.2,1)',
      paddingBottom: '60px',
    }}>
      <style>{`@keyframes mobPanelIn{from{transform:translateY(6%) scale(0.97);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}`}</style>

      <div style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '52px 20px 16px',
        borderBottom: `1px solid ${t.divider}`,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: t.fg, letterSpacing: '-0.02em' }}>
            {PANEL_TITLES[type]}
          </span>
          {type === 'toc' && toc.length > 0 && (
            <span style={{ fontSize: '0.78rem', color: t.fgMuted }}>
              {toc.length} {tocSectionLabel(toc.length)}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 34, height: 34, borderRadius: '9px',
            border: `1px solid ${t.panelBorder}`,
            background: t.hov,
            color: t.fg, cursor: 'pointer', flexShrink: 0,
          }}
        >
          <X size={15} />
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {type === 'nav' && <NavPanelContent isDark={isDark} currentDocSlug={currentDocSlug} mobile />}
        {type === 'toc' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <TocPanelContent toc={toc} activeId={activeId} isDark={isDark} onItemClick={onClose} mobile />
          </div>
        )}
        {type === 'contacts' && <div style={{ overflowY: 'auto' }}><ContactsPanelContent isDark={isDark} mobile /></div>}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

const MobBtn: React.FC<{
  icon: React.ReactNode; isDark: boolean; onClick: () => void; isActive: boolean; title: string;
}> = ({ icon, isDark, onClick, isActive, title }) => {
  const t = tk(isDark);
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '3px', padding: '0', border: 'none', background: 'transparent',
        cursor: 'pointer', color: isActive ? t.railActiveInk : t.railInactiveInk,
        outline: 'none', minWidth: 0, transition: 'color 0.12s',
      }}
    >
      <span style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      <span style={{ fontSize: '9px', fontWeight: isActive ? 600 : 400, lineHeight: 1, letterSpacing: '0.01em', opacity: isActive ? 1 : 0.7 }}>{title}</span>
    </button>
  );
};

type MobileSheet = 'nav' | 'toc' | 'contacts' | null;

const MobileNav: React.FC<{
  isDark: boolean; toggleTheme: () => void; currentDocSlug?: string; toc: TocItem[]; activeId: string;
}> = ({ isDark, toggleTheme, currentDocSlug, toc, activeId }) => {
  const t = tk(isDark);
  const [sheet, setSheet] = useState<MobileSheet>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const toggle = (s: MobileSheet) => setSheet(prev => prev === s ? null : s);

  return (
    <>
      {sheet && (
        <MobilePanel
          type={sheet} onClose={() => setSheet(null)}
          isDark={isDark} currentDocSlug={currentDocSlug} toc={toc} activeId={activeId}
        />
      )}

      <nav
        aria-label="Навигация"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 60,
          height: '56px',
          background: t.mobBg,
          borderTop: `1px solid ${t.panelBorder}`,
          display: 'flex', alignItems: 'stretch',
          padding: '0 4px',
        }}
      >
        <MobBtn icon={isDark ? <Sun size={18} /> : <Moon size={18} />} isDark={isDark} onClick={toggleTheme} isActive={false} title="Тема" />
        <MobBtn icon={<Search size={18} />} isDark={isDark} onClick={() => { setSheet(null); setSearchOpen(true); }} isActive={false} title="Поиск" />
        <MobBtn icon={<FolderOpen size={18} />} isDark={isDark} onClick={() => toggle('nav')} isActive={sheet === 'nav'} title="Разделы" />

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/favicon.png" alt="hub" style={{ width: 32, height: 32, objectFit: 'contain', opacity: 0.75 }} />
        </div>

        <MobBtn icon={<List size={18} />} isDark={isDark} onClick={() => toggle('toc')} isActive={sheet === 'toc'} title="Разделы" />
        <MobBtn icon={<ArrowUp size={18} />} isDark={isDark} onClick={() => { setSheet(null); globalThis.scrollTo({ top: 0, behavior: 'smooth' }); }} isActive={false} title="Наверх" />
        <MobBtn icon={<Mail size={18} />} isDark={isDark} onClick={() => toggle('contacts')} isActive={sheet === 'contacts'} title="Контакты" />
      </nav>

      <AnimatePresence>
        {searchOpen && (
          <Suspense fallback={null}>
            <LazyUnifiedSearchPanel onClose={() => setSearchOpen(false)} />
          </Suspense>
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────

const Navigation: React.FC<NavigationProps> = ({ currentDocSlug, toc = [], activeHeadingId = '' }) => {
  const { isDark, toggleTheme } = useTheme();
  const isDesktop = useIsDesktopNav();

  if (isDesktop) {
    return <DesktopNav isDark={isDark} toggleTheme={toggleTheme} currentDocSlug={currentDocSlug} toc={toc} activeId={activeHeadingId} />;
  }
  return <MobileNav isDark={isDark} toggleTheme={toggleTheme} currentDocSlug={currentDocSlug} toc={toc} activeId={activeHeadingId} />;
};

export default Navigation;