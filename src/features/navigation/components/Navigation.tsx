/**
 * Navigation.tsx
 *
 * Desktop (>1000px): Rail 64px + slide-out panel + resize handle
 * Mobile (≤1000px):  Bottom bar centered + full-screen panels (like search)
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
  FolderOpen, List, PanelLeft, ArrowUp, ChevronLeft,
} from 'lucide-react';
import { useIsDesktopNav } from '@/shared/hooks/useBreakpoint';

const LazyUnifiedSearchPanel = lazy(() => import('./UnifiedSearchPanel'));

const RAIL_W        = 64;
const PANEL_DEFAULT = 280;
const PANEL_MIN     = 220;
const PANEL_MAX     = 500;

export interface TocItem { id: string; text: string; level: number; }
interface CategoryPathItem { slug: string; title: string; icon: string | null; }
interface Doc {
  id: string; slug: string; title: string; description: string;
  type: string; typename: string; icon?: string;
  author?: string; date?: string; updated?: string; tags?: string[];
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

// ─── Theme tokens ─────────────────────────────────────────────────────────────

const DARK_TOKENS = {
  railBg:      '#161616',
  panelBg:     '#161616',
  border:      'rgba(255,255,255,0.08)',
  fg:          'rgba(255,255,255,0.85)',
  fgMuted:     'rgba(255,255,255,0.38)',
  fgSub:       'rgba(255,255,255,0.22)',
  hov:         'rgba(255,255,255,0.05)',
  accent:      '#ffffff',
  accentSoft:  'rgba(255,255,255,0.08)',
  // ── search input — darker inset to give depth on dark bg ──
  inputBg:         '#161616',
  inputBorder:     'rgba(255,255,255,0.13)',
  inputBorderFocus:'rgba(255,255,255,0.30)',
  inputShadow:     'inset 0 1px 3px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05)',
  inputShadowFocus:'0 0 0 2px rgba(255,255,255,0.09)',
  inputClr:        'rgba(255,255,255,0.88)',
  // ── section selector button ──
  sectionBg:       '#161616',
  sectionBorder:   'rgba(255,255,255,0.12)',
  sectionShadow:   '0 1px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
  // ── section dropdown ──
  dropdownBg:      '#161616',
  dropdownBorder:  'rgba(255,255,255,0.10)',
  dropdownShadow:  '0 8px 32px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.07)',
  mobBg:       '#161616',
  panelFullBg: '#161616',
  surface:     '#161616',
  elevatedBorder:     'rgba(255,255,255,0.18)',
  elevatedShadow:     '0 8px 24px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.04)',
  elevatedShadowSoft: '0 2px 10px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.03)',
} as const;

const LIGHT_TOKENS = {
  railBg:      '#E0DFDb',
  panelBg:     '#E0DFDb',
  border:      'rgba(0,0,0,0.08)',
  fg:          'rgba(0,0,0,0.85)',
  fgMuted:     'rgba(0,0,0,0.38)',
  fgSub:       'rgba(0,0,0,0.22)',
  hov:         'rgba(0,0,0,0.04)',
  accent:      '#000000',
  accentSoft:  'rgba(0,0,0,0.07)',
  inputBg:         '#cccbc7',
  inputBorder:     'rgba(0,0,0,0.15)',
  inputBorderFocus:'rgba(0,0,0,0.30)',
  inputShadow:     'inset 0 1px 2px rgba(0,0,0,0.1)',
  inputShadowFocus:'0 0 0 2px rgba(0,0,0,0.07)',
  inputClr:        '#000',
  sectionBg:       '#cccbc7',
  sectionBorder:   'rgba(0,0,0,0.15)',
  sectionShadow:   '0 1px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.55)',
  dropdownBg:      '#dddcd8',
  dropdownBorder:  'rgba(0,0,0,0.1)',
  dropdownShadow:  '0 8px 24px rgba(0,0,0,0.14)',
  mobBg:       '#dcdbd7',
  panelFullBg: '#E0DFDb',
  surface:     '#d5d4d0',
  elevatedBorder:     'rgba(0,0,0,0.2)',
  elevatedShadow:     '0 10px 24px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.72)',
  elevatedShadowSoft: '0 3px 10px rgba(0,0,0,0.11), inset 0 1px 0 rgba(255,255,255,0.65)',
} as const;

function tk(isDark: boolean) {
  return isDark ? DARK_TOKENS : LIGHT_TOKENS;
}

// ─── LucideIcon (lazy) ───────────────────────────────────────────────────────

const iconCache = new Map<string, React.FC<{ size?: number }>>();
const LucideIcon: React.FC<{ name: string; size?: number }> = memo(({ name, size = 15 }) => {
  const [Icon, setIcon] = useState<React.FC<{ size?: number }> | null>(() => iconCache.get(name) ?? null);
  useEffect(() => {
    setIcon(() => iconCache.get(name) ?? null);
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

// ─── Tree building ────────────────────────────────────────────────────────────

function buildTree(docs: Doc[], query: string, navSlug: string): NavNode {
  const root: NavNode = { title: '', slug: '', icon: null, docs: [], children: {}, isCategory: false };
  const q = query.toLowerCase();
  const filtered = docs.filter(d => {
    if ((d.navSlug ?? '') !== navSlug) return false;
    if (!q) return true;
    return d.title.toLowerCase().includes(q) || (d.description ?? '').toLowerCase().includes(q);
  });
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

function formatMetaDate(date?: string): string | null {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── DocLink ──────────────────────────────────────────────────────────────────

const DocLink: React.FC<{
  doc: Doc; isDark: boolean; isActive: boolean; onClick?: () => void; mobile?: boolean;
  onPreviewChange?: (payload: { doc: Doc; rect: DOMRect } | null) => void;
}> = memo(({ doc, isDark, isActive, onClick, mobile, onPreviewChange }) => {
  const t = tk(isDark);
  return (
    <a href={`/${doc.slug}`} onClick={onClick}
      onMouseEnter={e => { if (!mobile) onPreviewChange?.({ doc, rect: e.currentTarget.getBoundingClientRect() }); }}
      onMouseLeave={() => { if (!mobile) onPreviewChange?.(null); }}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: mobile ? '10px 14px' : '8px 10px',
        borderRadius: '8px', fontSize: mobile ? '1rem' : '0.875rem',
        textDecoration: 'none',
        border: `1px solid ${isActive ? t.elevatedBorder : 'transparent'}`,
        color: isActive ? t.accent : t.fg, fontWeight: isActive ? 600 : 400,
        background: isActive ? t.accentSoft : 'transparent',
        boxShadow: isActive ? t.elevatedShadowSoft : 'none',
        lineHeight: 1.4,
      }}>
      {doc.icon && <span style={{ flexShrink: 0, width: 15, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.fgMuted }}><LucideIcon name={doc.icon} size={14} /></span>}
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35 }}>{doc.title}</span>
        {!!doc.description && (
          <span style={{ display: 'block', marginTop: '2px', fontSize: mobile ? '0.82rem' : '0.74rem', color: t.fgMuted, lineHeight: 1.35 }}>
            {doc.description}
          </span>
        )}
      </span>
    </a>
  );
});

// ─── CategoryNode ─────────────────────────────────────────────────────────────

const CategoryNode: React.FC<{
  node: NavNode; path: string; expandedPaths: Set<string>;
  onToggle: (p: string) => void; isDark: boolean; currentDocSlug?: string;
  onDocClick?: () => void; mobile?: boolean;
  onDocHoverChange?: (payload: { doc: Doc; rect: DOMRect } | null) => void;
}> = memo(({ node, path, expandedPaths, onToggle, isDark, currentDocSlug, onDocClick, mobile, onDocHoverChange }) => {
  const t = tk(isDark);
  const expanded = expandedPaths.has(path);
  const total    = countDocs(node);
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <button onClick={() => onToggle(path)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: mobile ? '10px 14px' : '8px 10px', borderRadius: '8px',
        fontSize: mobile ? '1rem' : '0.875rem', fontWeight: 600,
        border: `1px solid ${expanded ? t.elevatedBorder : t.border}`,
        background: expanded
          ? (isDark ? '#181818' : 'rgba(0,0,0,0.08)')
          : (isDark ? '#111113' : '#deddd9'),
        boxShadow: expanded ? t.elevatedShadowSoft : 'none',
        color: t.fg, cursor: 'pointer', textAlign: 'left',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: 15, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: t.fgMuted }}>
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
          {node.icon && <span style={{ width: 15, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: t.fgMuted }}><LucideIcon name={node.icon} size={14} /></span>}
          <span style={{ wordBreak: 'break-word', lineHeight: 1.35 }}>{node.title}</span>
        </div>
        {total > 0 && <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: '5px', background: t.accentSoft, color: t.fgMuted, flexShrink: 0 }}>{total}</span>}
      </button>
      {expanded && (
        <div style={{
          marginLeft: '0.65rem',
          paddingLeft: '0.45rem',
          marginTop: '4px',
          marginBottom: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}>
          {[...node.docs].sort((a, b) => a.title.localeCompare(b.title)).map(doc => (
            <DocLink key={doc.id} doc={doc} isDark={isDark} isActive={currentDocSlug === doc.slug} onClick={onDocClick} mobile={mobile} onPreviewChange={onDocHoverChange} />
          ))}
          {Object.entries(node.children).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => (
            <CategoryNode key={key} node={child} path={`${path}/${key}`} expandedPaths={expandedPaths} onToggle={onToggle} isDark={isDark} currentDocSlug={currentDocSlug} onDocClick={onDocClick} mobile={mobile} onDocHoverChange={onDocHoverChange} />
          ))}
        </div>
      )}
    </div>
  );
});

// ─── Nav sections hooks ───────────────────────────────────────────────────────

function useNavSections(docs: Doc[]): NavSection[] {
  return useMemo<NavSection[]>(() => {
    const map = new Map<string, NavSection>();
    map.set('', { navSlug: '', navTitle: 'Главная', navIcon: 'home' });
    for (const doc of docs) {
      const slug = doc.navSlug ?? '';
      if (slug && !map.has(slug)) map.set(slug, { navSlug: slug, navTitle: doc.navTitle ?? slug, navIcon: doc.navIcon ?? '' });
    }
    return Array.from(map.values());
  }, [docs]);
}

function useActiveNavSlug(sections: NavSection[]): [string, React.Dispatch<React.SetStateAction<string>>] {
  const [activeNavSlug, setActiveNavSlug] = useState('');
  useEffect(() => {
    if (!sections.length) return;
    const pathname = globalThis.location.pathname.replace(/^\//, '');
    const matched  = sections.filter(s => s.navSlug).find(s => pathname === s.navSlug || pathname.startsWith(s.navSlug + '/'));
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
    const parts     = slug.split('/');
    const pathParts = parts.slice(0, -1).map((_, i) => parts.slice(0, i + 1).join('/'));
    if (pathParts.length) startTransition(() => setExpandedPaths(new Set(pathParts)));
  }, [currentDocSlug, activeNavSlug]);
  return [expandedPaths, setExpandedPaths];
}

function useNavPanel(docs: Doc[], currentDocSlug: string | undefined) {
  const [query, setQuery]             = useState('');
  const [sectionOpen, setSectionOpen] = useState(false);
  const sectionRef                    = useRef<HTMLDivElement>(null);
  const sections                          = useNavSections(docs);
  const [activeNavSlug, setActiveNavSlug] = useActiveNavSlug(sections);
  const [expandedPaths, setExpandedPaths] = useExpandedPaths(currentDocSlug, activeNavSlug);

  useEffect(() => {
    if (!sectionOpen) return;
    const h = (e: MouseEvent) => { if (sectionRef.current && !sectionRef.current.contains(e.target as Node)) setSectionOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [sectionOpen]);

  const navTree       = useMemo(() => buildTree(docs, query, activeNavSlug), [docs, query, activeNavSlug]);
  const activeSection = sections.find(s => s.navSlug === activeNavSlug) ?? sections[0];

  const togglePath = useCallback((path: string) => {
    setExpandedPaths(prev => { const n = new Set(prev); if (n.has(path)) { n.delete(path); } else { n.add(path); } return n; });
  }, [setExpandedPaths]);

  const handleSectionSelect = useCallback((slug: string) => {
    storageSet('hub:activeNavSlug', slug);
    setActiveNavSlug(slug); setExpandedPaths(new Set()); setSectionOpen(false);
  }, [setActiveNavSlug, setExpandedPaths]);

  return { query, setQuery, sectionOpen, setSectionOpen, sectionRef, sections, activeNavSlug, expandedPaths, navTree, activeSection, togglePath, handleSectionSelect };
}

// ─── Desktop panel hook ───────────────────────────────────────────────────────

function useDesktopPanel() {
  const [activePanel, setActivePanel] = useState<PanelType>(() => {
    try { const s = sessionStorage.getItem('hub:activePanel'); if (s === 'nav' || s === 'toc' || s === 'contacts') return s as PanelType; } catch { /* noop */ }
    return null;
  });
  const [panelWidth, setPanelWidth] = useState<number>(() => {
    try { const w = Number(sessionStorage.getItem('hub:panelWidth')); if (w >= PANEL_MIN && w <= PANEL_MAX) return w; } catch { /* noop */ }
    return PANEL_DEFAULT;
  });
  useEffect(() => { try { sessionStorage.setItem('hub:activePanel', activePanel ?? ''); } catch { /* noop */ } }, [activePanel]);
  useEffect(() => { try { sessionStorage.setItem('hub:panelWidth', String(panelWidth)); } catch { /* noop */ } }, [panelWidth]);
  const togglePanel = useCallback((panel: PanelType) => {
    setActivePanel(prev => { const next = prev === panel ? null : panel; try { sessionStorage.setItem('hub:activePanel', next ?? ''); } catch { /* noop */ } return next; });
  }, []);
  return { activePanel, setActivePanel, panelWidth, setPanelWidth, togglePanel };
}

function usePanelResize(panelWidth: number, setPanelWidth: (w: number) => void) {
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartW = useRef(0);
  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); isDragging.current = true; dragStartX.current = e.clientX; dragStartW.current = panelWidth;
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none';
    const onMove = (ev: MouseEvent) => { if (!isDragging.current) return; setPanelWidth(Math.max(PANEL_MIN, Math.min(PANEL_MAX, dragStartW.current + ev.clientX - dragStartX.current))); };
    const onUp   = () => { isDragging.current = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; globalThis.removeEventListener('mousemove', onMove); globalThis.removeEventListener('mouseup', onUp); };
    globalThis.addEventListener('mousemove', onMove); globalThis.addEventListener('mouseup', onUp);
  }, [panelWidth, setPanelWidth]);
  return { onResizeMouseDown };
}

// ─── SectionDropdown ──────────────────────────────────────────────────────────

const SectionDropdown: React.FC<{
  sections: NavSection[]; activeNavSlug: string; mobile: boolean; isDark: boolean; onSelect: (slug: string) => void;
}> = ({ sections, activeNavSlug, mobile, isDark, onSelect }) => {
  const t = tk(isDark);
  return (
    <>
      {sections.map(s => {
        const isActive = s.navSlug === activeNavSlug;
        return (
          <button key={s.navSlug} onClick={() => onSelect(s.navSlug)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: mobile ? '0.7rem 1rem' : '0.55rem 0.75rem',
              fontSize: mobile ? '1rem' : '0.875rem',
              border: `1px solid ${isActive ? t.elevatedBorder : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
              borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
              background: isActive
                ? (isDark ? 'rgba(255,255,255,0.12)' : t.accentSoft)
                : (isDark ? 'rgba(255,255,255,0.04)' : 'transparent'),
              color:      isActive ? t.accent : t.fg,
              fontWeight: isActive ? 600 : 400,
              minHeight: mobile ? '46px' : '40px',
              gridColumn: (sections.length % 2 === 1 && sections[sections.length - 1]?.navSlug === s.navSlug) ? '1 / -1' : undefined,
            }}>
            {s.navSlug === ''
              ? <Home size={mobile ? 15 : 13} style={{ color: t.fgMuted }} />
              : <span style={{ color: isActive ? t.accent : t.fgMuted, display: 'flex', alignItems: 'center' }}>
                  {s.navIcon ? <LucideIcon name={s.navIcon} size={mobile ? 15 : 13} /> : <FolderOpen size={mobile ? 15 : 13} />}
                </span>}
            <span>{s.navTitle}</span>
          </button>
        );
      })}
    </>
  );
};

// ─── NavTreeContent ───────────────────────────────────────────────────────────

const NavTreeContent: React.FC<{
  error: boolean; loading: boolean; navTree: NavNode;
  currentDocSlug: string | undefined; expandedPaths: Set<string>;
  onToggle: (p: string) => void; isDark: boolean; mobile: boolean | undefined;
  onDocHoverChange?: (payload: { doc: Doc; rect: DOMRect } | null) => void;
}> = ({ error, loading, navTree, currentDocSlug, expandedPaths, onToggle, isDark, mobile, onDocHoverChange }) => {
  const t = tk(isDark);
  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '2rem', textAlign: 'center' }}>
      <AlertTriangle size={22} style={{ color: 'rgba(251,191,36,0.7)' }} />
      <p style={{ margin: 0, fontSize: mobile ? '0.95rem' : '0.8rem', color: t.fgMuted }}>Не удалось загрузить документы</p>
      <button onClick={() => globalThis.location.reload()} style={{ padding: '0.35rem 0.85rem', borderRadius: '7px', border: `1px solid ${t.border}`, background: 'transparent', color: t.fgMuted, fontSize: mobile ? '0.9rem' : '0.75rem', cursor: 'pointer' }}>Обновить</button>
    </div>
  );
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', fontSize: mobile ? '0.95rem' : '0.8rem', color: t.fgMuted }}>Загрузка...</div>;
  return (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      {navTree.docs.length > 0 && (
        <div style={{ marginBottom: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {[...navTree.docs].sort((a, b) => a.title.localeCompare(b.title)).map(doc => (
            <DocLink key={doc.id} doc={doc} isDark={isDark} isActive={currentDocSlug === doc.slug} mobile={mobile} onPreviewChange={onDocHoverChange} />
          ))}
        </div>
      )}
      {Object.entries(navTree.children).sort(([a], [b]) => a.localeCompare(b)).map(([key, node]) => (
        <CategoryNode key={key} node={node} path={key} expandedPaths={expandedPaths} onToggle={onToggle} isDark={isDark} currentDocSlug={currentDocSlug} mobile={mobile} onDocHoverChange={onDocHoverChange} />
      ))}
    </nav>
  );
};

// ─── DocHoverPreview ──────────────────────────────────────────────────────────

const DocHoverPreview: React.FC<{ isDark: boolean; payload: { doc: Doc; rect: DOMRect } }> = ({ isDark, payload }) => {
  const t = tk(isDark);
  const { doc, rect } = payload;
  const top  = Math.max(12, Math.min(window.innerHeight - 260, rect.top));
  const left = Math.min(window.innerWidth - 360, rect.right + 12);
  const created = formatMetaDate(doc.date);
  const updated = formatMetaDate(doc.updated);
  return createPortal(
    <div style={{
      position: 'fixed', top, left, width: 340, zIndex: 120, pointerEvents: 'none',
      borderRadius: '12px', border: `1px solid ${t.elevatedBorder}`,
      background: isDark ? '#121212' : '#ECEBE7', boxShadow: t.elevatedShadow, padding: '10px 12px', color: t.fg,
    }}>
      <div style={{ fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.3 }}>{doc.title}</div>
      {doc.description && <div style={{ marginTop: 4, fontSize: '0.8rem', color: t.fgMuted, lineHeight: 1.35 }}>{doc.description}</div>}
      <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px', fontSize: '0.74rem', color: t.fgMuted }}>
        {doc.author   && <span><b style={{ color: t.fg }}>Автор:</b> {doc.author}</span>}
        {doc.typename && <span><b style={{ color: t.fg }}>Тип:</b> {doc.typename}</span>}
        {created      && <span><b style={{ color: t.fg }}>Создана:</b> {created}</span>}
        {updated      && <span><b style={{ color: t.fg }}>Обновлена:</b> {updated}</span>}
      </div>
      {doc.tags && doc.tags.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {doc.tags.slice(0, 8).map(tag => (
            <span key={tag} style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: '999px', background: t.accentSoft, color: t.fgMuted }}>#{tag}</span>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
};

// ─── NavPanelContent ──────────────────────────────────────────────────────────

const NavPanelContent: React.FC<{
  isDark: boolean; currentDocSlug?: string; mobile?: boolean;
}> = ({ isDark, currentDocSlug, mobile }) => {
  const t = tk(isDark);
  const { manifest: docs, loading, error } = useManifest();
  const { query, setQuery, sectionOpen, setSectionOpen, sectionRef, sections, activeNavSlug, expandedPaths, navTree, activeSection, togglePath, handleSectionSelect } = useNavPanel(docs as Doc[], currentDocSlug);

  const inputFontSize = mobile ? '1rem' : '0.855rem';
  const inputPadding  = mobile ? '0.6rem 0.6rem 0.6rem 2.4rem' : '0.45rem 0.5rem 0.45rem 2.1rem';
  const iconSize      = mobile ? 15 : 13;
  const [hoverPreview, setHoverPreview] = useState<{ doc: Doc; rect: DOMRect } | null>(null);
  const [focused, setFocused]           = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Search input */}
      <div style={{ flexShrink: 0, padding: mobile ? '12px 14px' : '10px', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ position: 'relative' }}>
          <Search size={iconSize} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: t.fgSub, pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Фильтр по названию..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              width: '100%',
              padding: inputPadding,
              borderRadius: '8px',
              fontSize: inputFontSize,
              border: `1px solid ${focused ? t.inputBorderFocus : t.inputBorder}`,
              background: t.inputBg,
              color: t.inputClr,
              boxShadow: focused ? t.inputShadowFocus : t.inputShadow,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Section selector */}
      {sections.length > 1 && activeSection && (
        <div style={{ flexShrink: 0, padding: mobile ? '10px 14px' : '8px 10px', borderBottom: `1px solid ${t.border}`, position: 'relative' }} ref={sectionRef}>
          <button
            onClick={() => setSectionOpen(v => !v)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: mobile ? '0.55rem 0.85rem' : '0.4rem 0.65rem',
              borderRadius: '8px', fontSize: mobile ? '1rem' : '0.875rem',
              border: `1px solid ${sectionOpen ? (isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)') : t.sectionBorder}`,
              background: t.sectionBg,
              color: t.fg,
              cursor: 'pointer',
              boxShadow: t.sectionShadow,
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
              {activeSection.navSlug === ''
                ? <Home size={iconSize} style={{ color: t.fgMuted, flexShrink: 0 }} />
                : <LucideIcon name={activeSection.navIcon} size={iconSize} />}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeSection.navTitle}</span>
            </div>
            <ChevronDown size={mobile ? 14 : 12} style={{ color: t.fgMuted, flexShrink: 0, transform: sectionOpen ? 'rotate(180deg)' : 'none' }} />
          </button>

          {sectionOpen && (
            <div style={{
              position: 'absolute',
              left: mobile ? '14px' : '10px',
              right: mobile ? '14px' : '10px',
              top: 'calc(100% - 2px)',
              borderRadius: '10px',
              border: `1px solid ${t.dropdownBorder}`,
              background: t.dropdownBg,
              zIndex: 100, overflow: 'hidden',
              boxShadow: t.dropdownShadow,
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', padding: '8px' }}>
                <SectionDropdown sections={sections} activeNavSlug={activeNavSlug} mobile={!!mobile} isDark={isDark} onSelect={handleSectionSelect} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tree */}
      <div style={{ flex: 1, overflowY: 'auto', padding: mobile ? '8px 6px' : '6px' }}>
        <NavTreeContent
          error={!!error} loading={loading} navTree={navTree}
          currentDocSlug={currentDocSlug} expandedPaths={expandedPaths}
          onToggle={togglePath} isDark={isDark} mobile={mobile}
          onDocHoverChange={setHoverPreview}
        />
      </div>
      {!mobile && hoverPreview && <DocHoverPreview isDark={isDark} payload={hoverPreview} />}
    </div>
  );
};

// ─── ToC helpers ─────────────────────────────────────────────────────────────

function tocBorderColor(isActive: boolean, glowOp: number, isDark: boolean, accent: string): string {
  if (isActive)   return accent;
  if (glowOp > 0) return isDark ? `rgba(255,255,255,${glowOp})` : `rgba(0,0,0,${glowOp})`;
  return 'transparent';
}
function tocShadow(isActive: boolean, glowOp: number, isDark: boolean, accent: string): string {
  if (isActive)   return `inset 3px 0 10px -2px ${accent}88`;
  if (glowOp > 0) return isDark ? `inset 3px 0 8px -3px rgba(255,255,255,${glowOp * 0.35})` : `inset 3px 0 8px -3px rgba(0,0,0,${glowOp * 0.35})`;
  return 'none';
}
function tocColor(isActive: boolean, opacity: number, isDark: boolean, accent: string): string {
  if (isActive) return accent;
  return isDark ? `rgba(255,255,255,${opacity})` : `rgba(0,0,0,${opacity})`;
}
function getTocItemStyle(item: TocItem, dist: number, activeId: string, isDark: boolean, mobile: boolean) {
  const t        = tk(isDark);
  const isActive = item.id === activeId && activeId !== '';
  const hasActive = activeId !== '';
  let opacity: number; let glowOp: number;
  if (!hasActive)    { opacity = 0.65; glowOp = 0; }
  else if (isActive) { opacity = 1;    glowOp = 1; }
  else { opacity = Math.max(0.32, 0.82 - dist * 0.18); glowOp = Math.max(0, 0.5 - dist * 0.16); }
  // Increased base font size: 0.92rem (was 0.82rem)
  const baseFontSize = mobile ? 1.05 : 0.92;
  const fontSizeStep = mobile ? 0.05 : 0.04;
  const fontSize     = `${baseFontSize - (item.level - 2) * fontSizeStep}rem`;
  const paddingLeft  = mobile ? 14 + (item.level - 2) * 18 : 12 + (item.level - 2) * 14;
  return {
    isActive,
    borderClr: tocBorderColor(isActive, glowOp, isDark, t.accent),
    shadow:    tocShadow(isActive, glowOp, isDark, t.accent),
    fontSize, paddingLeft,
    color: tocColor(isActive, opacity, isDark, t.accent),
  };
}

// ─── TocPanelContent ──────────────────────────────────────────────────────────

const TocPanelContent: React.FC<{
  toc: TocItem[]; activeId: string; isDark: boolean; onItemClick?: () => void; mobile?: boolean;
}> = ({ toc, activeId, isDark, onItemClick, mobile = false }) => {
  const t = tk(isDark);
  if (!toc.length) return (
    <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', fontSize: mobile ? '1rem' : '0.875rem', color: t.fgMuted }}>
      На этой странице нет заголовков
    </div>
  );
  const activeIndex = toc.findIndex(i => i.id === activeId);
  return (
    <nav style={{ padding: mobile ? '8px 6px' : '6px 4px' }}>
      {toc.map((item, index) => {
        const dist  = Math.abs(index - activeIndex);
        const style = getTocItemStyle(item, dist, activeId, isDark, mobile);
        const bg    = !style.isActive ? 'transparent' : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)');
        const fw    = style.isActive ? 600 : (item.level === 2 ? 500 : 400);
        return (
          <button key={item.id}
            onClick={() => { scrollToElement(item.id); onItemClick?.(); }}
            style={{
              width: '100%', textAlign: 'left',
              paddingTop:    mobile ? '0.55rem' : '0.42rem',
              paddingBottom: mobile ? '0.55rem' : '0.42rem',
              paddingRight:  mobile ? '1rem'    : '0.75rem',
              paddingLeft:   `${style.paddingLeft}px`,
              fontSize:      style.fontSize, lineHeight: 1.45,
              background: bg, border: 'none', cursor: 'pointer',
              borderLeft: '2px solid', borderLeftColor: style.borderClr,
              boxShadow:  style.shadow,
              borderRadius: '0 8px 8px 0',
              color:    style.color, fontWeight: fw,
              textShadow: style.isActive ? `0 0 12px ${t.accent}55` : 'none',
            }}
          >{item.text}</button>
        );
      })}
    </nav>
  );
};

// ─── ContactsPanelContent ─────────────────────────────────────────────────────

const ContactsPanelContent: React.FC<{ isDark: boolean; mobile?: boolean }> = ({ isDark, mobile }) => {
  const t = tk(isDark);
  return (
    <div style={{ padding: '8px' }}>
      {CONTACTS.map(c => (
        <a key={c.href} href={c.href} target={c.external ? '_blank' : undefined} rel={c.external ? 'noopener noreferrer' : undefined}
          style={{ display: 'flex', flexDirection: 'column', padding: mobile ? '14px 16px' : '10px', borderRadius: '10px', textDecoration: 'none', color: t.fg, fontSize: mobile ? '1rem' : '0.875rem', gap: '3px' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = t.hov; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
          <div style={{ fontWeight: 600 }}>{c.title}</div>
          <div style={{ fontSize: mobile ? '0.875rem' : '0.75rem', color: t.fgMuted }}>{c.subtitle}</div>
        </a>
      ))}
    </div>
  );
};

// ─── PanelHeader ─────────────────────────────────────────────────────────────

const PanelHeader: React.FC<{ title: string; isDark: boolean; onClose: () => void }> = ({ title, isDark, onClose }) => {
  const t = tk(isDark);
  return (
    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 12px 9px', borderBottom: `1px solid ${t.border}` }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.fgMuted }}>{title}</span>
      <button onClick={onClose}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '6px', border: 'none', background: 'transparent', color: t.fgMuted, cursor: 'pointer' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = t.fg; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = t.fgMuted; }}>
        <X size={13} />
      </button>
    </div>
  );
};

// ─── RailBtn ─────────────────────────────────────────────────────────────────

const RailBtn: React.FC<{
  icon: React.ReactNode; label: string; isActive?: boolean; isDark: boolean; onClick: () => void; title?: string;
}> = ({ icon, label, isActive, isDark, onClick, title }) => {
  const t = tk(isDark);
  const [hov, setHov] = useState(false);
  const btnColor = isActive ? t.accent : (hov ? t.fg : t.fgMuted);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: RAIL_W - 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '10px 4px', border: '1px solid transparent', background: 'transparent', color: btnColor, cursor: 'pointer', borderRadius: '12px', flexShrink: 0 }}>
      <span style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      <span style={{ fontSize: label === 'Оглавление' ? '11px' : '10px', fontWeight: 500, lineHeight: 1.1, letterSpacing: '0.01em', textAlign: 'center' }}>{label}</span>
    </button>
  );
};

// ─── PanelResizeToggle ────────────────────────────────────────────────────────

const PanelResizeToggle: React.FC<{
  isDark: boolean; panelOpen: boolean; panelWidth: number; onToggle: () => void; onResizeMouseDown: (e: React.MouseEvent) => void;
}> = ({ isDark, panelOpen, panelWidth, onToggle, onResizeMouseDown }) => {
  const t = tk(isDark);
  const [hov, setHov] = useState(false);
  const handleMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX; let didDrag = false;
    const onMove = (ev: MouseEvent) => { if (didDrag) return; if (Math.abs(ev.clientX - startX) > 4) { didDrag = true; onResizeMouseDown(e); } };
    const onUp   = () => { if (!didDrag) onToggle(); globalThis.removeEventListener('mousemove', onMove); globalThis.removeEventListener('mouseup', onUp); };
    globalThis.addEventListener('mousemove', onMove); globalThis.addEventListener('mouseup', onUp); e.preventDefault();
  };
  const x = RAIL_W + (panelOpen ? panelWidth : 0);
  return (
    <div style={{ position: 'fixed', left: x - 1, top: '50%', transform: 'translateY(-50%)', zIndex: 51 }}>
      <button onMouseDown={handleMouseDown} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        title={panelOpen ? 'Свернуть / ресайз' : 'Развернуть'}
        style={{
          width: 18, height: 52, borderRadius: '0 12px 12px 0', borderLeft: 'none',
          border: `1px solid ${hov ? (isDark ? 'rgba(255,255,255,0.26)' : 'rgba(0,0,0,0.2)') : t.border}`,
          background: hov ? (isDark ? '#1c1c1c' : '#cfcec9') : (isDark ? '#141414' : '#dbdad6'),
          color: hov ? t.fg : t.fgMuted, cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: hov ? t.elevatedShadowSoft : 'none',
        }}>
        {panelOpen ? <ChevronLeft size={11} strokeWidth={2.5} /> : <ChevronRight size={11} strokeWidth={2.5} />}
      </button>
    </div>
  );
};

// ─── DesktopNav ───────────────────────────────────────────────────────────────

const DesktopNav: React.FC<{
  isDark: boolean; toggleTheme: () => void; currentDocSlug?: string; toc: TocItem[]; activeId: string;
}> = ({ isDark, toggleTheme, currentDocSlug, toc, activeId }) => {
  const t = tk(isDark);
  const [railVisible, setRailVisible] = useState(true);
  const [searchOpen, setSearchOpen]   = useState(false);
  const { activePanel, setActivePanel, panelWidth, setPanelWidth, togglePanel } = useDesktopPanel();
  const { onResizeMouseDown } = usePanelResize(panelWidth, setPanelWidth);

  useEffect(() => {
    try {
      const panel = sessionStorage.getItem('hub:activePanel');
      const hasPanel = panel === 'nav' || panel === 'toc' || panel === 'contacts';
      const w = Number(sessionStorage.getItem('hub:panelWidth'));
      const pw = (w >= PANEL_MIN && w <= PANEL_MAX) ? w : PANEL_DEFAULT;
      document.documentElement.style.setProperty('--nav-left', `${RAIL_W + (hasPanel ? pw : 0)}px`);
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    const left = railVisible ? (RAIL_W + (activePanel ? panelWidth : 0)) : 0;
    document.documentElement.style.setProperty('--nav-left', `${left}px`);
    return () => { document.documentElement.style.removeProperty('--nav-left'); };
  }, [railVisible, activePanel, panelWidth]);

  const panelTitles: Record<Exclude<PanelType, null>, string> = { nav: 'Навигация', toc: 'Оглавление', contacts: 'Контакты' };

  return (
    <>
      {railVisible && (
        <aside style={{ position: 'fixed', left: 0, top: 0, height: '100vh', width: RAIL_W, background: t.railBg, borderRight: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 50, padding: '8px 0', gap: '2px' }}>
          <div style={{ width: RAIL_W, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src="/favicon.png" alt="hub" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1, width: '100%', padding: '2px 0' }}>
            <RailBtn icon={<PanelLeft size={18} />}                         label="Панель"     isDark={isDark} onClick={() => setRailVisible(false)}                                              title="Скрыть" />
            <RailBtn icon={isDark ? <Sun size={18} /> : <Moon size={18} />} label="Тема"       isDark={isDark} onClick={toggleTheme}                                                              title={isDark ? 'Светлая' : 'Тёмная'} />
            <RailBtn icon={<Search size={18} />}                            label="Поиск"      isDark={isDark} onClick={() => setSearchOpen(true)}                                                title="Поиск" />
            <RailBtn icon={<FolderOpen size={18} />}                        label="Разделы"    isDark={isDark} isActive={activePanel === 'nav'}      onClick={() => togglePanel('nav')}      title="Разделы" />
            <RailBtn icon={<List size={18} />}                              label="Оглавление" isDark={isDark} isActive={activePanel === 'toc'}      onClick={() => togglePanel('toc')}      title="Оглавление" />
            <RailBtn icon={<ArrowUp size={18} />}                           label="Наверх"     isDark={isDark} onClick={() => globalThis.scrollTo({ top: 0, behavior: 'smooth' })}               title="Наверх" />
            <RailBtn icon={<Mail size={18} />}                              label="Контакты"   isDark={isDark} isActive={activePanel === 'contacts'} onClick={() => togglePanel('contacts')} title="Контакты" />
          </div>
        </aside>
      )}

      {!railVisible && (
        <button onClick={() => setRailVisible(true)}
          style={{ position: 'fixed', left: 8, top: 8, zIndex: 55, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: '8px', border: `1px solid ${t.border}`, background: t.railBg, color: t.fgMuted, cursor: 'pointer' }}
          title="Показать">
          <PanelLeft size={14} />
        </button>
      )}

      {railVisible && (
        <aside style={{
          position: 'fixed', left: RAIL_W, top: 0, height: '100vh',
          width: activePanel ? panelWidth : 0,
          background: t.panelBg, borderRight: activePanel ? `1px solid ${t.border}` : 'none',
          display: 'flex', flexDirection: 'column', zIndex: 49, overflow: 'hidden',
          pointerEvents: activePanel ? 'auto' : 'none', visibility: activePanel ? 'visible' : 'hidden',
        }}>
          {activePanel && (
            <>
              <PanelHeader title={panelTitles[activePanel]} isDark={isDark} onClose={() => setActivePanel(null)} />
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {activePanel === 'nav'      && <NavPanelContent isDark={isDark} currentDocSlug={currentDocSlug} />}
                {activePanel === 'toc'      && <div style={{ flex: 1, overflowY: 'auto' }}><TocPanelContent toc={toc} activeId={activeId} isDark={isDark} /></div>}
                {activePanel === 'contacts' && <div style={{ overflowY: 'auto' }}><ContactsPanelContent isDark={isDark} /></div>}
              </div>
            </>
          )}
          {activePanel && (
            <button onMouseDown={onResizeMouseDown} aria-label="Изменить ширину панели"
              style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '8px', cursor: 'col-resize', zIndex: 10, background: 'transparent', border: 'none', padding: 0 }} />
          )}
        </aside>
      )}

      {railVisible && (
        <PanelResizeToggle isDark={isDark} panelOpen={!!activePanel} panelWidth={panelWidth} onResizeMouseDown={onResizeMouseDown}
          onToggle={() => { if (activePanel) setActivePanel(null); else togglePanel('nav'); }} />
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

// ─── Mobile panel ─────────────────────────────────────────────────────────────

function tocSectionLabel(count: number): string {
  if (count === 1) return 'раздел'; if (count < 5) return 'раздела'; return 'разделов';
}

const MobilePanel: React.FC<{
  type: 'nav' | 'toc' | 'contacts'; onClose: () => void; isDark: boolean;
  currentDocSlug?: string; toc: TocItem[]; activeId: string;
}> = ({ type, onClose, isDark, currentDocSlug, toc, activeId }) => {
  const t = tk(isDark);
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const PANEL_TITLES: Record<string, string> = { nav: 'Навигация', toc: 'Оглавление', contacts: 'Контакты' };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 62, background: t.panelFullBg, display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'mobPanelIn 0.22s cubic-bezier(0.4,0,0.2,1)', paddingBottom: '60px' }}>
      <style>{`@keyframes mobPanelIn{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '52px 20px 16px', borderBottom: `1px solid ${t.border}`, background: t.panelFullBg }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: t.fg, letterSpacing: '-0.01em' }}>{PANEL_TITLES[type]}</span>
          {type === 'toc' && toc.length > 0 && <span style={{ fontSize: '0.8rem', color: t.fgMuted }}>{toc.length} {tocSectionLabel(toc.length)}</span>}
        </div>
        <button onClick={onClose}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '10px', border: `1px solid ${t.border}`, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', color: t.fg, cursor: 'pointer', flexShrink: 0 }}>
          <X size={16} />
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {type === 'nav'      && <NavPanelContent isDark={isDark} currentDocSlug={currentDocSlug} mobile />}
        {type === 'toc'      && <div style={{ flex: 1, overflowY: 'auto' }}><TocPanelContent toc={toc} activeId={activeId} isDark={isDark} onItemClick={onClose} mobile /></div>}
        {type === 'contacts' && <div style={{ overflowY: 'auto' }}><ContactsPanelContent isDark={isDark} mobile /></div>}
      </div>
    </div>,
    document.body,
  );
};

// ─── MobBtn ───────────────────────────────────────────────────────────────────

const MobBtn: React.FC<{
  label: string; icon: React.ReactNode; isDark: boolean; onClick: () => void; isActive: boolean;
}> = ({ label, icon, isDark, onClick, isActive }) => {
  const t = tk(isDark);
  return (
    <button onClick={onClick}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '0', border: 'none', background: 'transparent', cursor: 'pointer', color: isActive ? t.accent : t.fgMuted, outline: 'none', minWidth: 0 }}>
      <span style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      <span style={{ fontSize: '10px', fontWeight: 400, lineHeight: 1, marginTop: '1px' }}>{label}</span>
    </button>
  );
};

// ─── MobileNav ────────────────────────────────────────────────────────────────

type MobileSheet = 'nav' | 'toc' | 'contacts' | null;

const MobileNav: React.FC<{
  isDark: boolean; toggleTheme: () => void; currentDocSlug?: string; toc: TocItem[]; activeId: string;
}> = ({ isDark, toggleTheme, currentDocSlug, toc, activeId }) => {
  const t = tk(isDark);
  const [sheet, setSheet]           = useState<MobileSheet>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const toggle = (s: MobileSheet) => setSheet(prev => prev === s ? null : s);

  return (
    <>
      {sheet && <MobilePanel type={sheet} onClose={() => setSheet(null)} isDark={isDark} currentDocSlug={currentDocSlug} toc={toc} activeId={activeId} />}

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 60, height: '60px', background: t.mobBg, borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'stretch' }}>
        <MobBtn label="Тема"       icon={isDark ? <Sun size={22} /> : <Moon size={22} />} isDark={isDark} onClick={toggleTheme}                                                      isActive={false} />
        <MobBtn label="Поиск"      icon={<Search size={22} />}                            isDark={isDark} onClick={() => { setSheet(null); setSearchOpen(true); }}                   isActive={false} />
        <MobBtn label="Разделы"    icon={<FolderOpen size={22} />}                        isDark={isDark} onClick={() => toggle('nav')}                                              isActive={sheet === 'nav'} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/favicon.png" alt="hub" style={{ width: 38, height: 38, objectFit: 'contain' }} />
        </div>
        <MobBtn label="Оглавление" icon={<List size={22} />}                              isDark={isDark} onClick={() => toggle('toc')}                                              isActive={sheet === 'toc'} />
        <MobBtn label="Наверх"     icon={<ArrowUp size={22} />}                           isDark={isDark} onClick={() => { setSheet(null); globalThis.scrollTo({ top: 0, behavior: 'smooth' }); }} isActive={false} />
        <MobBtn label="Контакты"   icon={<Mail size={22} />}                              isDark={isDark} onClick={() => toggle('contacts')}                                         isActive={sheet === 'contacts'} />
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

// ─── Navigation (main export) ─────────────────────────────────────────────────

const Navigation: React.FC<NavigationProps> = ({ currentDocSlug, toc = [], activeHeadingId = '' }) => {
  const { isDark, toggleTheme } = useTheme();
  const isDesktop = useIsDesktopNav();
  if (isDesktop) return <DesktopNav isDark={isDark} toggleTheme={toggleTheme} currentDocSlug={currentDocSlug} toc={toc} activeId={activeHeadingId} />;
  return <MobileNav isDark={isDark} toggleTheme={toggleTheme} currentDocSlug={currentDocSlug} toc={toc} activeId={activeHeadingId} />;
};

export default Navigation;