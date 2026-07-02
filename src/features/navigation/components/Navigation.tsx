import React, {
  useState, useEffect, useRef, useMemo, useCallback,
  lazy, Suspense, memo, startTransition,
} from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/shared/contexts/useTheme';
import { useManifest } from '@/features/docs/hooks/useDocuments';
import { storageSet } from '@/shared/lib/storage';
import { CONTACTS } from '@/shared/data/contacts';
import { scrollToElement } from '@/features/docs/utils/scrollUtils';
import { AnimatePresence, motion, useSpring, useTransform } from 'framer-motion';
import {
  Search, Sun, Moon, ChevronDown, ChevronRight,
  Mail, X, Home, AlertTriangle,
  FolderOpen, List, PanelLeft, ArrowUp,
  Crown, BookOpenText, PanelRight,
} from 'lucide-react';
import { useIsDesktopNav } from '@/shared/hooks/useBreakpoint';
import { makeTokens } from '@/shared/tokens/theme';

const LazyUnifiedSearchPanel = lazy(() => import('./UnifiedSearchPanel'));

const RAIL_W          = 64;
const PANEL_DEFAULT   = 240;
const PANEL_MIN       = 200;
const PANEL_MAX       = 500;
const TOC_PANEL_W     = 240;
const TOC_PANEL_MIN   = 200;
const TOC_PANEL_MAX   = 480;
const DOC_CHROME_GAP      = 10;
const DOC_CHROME_TOP_GAP  = 14;
const DOC_CHROME_RADIUS   = 18;

const NAV_SCROLL_KEY = 'hub:navScrollTop';

export interface TocItem { id: string; text: string; level: number; }
interface CategoryPathItem { slug: string; title: string; icon: string | null; }
interface Doc {
  id: string; slug: string; title: string; description: string;
  type: string; typename: string; icon?: string;
  author?: string; date?: string; updated?: string; tags?: string[];
  navSlug?: string; navTitle?: string; navIcon?: string;
  categoryPath?: CategoryPathItem[];
  priority?: number;
  custom?: string;
}
interface NavNode { title: string; slug: string; icon: string | null; docs: Doc[]; children: Record<string, NavNode>; isCategory: boolean; }
interface NavSection { navSlug: string; navTitle: string; navIcon: string; }
export type PanelType = 'nav' | 'toc' | 'contacts' | null;
type ReadingMode = 'standard' | 'extended';

interface NavigationProps {
  currentDocSlug?: string;
  toc?: TocItem[];
  activeHeadingId?: string;
  floatingChrome?: boolean;
}

interface SiteLogoConfig {
  lightLogo?: string;
  darkLogo?: string;
}

function getThemeLogoPath(config: SiteLogoConfig, isDark: boolean): string {
  return isDark ? (config.darkLogo || config.lightLogo || '') : (config.lightLogo || config.darkLogo || '');
}

function toDocHref(slug?: string): string {
  if (!slug) return '/';
  return `/${slug}/`;
}

function toCategoryHref(activeNavSlug: string, path: string): string {
  const slug = [activeNavSlug, path].filter(Boolean).join('/');
  return toDocHref(slug);
}

function isDocActive(doc: Doc, currentDocSlug: string | undefined): boolean {
  if (globalThis.window !== undefined) {
    const pathname = globalThis.window.location.pathname.replace(/^\/|\/$/g, '');
    if (doc.slug && doc.slug === pathname) return true;
  }
  if (!currentDocSlug) return false;
  if (doc.slug === currentDocSlug) return true;
  if (doc.custom && doc.custom === currentDocSlug) return true;
  return false;
}

function isHomeDocActive(currentDocSlug: string | undefined): boolean {
  if (currentDocSlug !== undefined) return currentDocSlug === '';
  if (globalThis.window !== undefined) {
    return globalThis.window.location.pathname.replace(/^\/|\/$/g, '') === '';
  }
  return false;
}

const THEME_DARK = {
  fg:               'rgba(255,255,255,0.85)',
  fgMuted:          'rgba(255,255,255,0.55)',
  fgSub:            'rgba(255,255,255,0.38)',
  hov:              'rgba(255,255,255,0.05)',
  inputBorder:      'rgba(255,255,255,0.13)',
  inputBorderFocus: 'rgba(255,255,255,0.30)',
  inputShadow:      'inset 0 1px 3px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05)',
  inputShadowFocus: '0 0 0 2px rgba(255,255,255,0.09)',
  sectionBorder:    'rgba(255,255,255,0.12)',
  sectionShadow:    '0 1px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
  dropdownBg:       '#0F0F0F',
  dropdownBorder:   'rgba(255,255,255,0.10)',
  dropdownShadow:   '0 8px 32px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.07)',
  mobBg:            '#0F0F0F',
  panelFullBg:      '#0F0F0F',
  surface:          '#0F0F0F',
  placeholderClr:   'rgba(255,255,255,0.35)',
} as const;

const THEME_LIGHT = {
  fg:               'rgba(0,0,0,0.85)',
  fgMuted:          'rgba(0,0,0,0.55)',
  fgSub:            'rgba(0,0,0,0.38)',
  hov:              'rgba(0,0,0,0.04)',
  inputBorder:      'rgba(0,0,0,0.15)',
  inputBorderFocus: 'rgba(0,0,0,0.30)',
  inputShadow:      'inset 0 1px 2px rgba(0,0,0,0.1)',
  inputShadowFocus: '0 0 0 2px rgba(0,0,0,0.07)',
  sectionBorder:    'rgba(0,0,0,0.15)',
  sectionShadow:    '0 1px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.55)',
  dropdownBg:       '#dddcd8',
  dropdownBorder:   'rgba(0,0,0,0.1)',
  dropdownShadow:   '0 8px 24px rgba(0,0,0,0.14)',
  mobBg:            '#dcdbd7',
  panelFullBg:      '#E0DFDb',
  surface:          '#d5d4d0',
  placeholderClr:   'rgba(0,0,0,0.45)',
} as const;

function tk(isDark: boolean) {
  const t    = makeTokens(isDark);
  const mode = isDark ? THEME_DARK : THEME_LIGHT;
  return {
    railBg:             t.bg,
    panelBg:            t.bg,
    border:             t.border,
    accent:             t.accent,
    accentSoft:         t.accentSoft,
    inputBg:            t.bg,
    inputClr:           t.inpClr,
    sectionBg:          t.bg,
    elevatedBorder:     t.borderElevated,
    elevatedShadow:     t.shadowElevated,
    elevatedShadowSoft: t.shadowSoft,
    ...mode,
  } as const;
}

function getSectionOpenBorder(sectionOpen: boolean, isDark: boolean): string {
  if (!sectionOpen) return tk(isDark).sectionBorder;
  return isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)';
}

function getUnifiedControlStyle(isDark: boolean, isActive: boolean = false) {
  const t = tk(isDark);
  return {
    border: `1px solid ${isActive ? getSectionOpenBorder(true, isDark) : t.sectionBorder}`,
    background: t.sectionBg,
    boxShadow: t.sectionShadow,
    borderRadius: '8px',
  };
}

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

function sortDocs(docs: Doc[]): Doc[] {
  return [...docs].sort((a, b) => {
    const pa = a.priority ?? 999;
    const pb = b.priority ?? 999;
    if (pa !== pb) return pa - pb;
    return a.title.localeCompare(b.title);
  });
}

function formatMetaDate(date?: string): string | null {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const DocLink: React.FC<{
  doc: Doc; isDark: boolean; isActive: boolean; onClick?: () => void; mobile?: boolean;
  onPreviewChange?: (payload: { doc: Doc; rect: DOMRect } | null) => void;
}> = memo(({ doc, isDark, isActive, onClick, mobile, onPreviewChange }) => {
  const t = tk(isDark);
  const stateStyle = isActive
    ? getUnifiedControlStyle(isDark, true)
    : { border: '1px solid transparent', background: 'transparent', boxShadow: 'none', borderRadius: '8px' };
  return (
    <a href={toDocHref(doc.slug)} onClick={onClick}
      onMouseEnter={e => { if (!mobile) onPreviewChange?.({ doc, rect: e.currentTarget.getBoundingClientRect() }); }}
      onMouseLeave={() => { if (!mobile) onPreviewChange?.(null); }}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: mobile ? '10px 14px' : '8px 10px',
        fontSize: mobile ? '1rem' : '0.875rem',
        textDecoration: 'none',
        color: isActive ? t.accent : t.fg, fontWeight: isActive ? 600 : 400,
        lineHeight: 1.4,
        ...stateStyle,
      }}>
      {doc.icon && <span style={{ flexShrink: 0, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.fgMuted }}><LucideIcon name={doc.icon} size={18} /></span>}
      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35 }}>
        {doc.title}
      </span>
    </a>
  );
});

const HomePageLink: React.FC<{
  isDark: boolean; isActive: boolean; onClick?: () => void; mobile?: boolean;
}> = ({ isDark, isActive, onClick, mobile }) => {
  const t = tk(isDark);
  const stateStyle = isActive
    ? getUnifiedControlStyle(isDark, true)
    : { border: '1px solid transparent', background: 'transparent', boxShadow: 'none', borderRadius: '8px' };
  return (
    <a href="/" onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: mobile ? '10px 14px' : '8px 10px',
      fontSize: mobile ? '1rem' : '0.875rem',
      textDecoration: 'none',
      color: isActive ? t.accent : t.fg, fontWeight: isActive ? 600 : 400,
      lineHeight: 1.4,
      ...stateStyle,
    }}>
      <span style={{ flexShrink: 0, width: 15, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.fgMuted }}>
        <Crown size={14} />
      </span>
      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35 }}>
        Главная
      </span>
    </a>
  );
};

const CategoryNode: React.FC<{
  node: NavNode; path: string; expandedPaths: Set<string>;
  onToggle: (p: string) => void; isDark: boolean; currentDocSlug?: string;
  onDocClick?: () => void; mobile?: boolean; activeNavSlug: string;
  onDocHoverChange?: (payload: { doc: Doc; rect: DOMRect } | null) => void;
}> = memo(({ node, path, expandedPaths, onToggle, isDark, currentDocSlug, onDocClick, mobile, activeNavSlug, onDocHoverChange }) => {
  const t = tk(isDark);
  const categorySlug = [activeNavSlug, path].filter(Boolean).join('/');
  const isActiveCategory = currentDocSlug === categorySlug;
  const expanded = expandedPaths.has(path);
  const total    = countDocs(node);
  const headerActive = isActiveCategory || expanded;
  const headerBorderColor = getSectionOpenBorder(headerActive, isDark);
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{
        width: '100%', display: 'flex', alignItems: 'stretch', justifyContent: 'space-between',
        fontSize: mobile ? '1rem' : '0.875rem', fontWeight: 600,
        color: isActiveCategory ? t.accent : t.fg,
        overflow: 'hidden',
        ...getUnifiedControlStyle(isDark, headerActive),
      }}>
        <button type="button" onClick={() => onToggle(path)}
          aria-label={expanded ? `Свернуть категорию ${node.title}` : `Развернуть категорию ${node.title}`}
          style={{
            width: mobile ? 42 : 36,
            border: 'none',
            borderRight: `1px solid ${headerBorderColor}`,
            background: 'transparent',
            color: t.fgMuted,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <a href={toCategoryHref(activeNavSlug, path)} onClick={onDocClick}
          style={{
            flex: 1, minWidth: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '0.5rem',
            padding: mobile ? '10px 14px 10px 10px' : '8px 10px',
            color: 'inherit', textDecoration: 'none',
          }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
            {node.icon && <span style={{ width: 15, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: t.fgMuted }}><LucideIcon name={node.icon} size={14} /></span>}
            <span style={{ wordBreak: 'break-word', lineHeight: 1.35 }}>{node.title}</span>
          </span>
          {total > 0 && (
            <span style={{
              fontSize: '0.72rem', padding: '2px 7px', flexShrink: 0, color: t.fgMuted,
              ...getUnifiedControlStyle(isDark),
            }}>{total}</span>
          )}
        </a>
      </div>
      {expanded && (
        <div style={{
          marginLeft: '0.65rem', paddingLeft: '0.45rem',
          marginTop: '4px', marginBottom: '4px',
          display: 'flex', flexDirection: 'column', gap: '2px',
        }}>
          {sortDocs(node.docs).map(doc => (
            <DocLink key={doc.id} doc={doc} isDark={isDark} isActive={isDocActive(doc, currentDocSlug)} onClick={onDocClick} mobile={mobile} onPreviewChange={onDocHoverChange} />
          ))}
          {Object.entries(node.children).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => (
            <CategoryNode key={key} node={child} path={`${path}/${key}`} expandedPaths={expandedPaths} onToggle={onToggle} isDark={isDark} currentDocSlug={currentDocSlug} onDocClick={onDocClick} mobile={mobile} activeNavSlug={activeNavSlug} onDocHoverChange={onDocHoverChange} />
          ))}
        </div>
      )}
    </div>
  );
});

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

function buildCategorySlugSet(docs: Doc[]): Set<string> {
  const categorySlugs = new Set<string>();
  for (const doc of docs) {
    const pathItems = doc.categoryPath ?? [];
    pathItems.forEach((_, index) => {
      const slug = [doc.navSlug, ...pathItems.slice(0, index + 1).map((cat) => cat.slug)].filter(Boolean).join('/');
      if (slug) categorySlugs.add(slug);
    });
  }
  return categorySlugs;
}

function useExpandedPaths(currentDocSlug: string | undefined, activeNavSlug: string, categorySlugs: Set<string>): [Set<string>, React.Dispatch<React.SetStateAction<Set<string>>>] {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!currentDocSlug) return;
    let slug = currentDocSlug;
    if (activeNavSlug && slug.startsWith(activeNavSlug + '/')) slug = slug.slice(activeNavSlug.length + 1);
    const parts = slug.split('/').filter(Boolean);
    const isCategoryPage = categorySlugs.has(currentDocSlug);
    const pathSource = isCategoryPage ? parts : parts.slice(0, -1);
    const pathParts = pathSource.map((_, i) => pathSource.slice(0, i + 1).join('/'));
    startTransition(() => setExpandedPaths(new Set(pathParts)));
  }, [currentDocSlug, activeNavSlug, categorySlugs]);
  return [expandedPaths, setExpandedPaths];
}

function useNavPanel(docs: Doc[], currentDocSlug: string | undefined) {
  const [query, setQuery]             = useState('');
  const [sectionOpen, setSectionOpen] = useState(false);
  const sectionRef                    = useRef<HTMLDivElement>(null);
  const sections                          = useNavSections(docs);
  const [activeNavSlug, setActiveNavSlug] = useActiveNavSlug(sections);
  const categorySlugs = useMemo(() => buildCategorySlugSet(docs), [docs]);
  const [expandedPaths, setExpandedPaths] = useExpandedPaths(currentDocSlug, activeNavSlug, categorySlugs);

  useEffect(() => {
    if (!sectionOpen) return;
    const h = (e: MouseEvent) => {
      if (sectionRef.current && e.target instanceof Node && !sectionRef.current.contains(e.target)) {
        setSectionOpen(false);
      }
    };
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

function parsePanelType(value: string | null): PanelType {
  if (value === 'nav' || value === 'toc' || value === 'contacts') return value;
  return null;
}

function useDesktopPanel() {
  const [activePanel, setActivePanel] = useState<PanelType>(() => {
    try { return parsePanelType(sessionStorage.getItem('hub:activePanel')); } catch { return null; }
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

function useTocPanelWidth(): [number, (w: number) => void] {
  const [width, setWidth] = useState<number>(() => {
    try {
      const w = Number(sessionStorage.getItem('hub:tocPanelWidth'));
      if (w >= TOC_PANEL_MIN && w <= TOC_PANEL_MAX) return w;
    } catch { /* noop */ }
    return TOC_PANEL_W;
  });
  useEffect(() => { try { sessionStorage.setItem('hub:tocPanelWidth', String(width)); } catch { /* noop */ } }, [width]);
  return [width, setWidth];
}

function usePanelResize(
  width: number, setWidth: (w: number) => void,
  min: number, max: number, direction: 1 | -1 = 1,
) {
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartW = useRef(0);
  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartW.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = (ev.clientX - dragStartX.current) * direction;
      setWidth(Math.max(min, Math.min(max, dragStartW.current + delta)));
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
  }, [width, setWidth, min, max, direction]);
  return { onResizeMouseDown };
}

const SectionItemIcon: React.FC<{
  navSlug: string; navIcon: string; isActive: boolean; mobile: boolean; t: ReturnType<typeof tk>;
}> = ({ navSlug, navIcon, isActive, mobile, t }) => {
  const size = mobile ? 15 : 13;
  if (navSlug === '') return <Home size={size} style={{ color: t.fgMuted }} />;
  return (
    <span style={{ color: isActive ? t.accent : t.fgMuted, display: 'flex', alignItems: 'center' }}>
      {navIcon ? <LucideIcon name={navIcon} size={size} /> : <FolderOpen size={size} />}
    </span>
  );
};

const SectionDropdown: React.FC<{
  sections: NavSection[]; activeNavSlug: string; mobile: boolean; isDark: boolean; onSelect: (slug: string) => void;
}> = ({ sections, activeNavSlug, mobile, isDark, onSelect }) => {
  const t = tk(isDark);
  const padding  = mobile ? '0.7rem 0.85rem' : '0.55rem 0.7rem';
  const fontSize = mobile ? '1rem' : '0.875rem';
  return (
    <>
      {sections.map(s => {
        const isActive = s.navSlug === activeNavSlug;
        return (
          <button key={s.navSlug} onClick={() => onSelect(s.navSlug)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding, fontSize, textAlign: 'left', cursor: 'pointer',
              color: isActive ? t.accent : t.fg,
              fontWeight: isActive ? 600 : 400,
              ...getUnifiedControlStyle(isDark, isActive),
            }}>
            <SectionItemIcon navSlug={s.navSlug} navIcon={s.navIcon} isActive={isActive} mobile={!!mobile} t={t} />
            <span style={{ wordBreak: 'break-word', lineHeight: 1.3, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.navTitle}</span>
          </button>
        );
      })}
    </>
  );
};

const NavTreeContent: React.FC<{
  error: boolean; navTree: NavNode;
  currentDocSlug: string | undefined; expandedPaths: Set<string>;
  onToggle: (p: string) => void; isDark: boolean; mobile: boolean | undefined;
  activeNavSlug: string;
  onDocClick?: () => void;
  onDocHoverChange?: (payload: { doc: Doc; rect: DOMRect } | null) => void;
}> = ({ error, navTree, currentDocSlug, expandedPaths, onToggle, isDark, mobile, activeNavSlug, onDocClick, onDocHoverChange }) => {
  const t = tk(isDark);

  const filteredDocs = useMemo(() => {
    if (activeNavSlug !== '') return navTree.docs;
    return navTree.docs.filter(doc => doc.slug !== '' && doc.slug !== 'welcome');
  }, [navTree.docs, activeNavSlug]);

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '2rem', textAlign: 'center' }}>
      <AlertTriangle size={22} style={{ color: 'rgba(251,191,36,0.7)' }} />
      <p style={{ margin: 0, fontSize: mobile ? '0.95rem' : '0.8rem', color: t.fgMuted }}>Не удалось загрузить документы</p>
      <button onClick={() => globalThis.location.reload()} style={{ padding: '0.35rem 0.85rem', borderRadius: '7px', border: `1px solid ${t.border}`, background: 'transparent', color: t.fgMuted, fontSize: mobile ? '0.9rem' : '0.75rem', cursor: 'pointer' }}>Обновить</button>
    </div>
  );
  return (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      {activeNavSlug === '' && (
        <HomePageLink isDark={isDark} isActive={isHomeDocActive(currentDocSlug)} onClick={onDocClick} mobile={mobile} />
      )}
      {filteredDocs.length > 0 && (
        <div style={{ marginBottom: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {sortDocs(filteredDocs).map(doc => (
            <DocLink key={doc.id} doc={doc} isDark={isDark} isActive={isDocActive(doc, currentDocSlug)} onClick={onDocClick} mobile={mobile} onPreviewChange={onDocHoverChange} />
          ))}
        </div>
      )}
      {Object.entries(navTree.children).sort(([a], [b]) => a.localeCompare(b)).map(([key, node]) => (
        <CategoryNode key={key} node={node} path={key} expandedPaths={expandedPaths} onToggle={onToggle} isDark={isDark} currentDocSlug={currentDocSlug} onDocClick={onDocClick} mobile={mobile} activeNavSlug={activeNavSlug} onDocHoverChange={onDocHoverChange} />
      ))}
    </nav>
  );
};

const DocHoverPreview: React.FC<{ isDark: boolean; payload: { doc: Doc; rect: DOMRect } }> = ({ isDark, payload }) => {
  const t = tk(isDark);
  const { doc, rect } = payload;
  const top  = Math.max(12, Math.min(globalThis.window.innerHeight - 260, rect.top));
  const left = Math.min(globalThis.window.innerWidth - 360, rect.right + 12);
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

function getRailBtnColor(isActive: boolean | undefined, hov: boolean, t: ReturnType<typeof tk>): string {
  if (isActive) return t.accent;
  return hov ? t.fg : t.fgMuted;
}

const PLACEHOLDER_STYLE_ID = 'nav-search-placeholder-style';
function ensurePlaceholderStyle(isDark: boolean) {
  const color = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)';
  let el = document.getElementById(PLACEHOLDER_STYLE_ID);
  if (!el) {
    el = document.createElement('style');
    el.id = PLACEHOLDER_STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = `.nav-search-input::placeholder { color: ${color}; opacity: 1; }`;
}

function useNavScrollRestore(scrollContainerRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const handleScroll = () => {
      try {
        sessionStorage.setItem(NAV_SCROLL_KEY, String(el.scrollTop));
      } catch { /* noop */ }
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [scrollContainerRef]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    try {
      const saved = sessionStorage.getItem(NAV_SCROLL_KEY);
      if (saved) {
        const top = Number(saved);
        setTimeout(() => { el.scrollTop = top; }, 50);
      }
    } catch { /* noop */ }
  }, [scrollContainerRef]);
}

const UnifiedCloseBtn: React.FC<{
  onClick: () => void; isDark: boolean; label?: string; size?: 'sm' | 'md';
}> = ({ onClick, isDark, label = 'Закрыть', size = 'sm' }) => {
  const t = tk(isDark);
  const [hov, setHov] = useState(false);
  const dim = size === 'md' ? 32 : 26;
  const iconSz = size === 'md' ? 14 : 12;
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: dim, height: dim, flexShrink: 0,
        borderRadius: '8px',
        border: `1px solid ${t.sectionBorder}`,
        background: t.sectionBg,
        boxShadow: t.sectionShadow,
        color: hov ? t.fg : t.fgMuted,
        cursor: 'pointer',
        transition: 'color 0.13s',
      }}
    >
      <X size={iconSz} />
    </button>
  );
};

const NavPanelContent: React.FC<{
  isDark: boolean; currentDocSlug?: string; mobile?: boolean;
}> = ({ isDark, currentDocSlug, mobile }) => {
  const t = tk(isDark);
  const { manifest: docs, error } = useManifest();
  const { query, setQuery, sectionOpen, setSectionOpen, sectionRef, sections, activeNavSlug, expandedPaths, navTree, activeSection, togglePath, handleSectionSelect } = useNavPanel(docs as Doc[], currentDocSlug);

  const inputFontSize = mobile ? '1rem' : '0.855rem';
  const inputPadding  = mobile ? '0.6rem 0.6rem 0.6rem 2.4rem' : '0.4rem 0.65rem 0.4rem 2.1rem';
  const iconSize      = mobile ? 15 : 13;
  const [hoverPreview, setHoverPreview] = useState<{ doc: Doc; rect: DOMRect } | null>(null);
  const [focused, setFocused]           = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  useNavScrollRestore(scrollRef);

  useEffect(() => { ensurePlaceholderStyle(isDark); }, [isDark]);

  const controlStyle        = getUnifiedControlStyle(isDark, false);
  const controlStyleFocused = getUnifiedControlStyle(isDark, true);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ flexShrink: 0, padding: mobile ? '12px 14px' : '10px', borderBottom: 'none' }}>
        <div style={{ position: 'relative' }}>
          <Search size={iconSize} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: t.fg, pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Поиск..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="nav-search-input"
            style={{
              width: '100%',
              padding: inputPadding,
              fontSize: inputFontSize,
              color: t.fg,
              outline: 'none',
              boxSizing: 'border-box',
              ...(focused ? controlStyleFocused : controlStyle),
            }}
          />
        </div>
      </div>

      {sections.length > 1 && activeSection && (
        <div ref={sectionRef} style={{ flexShrink: 0, padding: mobile ? '4px 14px 10px' : '2px 10px 8px', borderBottom: 'none', position: 'relative', zIndex: 10 }}>
          <button
            onClick={() => setSectionOpen(v => !v)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: mobile ? '0.55rem 0.85rem' : '0.4rem 0.65rem',
              fontSize: mobile ? '1rem' : '0.875rem',
              color: t.fg, cursor: 'pointer',
              ...getUnifiedControlStyle(isDark, sectionOpen),
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', minWidth: 0, flex: 1 }}>
              {activeSection.navSlug === ''
                ? <Home size={iconSize} style={{ color: t.fgMuted, flexShrink: 0 }} />
                : <LucideIcon name={activeSection.navIcon} size={iconSize} />}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-word', lineHeight: 1.3 }}>{activeSection.navTitle}</span>
            </div>
            <ChevronDown size={mobile ? 14 : 12} style={{ color: t.fgMuted, flexShrink: 0, transform: sectionOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
          </button>

          {sectionOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '6px',
              borderRadius: '12px', border: `1px solid ${t.elevatedBorder}`,
              background: isDark ? '#121212' : '#ECEBE7',
              boxShadow: t.elevatedShadow,
              zIndex: 100, overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px' }}>
                <SectionDropdown sections={sections} activeNavSlug={activeNavSlug} mobile={!!mobile} isDark={isDark} onSelect={handleSectionSelect} />
              </div>
            </div>
          )}
        </div>
      )}

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: mobile ? '8px 6px 86px' : '6px' }}>
        <NavTreeContent
          error={!!error} navTree={navTree}
          currentDocSlug={currentDocSlug} expandedPaths={expandedPaths}
          onToggle={togglePath} isDark={isDark} mobile={mobile}
          activeNavSlug={activeNavSlug}
          onDocClick={undefined}
          onDocHoverChange={setHoverPreview}
        />
      </div>
      {!mobile && hoverPreview && <DocHoverPreview isDark={isDark} payload={hoverPreview} />}
    </div>
  );
};
const TOC_INDENT_PX = 10;
const TOC_BEND = 8;
const TOC_SPRING_CFG = { stiffness: 180, damping: 20 };

interface TocDomPathInfo {
  path: string;
  totalLength: number;
  centers: number[]; 
  svgH: number;      
  endX: number;      
  endY: number;      
}

function buildTocDomPath(
  containerEl: HTMLElement,
  itemEls: Map<string, HTMLElement>,
  toc: TocItem[],
): TocDomPathInfo {
  if (!toc.length) return { path: '', totalLength: 0, centers: [], svgH: 0, endX: 0, endY: 0 };

  const minLevel = Math.min(...toc.map(i => i.level));

  const points: { x: number; centerY: number; bottomY: number }[] = [];
  for (const item of toc) {
    const el = itemEls.get(item.id);
    if (!el) return { path: '', totalLength: 0, centers: [], svgH: 0, endX: 0, endY: 0 };
    const top = el.offsetTop;
    const h   = el.offsetHeight;
    const x   = (item.level - minLevel) * TOC_INDENT_PX + 6;
    points.push({ x, centerY: top + h / 2, bottomY: top + h });
  }

  const svgH = points[points.length - 1].bottomY + 4;

  let d = '';
  let len = 0;
  const centers: number[] = [];
  let curX = points[0].x;
  let curY = Math.max(0, points[0].centerY - 20);

  d += `M ${curX} ${curY}`;

  for (let i = 0; i < points.length; i++) {
    const { x, centerY, bottomY } = points[i];

    if (x !== curX) {
      const bendY = curY + TOC_BEND;
      d += ` L ${curX} ${bendY} L ${x} ${bendY + TOC_BEND}`;
      len += Math.hypot(x - curX, TOC_BEND) + TOC_BEND;
      curX = x;
      curY = bendY + TOC_BEND;
    }

    const toCenter = centerY - curY;
    len += Math.abs(toCenter);
    centers.push(len);
    curY = centerY;

    const isLast = i === points.length - 1;
    if (!isLast) {
      d += ` L ${x} ${bottomY}`;
      len += Math.abs(bottomY - curY);
      curY = bottomY;
    }
  }

  return { path: d, totalLength: len, centers, svgH, endX: curX, endY: curY };
}

const TocIndicatorSvg: React.FC<{
  pathInfo: TocDomPathInfo;
  activeIndex: number;
  isDark: boolean;
}> = ({ pathInfo, activeIndex, isDark }) => {
  const t = tk(isDark);
  const { path, totalLength, centers, svgH } = pathInfo;

  const activeDistance = (activeIndex >= 0 && activeIndex < centers.length) ? centers[activeIndex] : 0;
  const isActive = activeIndex >= 0 && activeDistance > 0;

  const animDist   = useSpring(0, TOC_SPRING_CFG);
  const tailRotate = useSpring(90, TOC_SPRING_CFG);
  const tailMT     = useSpring(-35, TOC_SPRING_CFG);
  const prevRef    = useRef(activeIndex);

  useEffect(() => {
    if (activeIndex !== prevRef.current) {
      const down = activeIndex > prevRef.current;
      tailRotate.set(down ? 90 : -90);
      tailMT.set(down ? -35 : -35 + 65);
      prevRef.current = activeIndex;
    }
    animDist.set(activeDistance);
  }, [activeDistance, activeIndex, animDist, tailRotate, tailMT]);

  const pct = useTransform(animDist, v => totalLength > 0 ? `${(v / totalLength) * 100}%` : '0%');

  if (!path || svgH === 0) return null;

  const css = `path('${path}')`;

  const trackColor = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)';

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        maskImage: 'linear-gradient(to bottom, transparent 0px, black 12px, black 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, black 12px, black 100%)',
      }}
    >
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', overflow: 'visible' }} height={svgH}>
        <defs>
          <mask id="toc-mask-nav" maskUnits="userSpaceOnUse">
            <path d={path} stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </mask>
        </defs>
        <path d={path} stroke={trackColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>

      <div style={{ position: 'absolute', inset: 0, mask: 'url(#toc-mask-nav)', WebkitMask: 'url(#toc-mask-nav)', overflow: 'hidden', height: svgH }}>
        <motion.div
          style={{
            position: 'absolute', top: 0, left: 0,
            width: 80, height: 80,
            offsetPath: css, offsetRotate: '0deg',
            rotate: tailRotate,
            marginLeft: -1, marginTop: tailMT,
            offsetDistance: pct,
            opacity: isActive ? 1 : 0,
          }}
        >
          <svg width="80" height="80" viewBox="0 0 80 80" style={{ overflow: 'visible' }}>
            <defs>
              <radialGradient id="toc-glow-nav" cx="0.82" cy="0.5" fx="0.82" gradientUnits="objectBoundingBox">
                <stop offset="0%"   stopColor={t.accent} stopOpacity="1" />
                <stop offset="50%"  stopColor={t.accent} stopOpacity="0.5" />
                <stop offset="100%" stopColor={t.accent} stopOpacity="0" />
              </radialGradient>
            </defs>
            <ellipse cx="40" cy="40" rx="40" ry="40" fill="url(#toc-glow-nav)" />
          </svg>
        </motion.div>
      </div>

      <motion.div
        style={{
          position: 'absolute', top: 0, left: 0,
          width: 7, height: 7,
          borderRadius: 1.5,
          background: t.accent,
          boxShadow: `0 0 5px 2px ${t.accent}88`,
          offsetPath: css, offsetRotate: '0deg', rotate: '45deg',
          marginLeft: -0.5, marginTop: -3.5,
          offsetDistance: pct,
          opacity: isActive ? 1 : 0,
        }}
      />
    </div>
  );
};

const TocPanelContent: React.FC<{
  toc: TocItem[]; activeId: string; isDark: boolean; onItemClick?: () => void; mobile?: boolean;
}> = ({ toc, activeId, isDark, onItemClick, mobile = false }) => {
  const t = tk(isDark);
  const scrollRef  = useRef<HTMLDivElement>(null);
  const listRef    = useRef<HTMLDivElement>(null);
  const itemRefs   = useRef<Map<string, HTMLElement>>(new Map());
  const [pathInfo, setPathInfo] = useState<TocDomPathInfo>({ path: '', totalLength: 0, centers: [], svgH: 0, endX: 0, endY: 0 });

  const activeIndex = toc.findIndex(item => item.id === activeId);
  const minLevel    = toc.length ? Math.min(...toc.map(i => i.level)) : 0;
  const maxDepth    = toc.length ? Math.max(...toc.map(i => i.level)) - minLevel : 0;
  const indicatorW  = maxDepth * TOC_INDENT_PX + 6 + 12;

  useEffect(() => {
    if (!toc.length) return;
    const measure = () => {
      const list = listRef.current;
      if (!list) return;
      const info = buildTocDomPath(list, itemRefs.current, toc);
      if (info.path) setPathInfo(info);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (listRef.current) ro.observe(listRef.current);
    itemRefs.current.forEach(el => ro.observe(el));
    return () => ro.disconnect();
  }, [toc]);

  useEffect(() => {
    const container = scrollRef.current;
    const el = activeId ? itemRefs.current.get(activeId) : undefined;
    if (!container || !el) return;
    const target = el.offsetTop - container.clientHeight / 2 + el.offsetHeight / 2;
    container.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
  }, [activeId]);

  if (!toc.length) return (
    <div style={{ flex: 1, padding: '2.5rem 1.5rem', textAlign: 'center', fontSize: '0.875rem', color: t.fgMuted }}>
      На этой странице нет заголовков
    </div>
  );

  return (
    <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: mobile ? '6px 8px 18px 6px' : '6px 6px 12px 4px' }}>
      <div ref={listRef} style={{ position: 'relative', display: 'flex', flexDirection: 'row', minWidth: 0 }}>

        <div style={{ position: 'relative', width: indicatorW, flexShrink: 0, height: pathInfo.svgH || '100%' }}>
          <TocIndicatorSvg pathInfo={pathInfo} activeIndex={activeIndex} isDark={isDark} />
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {toc.map((item, index) => {
            const isActive = index === activeIndex;
            const depth    = item.level - minLevel;
            return (
              <button
                key={item.id}
                ref={el => { if (el) itemRefs.current.set(item.id, el); else itemRefs.current.delete(item.id); }}
                onClick={() => { scrollToElement(item.id); onItemClick?.(); }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  paddingLeft:   `${depth * 6 + 2}px`,
                  paddingRight:  mobile ? '10px' : '6px',
                  paddingTop:    '5px',
                  paddingBottom: '5px',
                  fontSize: mobile ? '1rem' : `${0.875 - depth * 0.025}rem`,
                  lineHeight: 1.4,
                  background:    'transparent',
                  border:        'none',
                  cursor:        'pointer',
                  textAlign:     'left',
                  color:         isActive ? t.fg : t.fgMuted,
                  fontWeight:    isActive ? 600 : 400,
                  transition:    'color 0.2s',
                  whiteSpace:    'normal',
                  wordBreak:     'break-word',
                  overflowWrap:  'anywhere',
                  width:         '100%',
                  boxSizing:     'border-box',
                }}
              >
                {item.text}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ContactsPanelContent: React.FC<{ isDark: boolean; mobile?: boolean }> = ({ isDark, mobile }) => {
  const t = tk(isDark);
  return (
    <div style={{ padding: '8px' }}>
      {CONTACTS.map(c => (
        <a key={c.href} href={c.href} target={c.external ? '_blank' : undefined} rel={c.external ? 'noopener noreferrer' : undefined}
          style={{ display: 'flex', flexDirection: 'column', padding: mobile ? '14px 16px' : '10px', borderRadius: '10px', textDecoration: 'none', color: t.fg, fontSize: mobile ? '1rem' : '0.875rem', gap: '3px' }}
          onMouseEnter={e => { e.currentTarget.style.background = t.hov; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
          <div style={{ fontWeight: 600 }}>{c.title}</div>
          <div style={{ fontSize: mobile ? '0.875rem' : '0.75rem', color: t.fgMuted }}>{c.subtitle}</div>
        </a>
      ))}
    </div>
  );
};

const PanelHeader: React.FC<{ title: string; isDark: boolean; onClose: () => void }> = ({ title, isDark, onClose }) => {
  const t = tk(isDark);
  return (
    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 10px 8px', borderBottom: 'none' }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.fgMuted }}>{title}</span>
      <UnifiedCloseBtn onClick={onClose} isDark={isDark} label="Закрыть панель" size="sm" />
    </div>
  );
};

const RailBtn: React.FC<{
  icon: React.ReactNode; label: string; isActive?: boolean; isDark: boolean; onClick: () => void; title?: string;
}> = ({ icon, label, isActive, isDark, onClick, title }) => {
  const t = tk(isDark);
  const [hov, setHov] = useState(false);
  const btnColor = getRailBtnColor(isActive, hov, t);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: RAIL_W - 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px', padding: '10px 4px', border: '1px solid transparent', background: 'transparent', color: btnColor, cursor: 'pointer', borderRadius: '12px', flexShrink: 0 }}>
      <span style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      <span style={{ fontSize: label === 'Оглавление' ? '11px' : '10px', fontWeight: 500, lineHeight: 1.1, letterSpacing: '0.01em', textAlign: 'center' }}>{label}</span>
    </button>
  );
};

function buildCssVars(
  railVisible: boolean, isDocsPage: boolean, panelOpen: boolean,
  panelWidth: number, isStandardMode: boolean, standardTocVisible: boolean,
  tocPanelWidth: number,
): void {
  const chromeGap     = isDocsPage ? DOC_CHROME_GAP : 0;
  const chromeTopGap  = isDocsPage ? DOC_CHROME_TOP_GAP : 0;
  const panelOffset   = isDocsPage && panelOpen ? panelWidth : 0;
  const left          = railVisible ? chromeGap + RAIL_W + panelOffset + chromeGap : chromeGap;
  const docRight      = isDocsPage && isStandardMode && standardTocVisible ? chromeGap + tocPanelWidth + chromeGap : chromeGap;
  const sidebarHidden = isDocsPage && isStandardMode && !railVisible;
  const tocHidden     = isDocsPage && isStandardMode && !standardTocVisible;
  document.documentElement.style.setProperty('--nav-left', `${left}px`);
  document.documentElement.style.setProperty('--doc-right', `${docRight}px`);
  document.documentElement.style.setProperty('--doc-border-left', sidebarHidden ? '1' : '0');
  document.documentElement.style.setProperty('--doc-border-right', tocHidden ? '1' : '0');
  document.documentElement.style.setProperty('--doc-chrome-gap', `${chromeGap}px`);
  document.documentElement.style.setProperty('--doc-chrome-top-gap', `${chromeTopGap}px`);
  document.documentElement.style.setProperty('--doc-chrome-radius', `${isDocsPage ? DOC_CHROME_RADIUS : 0}px`);
}

function clearDocCssVars(): void {
  document.documentElement.style.removeProperty('--doc-right');
  document.documentElement.style.removeProperty('--doc-border-left');
  document.documentElement.style.removeProperty('--doc-border-right');
  document.documentElement.style.removeProperty('--doc-chrome-gap');
  document.documentElement.style.removeProperty('--doc-chrome-top-gap');
  document.documentElement.style.removeProperty('--doc-chrome-radius');
}

function getReadingModeFromStorage(): ReadingMode {
  try { const saved = sessionStorage.getItem('hub:readingMode'); return saved === 'standard' ? 'standard' : 'extended'; } catch { return 'extended'; }
}

function getTocVisibleFromStorage(): boolean {
  try { const saved = sessionStorage.getItem('hub:reading:tocVisible'); return saved !== 'false'; } catch { return true; }
}

const PANEL_TITLES: Record<Exclude<PanelType, null>, string> = {
  nav:      'Навигация',
  toc:      'Оглавление',
  contacts: 'Контакты',
};

const BrandLogo: React.FC<{ logoPath: string; size: number }> = ({ logoPath, size }) => {
  if (!logoPath) return <span aria-hidden style={{ width: size, height: size, display: 'inline-block' }} />;
  return (
    <img src={logoPath} alt="hub"
      onError={e => { e.currentTarget.style.display = 'none'; }}
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  );
};

const ResizeHandle: React.FC<{
  edge: 'left' | 'right';
  onMouseDown: (e: React.MouseEvent) => void;
  label: string;
}> = ({ edge, onMouseDown, label }) => {
  return (
    <button
      type="button"
      onMouseDown={onMouseDown}
      aria-label={label}
      title={label}
      style={{
        position: 'absolute', [edge]: 0, top: 0, bottom: 0, width: '6px',
        cursor: 'col-resize', zIndex: 20, padding: 0, border: 'none', background: 'transparent',
      }}
    />
  );
};

interface DesktopNavState {
  railVisible:          boolean;
  setRailVisible:       React.Dispatch<React.SetStateAction<boolean>>;
  searchOpen:           boolean;
  setSearchOpen:        React.Dispatch<React.SetStateAction<boolean>>;
  readingModeMenuOpen:  boolean;
  setReadingModeMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  standardSidebarOpen:  boolean;
  setStandardSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  readingMode:          ReadingMode;
  setReadingMode:       React.Dispatch<React.SetStateAction<ReadingMode>>;
  standardTocVisible:   boolean;
  setStandardTocVisible: React.Dispatch<React.SetStateAction<boolean>>;
  activePanel:          PanelType;
  setActivePanel:       React.Dispatch<React.SetStateAction<PanelType>>;
  panelWidth:           number;
  setPanelWidth:        (w: number) => void;
  togglePanel:          (panel: PanelType) => void;
  tocPanelWidth:        number;
  setTocPanelWidth:     (w: number) => void;
}

function useDesktopNavState(): DesktopNavState {
  const [railVisible,          setRailVisible]          = useState(true);
  const [searchOpen,           setSearchOpen]           = useState(false);
  const [readingModeMenuOpen,  setReadingModeMenuOpen]  = useState(false);
  const [standardSidebarOpen,  setStandardSidebarOpen]  = useState(true);
  const [readingMode,          setReadingMode]          = useState<ReadingMode>(getReadingModeFromStorage);
  const [standardTocVisible,   setStandardTocVisible]   = useState<boolean>(getTocVisibleFromStorage);
  const { activePanel, setActivePanel, panelWidth, setPanelWidth, togglePanel } = useDesktopPanel();
  const [tocPanelWidth, setTocPanelWidth] = useTocPanelWidth();
  return {
    railVisible, setRailVisible,
    searchOpen, setSearchOpen,
    readingModeMenuOpen, setReadingModeMenuOpen,
    standardSidebarOpen, setStandardSidebarOpen,
    readingMode, setReadingMode,
    standardTocVisible, setStandardTocVisible,
    activePanel, setActivePanel, panelWidth, setPanelWidth, togglePanel,
    tocPanelWidth, setTocPanelWidth,
  };
}

interface DesktopNavDerived {
  isDocsPage:        boolean;
  chromeGap:         number;
  chromeTopGap:      number;
  chromeRadius:      number;
  sidebarBg:         string;
  isStandardMode:    boolean;
  panelOpen:         boolean;
  sidebarShellWidth: number;
  panelTitle:        Exclude<PanelType, null>;
}

function deriveDesktopNavValues(
  state: DesktopNavState,
  currentDocSlug: string | undefined,
  readingModeEnabled: boolean,
  isDark: boolean,
  floatingChrome = false,
): DesktopNavDerived {
  const isDocsPage       = Boolean(currentDocSlug) || floatingChrome;
  const chromeGap        = isDocsPage ? DOC_CHROME_GAP : 0;
  const chromeTopGap     = isDocsPage ? DOC_CHROME_TOP_GAP : 0;
  const chromeRadius     = isDocsPage ? DOC_CHROME_RADIUS : 0;
  const sidebarBg        = isDark ? 'rgba(15,15,15,0.84)' : 'rgba(224,223,219,0.82)';
  const isStandardMode   = readingModeEnabled && state.readingMode === 'standard';

  const panelOpen = isStandardMode
    ? (state.railVisible && state.standardSidebarOpen)
    : !!state.activePanel;

  const sidebarShellWidth = RAIL_W + (panelOpen ? state.panelWidth : 0);

  const panelTitle: Exclude<PanelType, null> = state.activePanel ?? 'nav';

  return { isDocsPage, chromeGap, chromeTopGap, chromeRadius, sidebarBg, isStandardMode, panelOpen, sidebarShellWidth, panelTitle };
}

const DesktopSidebarShell: React.FC<{
  enabled: boolean; isDocsPage: boolean; chromeGap: number; chromeTopGap: number;
  chromeRadius: number; sidebarShellWidth: number; sidebarBg: string;
}> = ({ enabled, isDocsPage, chromeGap, chromeTopGap, chromeRadius, sidebarShellWidth, sidebarBg }) => {
  if (!enabled || !isDocsPage) return null;
  return (
    <div aria-hidden style={{
      position: 'fixed', left: chromeGap, top: chromeTopGap,
      height: `calc(100vh - ${chromeTopGap + chromeGap}px)`,
      width: sidebarShellWidth,
      background: sidebarBg, border: 'none', borderRadius: chromeRadius, zIndex: 47,
      pointerEvents: 'none', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
    }} />
  );
};

const DesktopReadingModeMenu: React.FC<{
  readingMode: ReadingMode; readingModeMenuOpen: boolean; chromeRadius: number;
  sidebarBg: string; t: ReturnType<typeof tk>;
  onSelect: (mode: ReadingMode) => void;
}> = ({ readingMode, readingModeMenuOpen, chromeRadius, sidebarBg, t, onSelect }) => {
  if (!readingModeMenuOpen) return null;
  const radius = chromeRadius || 10;
  return (
    <div style={{
      position: 'absolute', left: 'calc(100% - 1px)', top: 0, marginLeft: 0, width: '190px', padding: '8px',
      borderRadius: `0 ${radius}px ${radius}px 0`,
      border: 'none',
      background: sidebarBg, boxShadow: 'none', zIndex: 70,
      backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
    }}>
      <button onClick={() => onSelect('standard')} style={{ width: '100%', textAlign: 'left', border: 'none', borderRadius: '8px', padding: '8px 10px', cursor: 'pointer', background: readingMode === 'standard' ? t.accentSoft : 'transparent', color: t.fg, fontSize: '0.8rem' }}>
        Стандартный
      </button>
      <button onClick={() => onSelect('extended')} style={{ width: '100%', textAlign: 'left', border: 'none', borderRadius: '8px', padding: '8px 10px', cursor: 'pointer', background: readingMode === 'extended' ? t.accentSoft : 'transparent', color: t.fg, fontSize: '0.8rem', marginTop: '4px' }}>
        Расширенный
      </button>
    </div>
  );
};

const DesktopRail: React.FC<{
  isDark: boolean; toggleTheme: () => void; logoPath: string;
  isDocsPage: boolean; chromeGap: number; chromeTopGap: number; chromeRadius: number;
  panelOpen: boolean; shellEnabled: boolean; t: ReturnType<typeof tk>;
  state: DesktopNavState; derived: DesktopNavDerived;
  readingModeEnabled: boolean;
  onHideRail: () => void;
  onOpenSearch: () => void;
  onTogglePanel: (panel: Exclude<PanelType, null>) => void;
  hasToc: boolean;
}> = ({
  isDark, toggleTheme, logoPath,
  isDocsPage, chromeGap, chromeTopGap, chromeRadius, panelOpen, shellEnabled, t,
  state, derived, readingModeEnabled,
  onHideRail, onOpenSearch, onTogglePanel, hasToc,
}) => {
  const { readingMode, readingModeMenuOpen, setReadingModeMenuOpen, setReadingMode, activePanel } = state;
  const { isStandardMode, sidebarBg } = derived;

  return (
    <aside style={{
      position: 'fixed', left: chromeGap, top: chromeTopGap,
      height: isDocsPage ? `calc(100vh - ${chromeTopGap + chromeGap}px)` : '100vh',
      width: RAIL_W,
      background: isDocsPage && shellEnabled ? 'transparent' : sidebarBg,
      border: 'none',
      borderRadius: panelOpen ? `${chromeRadius}px 0 0 ${chromeRadius}px` : chromeRadius,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      zIndex: 50, padding: '8px 0', gap: '2px',
      backdropFilter: isDocsPage && shellEnabled ? 'none' : 'blur(12px)',
      WebkitBackdropFilter: isDocsPage && shellEnabled ? 'none' : 'blur(12px)',
    }}>
      <div style={{ width: RAIL_W, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <BrandLogo logoPath={logoPath} size={42} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1, width: '100%', padding: '2px 0' }}>
        <RailBtn icon={<PanelLeft size={18} />}                         label="Скрыть панель" isDark={isDark} onClick={onHideRail}                title="Скрыть панель" />
        <RailBtn icon={isDark ? <Sun size={18} /> : <Moon size={18} />} label="Тема"          isDark={isDark} onClick={toggleTheme}              title={isDark ? 'Светлая' : 'Тёмная'} />
        <RailBtn icon={<Search size={18} />}                            label="Поиск"         isDark={isDark} onClick={onOpenSearch}             title="Поиск" />
        <RailBtn icon={<FolderOpen size={18} />}                        label="Разделы"       isDark={isDark}
          isActive={isStandardMode ? (state.standardSidebarOpen && activePanel === 'nav') : activePanel === 'nav'}
          onClick={() => onTogglePanel('nav')}
          title="Разделы"
        />
        {readingModeEnabled && (
          <div style={{ position: 'relative' }}>
            <RailBtn icon={<BookOpenText size={18} />} label="Режим чтения" isDark={isDark} isActive={readingModeMenuOpen} onClick={() => setReadingModeMenuOpen(prev => !prev)} title="Режим чтения" />
            <DesktopReadingModeMenu
              readingMode={readingMode}
              readingModeMenuOpen={readingModeMenuOpen}
              chromeRadius={chromeRadius}
              sidebarBg={sidebarBg}
              t={t}
              onSelect={mode => {
                state.setActivePanel(null);
                state.setStandardSidebarOpen(false);
                setReadingMode(mode);
                setReadingModeMenuOpen(false);
              }}
            />
          </div>
        )}
        {!isStandardMode && (
          <>
            {hasToc && <RailBtn icon={<List size={18} />} label="Оглавление" isDark={isDark} isActive={activePanel === 'toc'} onClick={() => onTogglePanel('toc')} title="Оглавление" />}
            <RailBtn icon={<ArrowUp size={18} />} label="Наверх" isDark={isDark} onClick={() => globalThis.scrollTo({ top: 0, behavior: 'smooth' })} title="Наверх" />
          </>
        )}
        {isStandardMode && !state.standardTocVisible && (
          <RailBtn icon={<ArrowUp size={18} />} label="Наверх" isDark={isDark} onClick={() => globalThis.scrollTo({ top: 0, behavior: 'smooth' })} title="Наверх" />
        )}
        <RailBtn icon={<Mail size={18} />} label="Контакты" isDark={isDark}
          isActive={isStandardMode ? (state.standardSidebarOpen && activePanel === 'contacts') : activePanel === 'contacts'}
          onClick={() => onTogglePanel('contacts')}
          title="Контакты"
        />
      </div>
    </aside>
  );
};

const DesktopSlidingPanel: React.FC<{
  isDocsPage: boolean; chromeGap: number; chromeTopGap: number; chromeRadius: number;
  panelOpen: boolean; panelWidth: number; panelBg: string;
  shellEnabled: boolean;
  panelTitle: Exclude<PanelType, null>;
  currentDocSlug?: string; toc: TocItem[]; activeId: string; isDark: boolean;
  onResizeMouseDown: (e: React.MouseEvent) => void;
  onClose: () => void;
}> = ({
  isDocsPage, chromeGap, chromeTopGap,
  chromeRadius, panelOpen, panelWidth,
  panelBg, shellEnabled, panelTitle,
  currentDocSlug, toc, activeId, isDark,
  onResizeMouseDown, onClose,
}) => {
  return (
    <aside style={{
      position: 'fixed', left: chromeGap + RAIL_W, top: chromeTopGap,
      height: isDocsPage ? `calc(100vh - ${chromeTopGap + chromeGap}px)` : '100vh',
      width: panelOpen ? panelWidth : 0,
      background: isDocsPage && shellEnabled ? 'transparent' : panelBg,
      border: 'none',
      borderRadius: panelOpen ? `0 ${chromeRadius}px ${chromeRadius}px 0` : 0,
      display: 'flex', flexDirection: 'column', zIndex: 49, overflow: 'hidden',
      pointerEvents: panelOpen ? 'auto' : 'none',
      visibility: panelOpen ? 'visible' : 'hidden',
      backdropFilter: isDocsPage && shellEnabled ? 'none' : 'blur(14px)',
      WebkitBackdropFilter: isDocsPage && shellEnabled ? 'none' : 'blur(14px)',
      boxSizing: 'border-box',
    }}>
      {panelOpen && (
        <>
          <PanelHeader title={PANEL_TITLES[panelTitle]} isDark={isDark} onClose={onClose} />
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {panelTitle === 'nav'      && <NavPanelContent isDark={isDark} currentDocSlug={currentDocSlug} />}
            {panelTitle === 'toc'      && <TocPanelContent toc={toc} activeId={activeId} isDark={isDark} />}
            {panelTitle === 'contacts' && <div style={{ overflowY: 'auto' }}><ContactsPanelContent isDark={isDark} /></div>}
          </div>
          <ResizeHandle edge="right" onMouseDown={onResizeMouseDown} label="Изменить ширину панели" />
        </>
      )}
    </aside>
  );
};

const DesktopTocPanel: React.FC<{
  isDocsPage: boolean; chromeGap: number; chromeTopGap: number; chromeRadius: number;
  panelBg: string; t: ReturnType<typeof tk>;
  toc: TocItem[]; activeId: string; isDark: boolean;
  width: number;
  onResizeMouseDown: (e: React.MouseEvent) => void;
  onHideToc: () => void;
}> = ({ isDocsPage, chromeGap, chromeTopGap, chromeRadius, panelBg, t, toc, activeId, isDark, width, onResizeMouseDown, onHideToc }) => (
  <aside style={{
    position: 'fixed', right: chromeGap, top: chromeTopGap, width,
    height: isDocsPage ? `calc(100vh - ${chromeTopGap + chromeGap}px)` : '100vh',
    border: 'none', borderLeft: 'none',
    borderRadius: `${chromeRadius}px 0 0 ${chromeRadius}px`,
    overflow: 'hidden', background: panelBg, zIndex: 48,
    display: 'flex', flexDirection: 'column',
    backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
  }}>
    <ResizeHandle edge="left" onMouseDown={onResizeMouseDown} label="Изменить ширину оглавления" />
    <div style={{ padding: '10px 10px 8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.fgMuted }}>Оглавление</span>
        <button onClick={() => globalThis.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            border: `1px solid ${t.sectionBorder}`,
            background: t.sectionBg,
            boxShadow: t.sectionShadow,
            color: t.fgMuted,
            cursor: 'pointer',
            padding: '0 8px',
            height: '26px',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            transition: 'color 0.13s',
          }}
          title="Наверх"
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = t.fg; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = t.fgMuted; }}
        >
          <ArrowUp size={11} />
          <span style={{ fontSize: '0.58rem', lineHeight: 1, fontWeight: 500 }}>Наверх</span>
        </button>
      </div>
      <UnifiedCloseBtn onClick={onHideToc} isDark={isDark} label="Скрыть оглавление" size="sm" />
    </div>
    <TocPanelContent toc={toc} activeId={activeId} isDark={isDark} />
  </aside>
);

const DesktopNav: React.FC<{
  isDark: boolean; toggleTheme: () => void; currentDocSlug?: string; toc: TocItem[]; activeId: string; showDocActions: boolean; logoPath: string;
  floatingChrome?: boolean;
}> = ({ isDark, toggleTheme, currentDocSlug, toc, activeId, showDocActions, logoPath, floatingChrome = false }) => {
  const t   = tk(isDark);
  const state = useDesktopNavState();
  const { onResizeMouseDown } = usePanelResize(state.panelWidth, state.setPanelWidth, PANEL_MIN, PANEL_MAX, 1);
  const { onResizeMouseDown: onTocResizeMouseDown } = usePanelResize(state.tocPanelWidth, state.setTocPanelWidth, TOC_PANEL_MIN, TOC_PANEL_MAX, -1);

  const hasToc = toc.length > 0;
  const readingModeEnabled = showDocActions;
  const derived = deriveDesktopNavValues(state, currentDocSlug, readingModeEnabled, isDark, floatingChrome);
  const { isDocsPage, chromeGap, chromeTopGap, chromeRadius, sidebarBg, isStandardMode, panelOpen, sidebarShellWidth, panelTitle } = derived;
  const contentIsDocsPage = Boolean(currentDocSlug);
  const shellEnabled = contentIsDocsPage;
  const panelBg = sidebarBg;

  useEffect(() => {
    try { sessionStorage.setItem('hub:readingMode', state.readingMode); } catch { /* noop */ }
  }, [state.readingMode]);

  useEffect(() => {
    try { sessionStorage.setItem('hub:reading:tocVisible', String(state.standardTocVisible)); } catch { /* noop */ }
  }, [state.standardTocVisible]);

  useEffect(() => {
    if (!contentIsDocsPage) {
      clearDocCssVars();
      document.documentElement.style.setProperty('--nav-left', '0px');
      return () => { document.documentElement.style.removeProperty('--nav-left'); };
    }
    buildCssVars(state.railVisible, contentIsDocsPage, panelOpen, state.panelWidth, isStandardMode, state.standardTocVisible && hasToc, state.tocPanelWidth);
    return () => { document.documentElement.style.removeProperty('--nav-left'); };
  }, [state.railVisible, panelOpen, state.panelWidth, isStandardMode, state.standardTocVisible, contentIsDocsPage, hasToc, state.tocPanelWidth]);

  useEffect(() => { return clearDocCssVars; }, []);

  useEffect(() => {
    if (!hasToc && state.activePanel === 'toc') { state.setActivePanel('nav'); }
  }, [hasToc, state]);

  const handleTogglePanel = useCallback((panel: Exclude<PanelType, null>) => {
    if (isStandardMode) {
      if (state.activePanel === panel && state.standardSidebarOpen) {
        state.setStandardSidebarOpen(false);
      } else {
        state.setStandardSidebarOpen(true);
        state.setActivePanel(panel);
      }
      return;
    }
    state.togglePanel(panel);
  }, [isStandardMode, state]);

  const handlePanelClose = useCallback(() => {
    if (isStandardMode) { state.setStandardSidebarOpen(false); return; }
    state.setActivePanel(null);
  }, [isStandardMode, state]);

  return (
    <>
      <DesktopSidebarShell
        enabled={shellEnabled && state.railVisible} isDocsPage={isDocsPage} chromeGap={chromeGap} chromeTopGap={chromeTopGap}
        chromeRadius={chromeRadius} sidebarShellWidth={sidebarShellWidth} sidebarBg={sidebarBg}
      />

      {state.railVisible && (
        <DesktopRail
          isDark={isDark} toggleTheme={toggleTheme} logoPath={logoPath}
          isDocsPage={isDocsPage} chromeGap={chromeGap} chromeTopGap={chromeTopGap}
          chromeRadius={chromeRadius} panelOpen={panelOpen} shellEnabled={shellEnabled} t={t}
          state={state} derived={derived}
          readingModeEnabled={readingModeEnabled}
          onHideRail={() => state.setRailVisible(false)}
          onOpenSearch={() => state.setSearchOpen(true)}
          onTogglePanel={handleTogglePanel}
          hasToc={hasToc}
        />
      )}

      {!state.railVisible && (
        <ShowPanelBtn chromeGap={chromeGap} chromeTopGap={chromeTopGap} t={t} onClick={() => state.setRailVisible(true)} />
      )}

      {state.railVisible && (
        <DesktopSlidingPanel
          isDocsPage={isDocsPage} chromeGap={chromeGap} chromeTopGap={chromeTopGap}
          chromeRadius={chromeRadius} panelOpen={panelOpen} panelWidth={state.panelWidth}
          panelBg={panelBg} shellEnabled={shellEnabled} panelTitle={panelTitle}
          currentDocSlug={currentDocSlug} toc={toc} activeId={activeId} isDark={isDark}
          onResizeMouseDown={onResizeMouseDown}
          onClose={handlePanelClose}
        />
      )}

      {isStandardMode && hasToc && state.standardTocVisible && (
        <DesktopTocPanel
          isDocsPage={isDocsPage} chromeGap={chromeGap} chromeTopGap={chromeTopGap}
          chromeRadius={chromeRadius} panelBg={panelBg} t={t}
          toc={toc} activeId={activeId} isDark={isDark}
          width={state.tocPanelWidth}
          onResizeMouseDown={onTocResizeMouseDown}
          onHideToc={() => state.setStandardTocVisible(false)}
        />
      )}

      {isStandardMode && hasToc && !state.standardTocVisible && (
        <ShowTocBtn chromeGap={chromeGap} chromeTopGap={chromeTopGap} t={t} onClick={() => state.setStandardTocVisible(true)} />
      )}

      <AnimatePresence>
        {state.searchOpen && (
          <Suspense fallback={null}>
            <LazyUnifiedSearchPanel onClose={() => state.setSearchOpen(false)} />
          </Suspense>
        )}
      </AnimatePresence>
    </>
  );
};

const ShowPanelBtn: React.FC<{
  chromeGap: number; chromeTopGap: number;
  t: ReturnType<typeof tk>; onClick: () => void;
}> = ({ chromeGap, chromeTopGap, t, onClick }) => {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        position: 'fixed', left: chromeGap + 8, top: chromeTopGap + 8, zIndex: 55,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
        width: hov ? 52 : 44, height: hov ? 52 : 44,
        borderRadius: '12px', border: `1px solid ${t.border}`,
        background: t.railBg, color: hov ? t.fg : t.fgMuted, cursor: 'pointer',
        transition: 'width 0.15s, height 0.15s, color 0.15s', overflow: 'hidden',
      }}
      title="Показать панель"
    >
      <PanelLeft size={16} />
      <span style={{ fontSize: '9px', fontWeight: 500, lineHeight: 1.2, textAlign: 'center', letterSpacing: '0.01em', whiteSpace: 'pre-line', maxHeight: hov ? '24px' : '0px', opacity: hov ? 1 : 0, overflow: 'hidden', transition: 'max-height 0.15s, opacity 0.15s' }}>{'Показать\nпанель'}</span>
    </button>
  );
};

const ShowTocBtn: React.FC<{
  chromeGap: number; chromeTopGap: number;
  t: ReturnType<typeof tk>; onClick: () => void;
}> = ({ chromeGap, chromeTopGap, t, onClick }) => {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        position: 'fixed', right: chromeGap + 8, top: chromeTopGap + 8, zIndex: 56,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
        width: hov ? 52 : 44, height: hov ? 52 : 44,
        borderRadius: '12px', border: `1px solid ${t.border}`,
        background: t.panelBg, color: hov ? t.fg : t.fgMuted, cursor: 'pointer',
        transition: 'width 0.15s, height 0.15s, color 0.15s', overflow: 'hidden',
      }}
      title="Показать оглавление"
    >
      <PanelRight size={16} />
      <span style={{ fontSize: '9px', fontWeight: 500, lineHeight: 1.2, textAlign: 'center', letterSpacing: '0.01em', whiteSpace: 'pre-line', maxHeight: hov ? '24px' : '0px', opacity: hov ? 1 : 0, overflow: 'hidden', transition: 'max-height 0.15s, opacity 0.15s' }}>{'Показать\nоглавл.'}</span>
    </button>
  );
};

function tocSectionLabel(count: number): string {
  if (count === 1) return 'раздел';
  if (count < 5)  return 'раздела';
  return 'разделов';
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

  const MOBILE_PANEL_TITLES: Record<string, string> = { nav: 'Навигация', toc: 'Оглавление', contacts: 'Контакты' };

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 62, background: t.panelFullBg, display: 'flex',
      flexDirection: 'column', overflow: 'hidden', animation: 'mobPanelIn 0.22s cubic-bezier(0.4,0,0.2,1)',
      paddingBottom: '60px',
    }}>
      <style>{`@keyframes mobPanelIn{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '52px 20px 16px', borderBottom: `1px solid ${t.border}`, background: t.panelFullBg }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: t.fg, letterSpacing: '-0.01em' }}>{MOBILE_PANEL_TITLES[type]}</span>
          {type === 'toc' && toc.length > 0 && <span style={{ fontSize: '0.8rem', color: t.fgMuted }}>{toc.length} {tocSectionLabel(toc.length)}</span>}
        </div>
        <UnifiedCloseBtn onClick={onClose} isDark={isDark} label="Закрыть" size="md" />
      </div>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {type === 'nav'      && <NavPanelContent isDark={isDark} currentDocSlug={currentDocSlug} mobile />}
        {type === 'toc'      && <TocPanelContent toc={toc} activeId={activeId} isDark={isDark} onItemClick={onClose} mobile />}
        {type === 'contacts' && <div style={{ overflowY: 'auto' }}><ContactsPanelContent isDark={isDark} mobile /></div>}
      </div>
    </div>,
    document.body,
  );
};

const MobBtn: React.FC<{
  label: string; icon: React.ReactNode; isDark: boolean; onClick: () => void; isActive: boolean;
}> = ({ label, icon, isDark, onClick, isActive }) => {
  const t = tk(isDark);
  return (
    <button onClick={onClick}
      style={{ flex: 1, minWidth: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '0 4px', border: 'none', background: 'transparent', cursor: 'pointer', color: isActive ? t.accent : t.fgMuted, outline: 'none' }}>
      <span style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      <span style={{ fontSize: '10px', fontWeight: 400, lineHeight: 1, marginTop: '1px' }}>{label}</span>
    </button>
  );
};

interface MobileLeftButtonsProps {
  readonly isDark: boolean;
  readonly showDocActions: boolean;
  readonly toggleTheme: () => void;
  readonly setSheet: (s: MobileSheet) => void;
  readonly setSearchOpen: (v: boolean) => void;
  readonly sheet: MobileSheet;
}

function MobileLeftButtons({ isDark, showDocActions, toggleTheme, setSheet, setSearchOpen, sheet }: MobileLeftButtonsProps) {
  const themeBtn = <MobBtn label="Тема" icon={isDark ? <Sun size={22} /> : <Moon size={22} />} isDark={isDark} onClick={toggleTheme} isActive={false} />;
  const searchBtn = <MobBtn label="Поиск" icon={<Search size={22} />} isDark={isDark} onClick={() => { setSheet(null); setSearchOpen(true); }} isActive={false} />;
  if (showDocActions) {
    return (
      <>
        {themeBtn}
        {searchBtn}
        <MobBtn label="Разделы" icon={<FolderOpen size={22} />} isDark={isDark} onClick={() => setSheet(sheet === 'nav' ? null : 'nav')} isActive={sheet === 'nav'} />
      </>
    );
  }
  return <>{themeBtn}{searchBtn}</>;
}

interface MobileRightButtonsProps {
  readonly isDark: boolean;
  readonly showDocActions: boolean;
  readonly hasToc: boolean;
  readonly sheet: MobileSheet;
  readonly setSheet: (s: MobileSheet) => void;
  readonly scrollTop: () => void;
}

function MobileRightButtons({ isDark, showDocActions, hasToc, sheet, setSheet, scrollTop }: MobileRightButtonsProps) {
  if (!showDocActions) {
    return (
      <>
        <MobBtn label="Разделы"  icon={<FolderOpen size={22} />} isDark={isDark} onClick={() => setSheet(sheet === 'nav' ? null : 'nav')}           isActive={sheet === 'nav'} />
        <MobBtn label="Контакты" icon={<Mail size={22} />}       isDark={isDark} onClick={() => setSheet(sheet === 'contacts' ? null : 'contacts')} isActive={sheet === 'contacts'} />
      </>
    );
  }
  if (hasToc) {
    return (
      <>
        <MobBtn label="Оглавление" icon={<List size={22} />}    isDark={isDark} onClick={() => setSheet(sheet === 'toc' ? null : 'toc')}           isActive={sheet === 'toc'} />
        <MobBtn label="Наверх"     icon={<ArrowUp size={22} />} isDark={isDark} onClick={scrollTop}                                               isActive={false} />
        <MobBtn label="Контакты"   icon={<Mail size={22} />}    isDark={isDark} onClick={() => setSheet(sheet === 'contacts' ? null : 'contacts')} isActive={sheet === 'contacts'} />
      </>
    );
  }
  return (
    <>
      <MobBtn label="Наверх"   icon={<ArrowUp size={22} />} isDark={isDark} onClick={scrollTop}                                               isActive={false} />
      <MobBtn label="Контакты" icon={<Mail size={22} />}    isDark={isDark} onClick={() => setSheet(sheet === 'contacts' ? null : 'contacts')} isActive={sheet === 'contacts'} />
    </>
  );
}

type MobileSheet = 'nav' | 'toc' | 'contacts' | null;

const MobileNav: React.FC<{
  isDark: boolean; toggleTheme: () => void; currentDocSlug?: string; toc: TocItem[]; activeId: string; showDocActions: boolean; logoPath: string;
}> = ({ isDark, toggleTheme, currentDocSlug, toc, activeId, showDocActions, logoPath }) => {
  const t = tk(isDark);
  const [sheet, setSheet]           = useState<MobileSheet>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const hasToc = toc.length > 0;

  useEffect(() => { if (!hasToc && sheet === 'toc') { setSheet(null); } }, [hasToc, sheet]);

  const scrollTop = () => { setSheet(null); globalThis.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <>
      {sheet && <MobilePanel type={sheet} onClose={() => setSheet(null)} isDark={isDark} currentDocSlug={currentDocSlug} toc={toc} activeId={activeId} />}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 60, height: '60px',
        background: t.mobBg, borderTop: `1px solid ${t.border}`,
        display: 'flex', alignItems: 'stretch',
      }}>
        <div aria-hidden style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 1 }}>
          <BrandLogo logoPath={logoPath} size={48} />
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end' }}>
          <MobileLeftButtons isDark={isDark} showDocActions={showDocActions} toggleTheme={toggleTheme} setSheet={setSheet} setSearchOpen={setSearchOpen} sheet={sheet} />
        </div>
        <div aria-hidden style={{ width: 56, flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', justifyContent: 'flex-start' }}>
          <MobileRightButtons isDark={isDark} showDocActions={showDocActions} hasToc={hasToc} sheet={sheet} setSheet={setSheet} scrollTop={scrollTop} />
        </div>
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

const Navigation: React.FC<NavigationProps> = ({ currentDocSlug, toc = [], activeHeadingId = '', floatingChrome = false }) => {
  const { isDark, toggleTheme } = useTheme();
  const isDesktop = useIsDesktopNav();
  const showDocActions = toc.length > 0 || !!currentDocSlug;
  const [logoConfig, setLogoConfig] = useState<SiteLogoConfig>({});

  useEffect(() => {
    let alive = true;
    const applyLogoConfig = (cfg: SiteLogoConfig) => {
      const next = { lightLogo: cfg.lightLogo || '', darkLogo: cfg.darkLogo || '' };
      [next.lightLogo, next.darkLogo].forEach((src) => {
        if (src) {
          const img = new Image();
          img.src = src;
        }
      });
      if (alive) setLogoConfig(next);
    };
    const onLogoChange = (e: Event) => applyLogoConfig((e as CustomEvent<SiteLogoConfig>).detail || {});
    fetch('/data/site-config.json')
      .then(r => (r.ok ? r.json() : {}))
      .then((cfg: SiteLogoConfig) => applyLogoConfig(cfg))
      .catch(() => { if (alive) setLogoConfig({}); });
    globalThis.addEventListener('hub:logo-change', onLogoChange);
    return () => { alive = false; globalThis.removeEventListener('hub:logo-change', onLogoChange); };
  }, []);

  const logoPath = getThemeLogoPath(logoConfig, isDark);

  if (isDesktop) return <DesktopNav isDark={isDark} toggleTheme={toggleTheme} currentDocSlug={currentDocSlug} toc={toc} activeId={activeHeadingId} showDocActions={showDocActions} logoPath={logoPath} floatingChrome={floatingChrome} />;
  return <MobileNav isDark={isDark} toggleTheme={toggleTheme} currentDocSlug={currentDocSlug} toc={toc} activeId={activeHeadingId} showDocActions={showDocActions} logoPath={logoPath} />;
};

export default Navigation;