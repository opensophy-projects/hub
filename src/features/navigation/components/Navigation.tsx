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
  FolderOpen, List, PanelLeft, ArrowUp,
} from 'lucide-react';

const LazyUnifiedSearchPanel = lazy(() => import('./UnifiedSearchPanel'));

const BREAKPOINT    = 1000;
const RAIL_W        = 64;
const PANEL_DEFAULT = 280;
const PANEL_MIN     = 220;
const PANEL_MAX     = 500;

function useIsDesktop(): boolean {
  const [v, setV] = useState(false);
  useEffect(() => {
    const check = () => setV(globalThis.innerWidth > BREAKPOINT);
    check();
    globalThis.addEventListener('resize', check, { passive: true });
    document.addEventListener('astro:after-swap', check);
    document.addEventListener('astro:page-load', check);
    return () => {
      globalThis.removeEventListener('resize', check);
      document.removeEventListener('astro:after-swap', check);
      document.removeEventListener('astro:page-load', check);
    };
  }, []);
  return v;
}

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

// Цвета для светлой и тёмной темы
const DARK_TOKENS = {
  railBg:      '#0d0d0d',
  panelBg:     '#0d0d0d',
  border:      'rgba(255,255,255,0.08)',
  fg:          'rgba(255,255,255,0.85)',
  fgMuted:     'rgba(255,255,255,0.38)',
  fgSub:       'rgba(255,255,255,0.22)',
  hov:         'rgba(255,255,255,0.05)',
  accent:      '#ffffff',
  accentSoft:  'rgba(255,255,255,0.08)',
  inputBg:     '#1a1a1a',
  inputClr:    '#fff',
  mobBg:       '#0a0a0a',
  overlay:     'rgba(0,0,0,0.7)',
  handle:      'rgba(255,255,255,0.25)',
  handleHov:   'rgba(255,255,255,0.7)',
  panelFullBg: '#0f0f0f',
  surface:     '#141414',
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
  inputBg:     '#cccbc7',
  inputClr:    '#000',
  mobBg:       '#dcdbd7',
  overlay:     'rgba(0,0,0,0.3)',
  handle:      'rgba(0,0,0,0.25)',
  handleHov:   'rgba(0,0,0,0.7)',
  panelFullBg: '#E0DFDb',
  surface:     '#d5d4d0',
} as const;

function tk(isDark: boolean) {
  return isDark ? DARK_TOKENS : LIGHT_TOKENS;
}

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

const DocLink: React.FC<{ doc: Doc; isDark: boolean; isActive: boolean; onClick?: () => void; mobile?: boolean }> = memo(({ doc, isDark, isActive, onClick, mobile }) => {
  const t = tk(isDark);
  return (
    <a href={`/${doc.slug}`} onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: mobile ? '10px 14px' : '5px 10px',
      borderRadius: '8px',
      fontSize: mobile ? '1rem' : '0.875rem',
      textDecoration: 'none',
      borderLeft: `2px solid ${isActive ? t.accent : 'transparent'}`,
      color: isActive ? t.accent : t.fg,
      fontWeight: isActive ? 600 : 400,
      background: isActive ? t.accentSoft : 'transparent',
      lineHeight: 1.4,
    }}>
      {doc.icon && <span style={{ flexShrink: 0, width: 15, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.fgMuted }}><LucideIcon name={doc.icon} size={14} /></span>}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35 }}>{doc.title}</span>
    </a>
  );
});

// ─── CategoryNode ─────────────────────────────────────────────────────────────

const CategoryNode: React.FC<{
  node: NavNode; path: string; expandedPaths: Set<string>;
  onToggle: (p: string) => void; isDark: boolean; currentDocSlug?: string; onDocClick?: () => void; mobile?: boolean;
}> = memo(({ node, path, expandedPaths, onToggle, isDark, currentDocSlug, onDocClick, mobile }) => {
  const t = tk(isDark);
  const expanded = expandedPaths.has(path);
  const total    = countDocs(node);
  return (
    <div>
      <button onClick={() => onToggle(path)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: mobile ? '10px 14px' : '6px 10px',
        borderRadius: '8px',
        fontSize: mobile ? '1rem' : '0.875rem',
        fontWeight: 600,
        border: 'none', background: 'transparent', color: t.fg, cursor: 'pointer', textAlign: 'left',
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
        <div style={{ marginLeft: '0.85rem', borderLeft: `1px solid ${t.border}`, paddingLeft: '0.5rem' }}>
          {[...node.docs].sort((a, b) => a.title.localeCompare(b.title)).map(doc => (
            <DocLink key={doc.id} doc={doc} isDark={isDark} isActive={currentDocSlug === doc.slug} onClick={onDocClick} mobile={mobile} />
          ))}
          {Object.entries(node.children).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => (
            <CategoryNode key={key} node={child} path={`${path}/${key}`} expandedPaths={expandedPaths} onToggle={onToggle} isDark={isDark} currentDocSlug={currentDocSlug} onDocClick={onDocClick} mobile={mobile} />
          ))}
        </div>
      )}
    </div>
  );
});

// ─── Хук: секции навигации из манифеста ──────────────────────────────────────

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

// ─── Хук: активный раздел по текущему URL ────────────────────────────────────

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

// ─── Хук: раскрытые пути по текущему документу ───────────────────────────────

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

// ─── Дропдаун выбора раздела навигации ───────────────────────────────────────

const SectionDropdown: React.FC<{
  sections: NavSection[]; activeNavSlug: string; mobile: boolean; isDark: boolean;
  onSelect: (slug: string) => void;
}> = ({ sections, activeNavSlug, mobile, isDark, onSelect }) => {
  const t = tk(isDark);
  return (
    <>
      {sections.map(s => (
        <button key={s.navSlug} onClick={() => onSelect(s.navSlug)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: mobile ? '0.7rem 1rem' : '0.55rem 0.75rem',
            fontSize: mobile ? '1rem' : '0.875rem',
            border: 'none', cursor: 'pointer', textAlign: 'left',
            background: s.navSlug === activeNavSlug ? t.accentSoft : 'transparent',
            color:      s.navSlug === activeNavSlug ? t.accent    : t.fg,
            fontWeight: s.navSlug === activeNavSlug ? 600         : 400,
          }}>
          {s.navSlug === '' ? <Home size={mobile ? 15 : 13} style={{ color: t.fgMuted }} /> : <LucideIcon name={s.navIcon} size={mobile ? 15 : 13} />}
          <span>{s.navTitle}</span>
        </button>
      ))}
    </>
  );
};

// ─── Дерево документов (с состояниями загрузки и ошибки) ─────────────────────

const NavTreeContent: React.FC<{
  error: boolean; loading: boolean; navTree: NavNode;
  currentDocSlug: string | undefined; expandedPaths: Set<string>;
  onToggle: (p: string) => void; isDark: boolean; mobile: boolean | undefined;
}> = ({ error, loading, navTree, currentDocSlug, expandedPaths, onToggle, isDark, mobile }) => {
  const t = tk(isDark);
  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '2rem', textAlign: 'center' }}>
      <AlertTriangle size={22} style={{ color: 'rgba(251,191,36,0.7)' }} />
      <p style={{ margin: 0, fontSize: mobile ? '0.95rem' : '0.8rem', color: t.fgMuted }}>Не удалось загрузить документы</p>
      <button onClick={() => globalThis.location.reload()} style={{ padding: '0.35rem 0.85rem', borderRadius: '7px', border: `1px solid ${t.border}`, background: 'transparent', color: t.fgMuted, fontSize: mobile ? '0.9rem' : '0.75rem', cursor: 'pointer' }}>Обновить</button>
    </div>
  );
  if (loading) return (
    <div style={{ padding: '2rem', textAlign: 'center', fontSize: mobile ? '0.95rem' : '0.8rem', color: t.fgMuted }}>Загрузка...</div>
  );
  return (
    <nav>
      {navTree.docs.length > 0 && (
        <div style={{ marginBottom: '6px' }}>
          {[...navTree.docs].sort((a, b) => a.title.localeCompare(b.title)).map(doc => (
            <DocLink key={doc.id} doc={doc} isDark={isDark} isActive={currentDocSlug === doc.slug} mobile={mobile} />
          ))}
        </div>
      )}
      {Object.entries(navTree.children).sort(([a], [b]) => a.localeCompare(b)).map(([key, node]) => (
        <CategoryNode key={key} node={node} path={key} expandedPaths={expandedPaths} onToggle={onToggle} isDark={isDark} currentDocSlug={currentDocSlug} mobile={mobile} />
      ))}
    </nav>
  );
};

// ─── NavPanelContent ─────────────────────────────────────────────────────────

const NavPanelContent: React.FC<{
  isDark: boolean; currentDocSlug?: string; onOpenSearch: () => void; mobile?: boolean;
}> = ({ isDark, currentDocSlug, onOpenSearch: _onOpenSearch, mobile }) => {
  const t = tk(isDark);
  const { manifest: docs, loading, error } = useManifest();
  const [query, setQuery]                 = useState('');
  const [sectionOpen, setSectionOpen]     = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const sections                          = useNavSections(docs as Doc[]);
  const [activeNavSlug, setActiveNavSlug] = useActiveNavSlug(sections);
  const [expandedPaths, setExpandedPaths] = useExpandedPaths(currentDocSlug, activeNavSlug);

  // Закрытие дропдауна по клику вне
  useEffect(() => {
    if (!sectionOpen) return;
    const h = (e: MouseEvent) => {
      if (sectionRef.current && !sectionRef.current.contains(e.target as Node)) setSectionOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [sectionOpen]);

  const navTree       = useMemo(() => buildTree(docs as Doc[], query, activeNavSlug), [docs, query, activeNavSlug]);
  const activeSection = sections.find(s => s.navSlug === activeNavSlug) ?? sections[0];

  const togglePath = (path: string) => setExpandedPaths(prev => {
    const n = new Set(prev);
    n.has(path) ? n.delete(path) : n.add(path);
    return n;
  });

  const handleSectionSelect = (slug: string) => {
    storageSet('hub:activeNavSlug', slug);
    setActiveNavSlug(slug);
    setExpandedPaths(new Set());
    setSectionOpen(false);
  };

  const inputFontSize = mobile ? '1rem' : '0.855rem';
  const inputPadding  = mobile ? '0.6rem 0.6rem 0.6rem 2.4rem' : '0.45rem 0.5rem 0.45rem 2.1rem';
  const iconSize      = mobile ? 15 : 13;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ flexShrink: 0, padding: mobile ? '12px 14px' : '10px', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ position: 'relative' }}>
          <Search size={iconSize} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: t.fgSub, pointerEvents: 'none' }} />
          <input
            type="text" placeholder="Фильтр по названию..." value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              width: '100%', padding: inputPadding,
              borderRadius: '8px', fontSize: inputFontSize,
              border: `1px solid ${t.border}`,
              background: 'transparent', color: t.fg,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {sections.length > 1 && activeSection && (
        <div style={{ flexShrink: 0, padding: mobile ? '10px 14px' : '8px 10px', borderBottom: `1px solid ${t.border}`, position: 'relative' }} ref={sectionRef}>
          <button onClick={() => setSectionOpen(v => !v)} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: mobile ? '0.55rem 0.85rem' : '0.4rem 0.65rem',
            borderRadius: '8px', fontSize: mobile ? '1rem' : '0.875rem',
            border: `1px solid ${t.border}`, background: 'transparent', color: t.fg, cursor: 'pointer',
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
              position: 'absolute', left: mobile ? '14px' : '10px', right: mobile ? '14px' : '10px', top: 'calc(100% - 2px)',
              borderRadius: '10px', border: `1px solid ${t.border}`, background: t.panelBg,
              zIndex: 100, overflow: 'hidden',
            }}>
              <SectionDropdown
                sections={sections} activeNavSlug={activeNavSlug}
                mobile={!!mobile} isDark={isDark} onSelect={handleSectionSelect}
              />
            </div>
          )}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: mobile ? '8px 6px' : '6px' }}>
        <NavTreeContent
          error={!!error} loading={loading} navTree={navTree}
          currentDocSlug={currentDocSlug} expandedPaths={expandedPaths}
          onToggle={togglePath} isDark={isDark} mobile={mobile}
        />
      </div>
    </div>
  );
};

// ─── Вычисление стилей элемента оглавления по активности ────────────────────

function getTocItemStyle(item: TocItem, dist: number, activeId: string, isDark: boolean, mobile: boolean) {
  const t         = tk(isDark);
  const isActive  = item.id === activeId && activeId !== '';
  const hasActive = activeId !== '';

  const opacity = hasActive ? (isActive ? 1 : Math.max(0.32, 0.82 - dist * 0.18)) : 0.65;
  const glowOp  = hasActive ? (isActive ? 1 : Math.max(0, 0.5 - dist * 0.16)) : 0;

  let borderClr: string;
  if (isActive)        borderClr = t.accent;
  else if (glowOp > 0) borderClr = isDark ? `rgba(255,255,255,${glowOp})` : `rgba(0,0,0,${glowOp})`;
  else                 borderClr = 'transparent';

  const glowShadowDark  = `inset 3px 0 8px -3px rgba(255,255,255,${glowOp * 0.35})`;
  const glowShadowLight = `inset 3px 0 8px -3px rgba(0,0,0,${glowOp * 0.35})`;
  let shadow: string;
  if (isActive)        shadow = `inset 3px 0 10px -2px ${t.accent}88`;
  else if (glowOp > 0) shadow = isDark ? glowShadowDark : glowShadowLight;
  else                 shadow = 'none';

  const baseFontSize = mobile ? 1 : 0.82;
  const fontSizeStep = mobile ? 0.05 : 0.04;
  const fontSize     = `${baseFontSize - (item.level - 2) * fontSizeStep}rem`;
  const paddingLeft  = mobile
    ? 14 + (item.level - 2) * 18
    : 12 + (item.level - 2) * 14;

  let color: string;
  if (isActive) color = t.accent;
  else          color = isDark ? `rgba(255,255,255,${opacity})` : `rgba(0,0,0,${opacity})`;

  return { isActive, hasActive, borderClr, shadow, fontSize, paddingLeft, color };
}

// ─── TocPanelContent ──────────────────────────────────────────────────────────

const TocPanelContent: React.FC<{
  toc: TocItem[]; activeId: string; isDark: boolean; onItemClick?: () => void; mobile?: boolean;
}> = ({ toc, activeId, isDark, onItemClick, mobile = false }) => {
  const t = tk(isDark);
  if (!toc.length) return (
    <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', fontSize: mobile ? '1rem' : '0.85rem', color: t.fgMuted }}>
      На этой странице нет заголовков
    </div>
  );

  const activeIndex = toc.findIndex(i => i.id === activeId);

  return (
    <nav style={{ padding: mobile ? '8px 6px' : '6px 4px' }}>
      {toc.map((item, index) => {
        const dist  = Math.abs(index - activeIndex);
        const style = getTocItemStyle(item, dist, activeId, isDark, mobile);
        const bg    = style.isActive ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)') : 'transparent';
        const fw    = style.isActive ? 600 : item.level === 2 ? 500 : 400;

        return (
          <button key={item.id} onClick={() => { scrollToElement(item.id); onItemClick?.(); }}
            style={{
              width: '100%', textAlign: 'left',
              paddingTop:    mobile ? '0.55rem' : '0.38rem',
              paddingBottom: mobile ? '0.55rem' : '0.38rem',
              paddingRight:  mobile ? '1rem'    : '0.75rem',
              paddingLeft:   `${style.paddingLeft}px`,
              fontSize:      style.fontSize,
              lineHeight:    1.45,
              background:    bg,
              border:        'none', cursor: 'pointer',
              borderLeft:    '2px solid', borderLeftColor: style.borderClr,
              boxShadow:     style.shadow,
              borderRadius:  '0 8px 8px 0',
              color:         style.color,
              fontWeight:    fw,
              textShadow:    style.isActive ? `0 0 12px ${t.accent}55` : 'none',
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
          style={{
            display: 'flex', flexDirection: 'column',
            padding: mobile ? '14px 16px' : '10px',
            borderRadius: '10px', textDecoration: 'none', color: t.fg,
            fontSize: mobile ? '1rem' : '0.875rem', gap: '3px',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = t.hov; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <div style={{ fontWeight: 600 }}>{c.title}</div>
          <div style={{ fontSize: mobile ? '0.875rem' : '0.75rem', color: t.fgMuted }}>{c.subtitle}</div>
        </a>
      ))}
    </div>
  );
};

// ─── Desktop Panel Header ─────────────────────────────────────────────────────

const PanelHeader: React.FC<{ title: string; isDark: boolean; onClose: () => void }> = ({ title, isDark, onClose }) => {
  const t = tk(isDark);
  return (
    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 12px 9px', borderBottom: `1px solid ${t.border}` }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.fgMuted }}>{title}</span>
      <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '6px', border: 'none', background: 'transparent', color: t.fgMuted, cursor: 'pointer' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = t.fg; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = t.fgMuted; }}>
        <X size={13} />
      </button>
    </div>
  );
};

// ─── RailBtn ──────────────────────────────────────────────────────────────────

const RailBtn: React.FC<{
  icon: React.ReactNode; label: string;
  isActive?: boolean; isDark: boolean; onClick: () => void; title?: string;
}> = ({ icon, label, isActive, isDark, onClick, title }) => {
  const t   = tk(isDark);
  const [hov, setHov] = useState(false);
  let btnColor: string;
  if (isActive) btnColor = t.accent;
  else if (hov) btnColor = t.fg;
  else          btnColor = t.fgMuted;
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: RAIL_W, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '4px', padding: '10px 4px', border: 'none', background: 'transparent',
        color: btnColor,
        cursor: 'pointer', borderRadius: '10px', flexShrink: 0,
      }}>
      <span style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      <span style={{ fontSize: '9px', fontWeight: 400, lineHeight: 1, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  );
};

// ─── DESKTOP NAV ──────────────────────────────────────────────────────────────

const DesktopNav: React.FC<{
  isDark: boolean; toggleTheme: () => void; currentDocSlug?: string; toc: TocItem[]; activeId: string;
}> = ({ isDark, toggleTheme, currentDocSlug, toc, activeId }) => {
  const t = tk(isDark);
  const [railVisible, setRailVisible] = useState(true);

  const [activePanel, setActivePanel] = useState<PanelType>(() => {
    try {
      const s = sessionStorage.getItem('hub:activePanel');
      if (s === 'nav' || s === 'toc' || s === 'contacts') return s as PanelType;
    } catch {}
    return null;
  });

  const [panelWidth, setPanelWidth] = useState<number>(() => {
    try {
      const w = Number(sessionStorage.getItem('hub:panelWidth'));
      if (w >= PANEL_MIN && w <= PANEL_MAX) return w;
    } catch {}
    return PANEL_DEFAULT;
  });

  // Синхронизация CSS-переменной при первом рендере
  useEffect(() => {
    try {
      const panel    = sessionStorage.getItem('hub:activePanel');
      const hasPanel = panel === 'nav' || panel === 'toc' || panel === 'contacts';
      const w        = Number(sessionStorage.getItem('hub:panelWidth'));
      const pw       = (w >= PANEL_MIN && w <= PANEL_MAX) ? w : PANEL_DEFAULT;
      const left     = RAIL_W + (hasPanel ? pw : 0);
      document.documentElement.style.setProperty('--nav-left', `${left}px`);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [searchOpen, setSearchOpen]   = useState(false);
  const [handleHov, setHandleHov]     = useState(false);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartW = useRef(0);

  const togglePanel = useCallback((panel: PanelType) => {
    setActivePanel(prev => {
      const next = prev === panel ? null : panel;
      try { sessionStorage.setItem('hub:activePanel', next ?? ''); } catch {}
      return next;
    });
  }, []);

  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartW.current = panelWidth;
    document.body.style.cursor     = 'col-resize';
    document.body.style.userSelect = 'none';
    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      setPanelWidth(Math.max(PANEL_MIN, Math.min(PANEL_MAX, dragStartW.current + ev.clientX - dragStartX.current)));
    };
    const onUp = () => {
      isDragging.current             = false;
      document.body.style.cursor     = '';
      document.body.style.userSelect = '';
      globalThis.removeEventListener('mousemove', onMove);
      globalThis.removeEventListener('mouseup', onUp);
    };
    globalThis.addEventListener('mousemove', onMove);
    globalThis.addEventListener('mouseup', onUp);
  }, [panelWidth]);

  // Сохранение активной панели в сессии
  useEffect(() => {
    try { sessionStorage.setItem('hub:activePanel', activePanel ?? ''); } catch {}
  }, [activePanel]);

  // Сохранение ширины панели в сессии
  useEffect(() => {
    try { sessionStorage.setItem('hub:panelWidth', String(panelWidth)); } catch {}
  }, [panelWidth]);

  // Обновление CSS-переменной отступа контента
  useEffect(() => {
    const left = (railVisible ? RAIL_W : 0) + (activePanel ? panelWidth : 0);
    document.documentElement.style.setProperty('--nav-left', `${left}px`);
    return () => { document.documentElement.style.removeProperty('--nav-left'); };
  }, [railVisible, activePanel, panelWidth]);

  const panelTitles: Record<Exclude<PanelType, null>, string> = { nav: 'Навигация', toc: 'Оглавление', contacts: 'Контакты' };

  return (
    <>
      {railVisible && (
        <aside style={{
          position: 'fixed', left: 0, top: 0, height: '100vh', width: RAIL_W,
          background: t.railBg, borderRight: `1px solid ${t.border}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          zIndex: 50, padding: '8px 0', gap: '2px',
        }}>
          <div style={{ width: RAIL_W, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src="/favicon.png" alt="hub" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flex: 1, width: '100%' }}>
            <RailBtn icon={<PanelLeft size={18} />}                                 label="Панель"      isDark={isDark} onClick={() => setRailVisible(false)}                                              title="Скрыть" />
            <RailBtn icon={isDark ? <Sun size={18} /> : <Moon size={18} />}         label="Тема"        isDark={isDark} onClick={toggleTheme}                                                              title={isDark ? 'Светлая' : 'Тёмная'} />
            <RailBtn icon={<Search size={18} />}                                    label="Поиск"       isDark={isDark} onClick={() => setSearchOpen(true)}                                                title="Поиск" />
            <RailBtn icon={<FolderOpen size={18} />}                                label="Разделы"     isDark={isDark} isActive={activePanel === 'nav'}      onClick={() => togglePanel('nav')}      title="Разделы" />
            <RailBtn icon={<List size={18} />}                                      label="Оглавление"  isDark={isDark} isActive={activePanel === 'toc'}      onClick={() => togglePanel('toc')}      title="Оглавление" />
            <RailBtn icon={<ArrowUp size={18} />}                                   label="Наверх"      isDark={isDark} onClick={() => globalThis.scrollTo({ top: 0, behavior: 'smooth' })}               title="Наверх" />
            <RailBtn icon={<Mail size={18} />}                                      label="Контакты"    isDark={isDark} isActive={activePanel === 'contacts'} onClick={() => togglePanel('contacts')} title="Контакты" />
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
          background: t.panelBg,
          borderRight: activePanel ? `1px solid ${t.border}` : 'none',
          display: 'flex', flexDirection: 'column', zIndex: 49,
          overflow: 'hidden',
          pointerEvents: activePanel ? 'auto' : 'none',
          visibility: activePanel ? 'visible' : 'hidden',
        }}>
          {activePanel && (
            <>
              <PanelHeader title={panelTitles[activePanel]} isDark={isDark} onClose={() => setActivePanel(null)} />
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {activePanel === 'nav'      && <NavPanelContent isDark={isDark} currentDocSlug={currentDocSlug} onOpenSearch={() => setSearchOpen(true)} />}
                {activePanel === 'toc'      && <div style={{ flex: 1, overflowY: 'auto' }}><TocPanelContent toc={toc} activeId={activeId} isDark={isDark} /></div>}
                {activePanel === 'contacts' && <div style={{ overflowY: 'auto' }}><ContactsPanelContent isDark={isDark} /></div>}
              </div>
            </>
          )}
          {activePanel && (
            // Ручка изменения ширины панели — нативная кнопка для доступности
            <button
              onMouseDown={onResizeMouseDown}
              onMouseEnter={() => setHandleHov(true)}
              onMouseLeave={() => setHandleHov(false)}
              aria-label="Изменить ширину панели"
              style={{
                position: 'absolute', right: 0, top: 0, bottom: 0, width: '8px',
                cursor: 'col-resize', zIndex: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: 'none', padding: 0,
              }}
            >
              <div style={{ width: '3px', height: '56px', borderRadius: '3px', background: handleHov ? t.handleHov : t.handle, pointerEvents: 'none' }} />
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

// Склонение слова "раздел" по количеству
function tocSectionLabel(count: number): string {
  if (count === 1)   return 'раздел';
  if (count < 5)     return 'раздела';
  return 'разделов';
}

// ─── Mobile full-screen panel ─────────────────────────────────────────────────

const MobilePanel: React.FC<{
  type: 'nav' | 'toc' | 'contacts';
  onClose: () => void;
  isDark: boolean;
  currentDocSlug?: string;
  toc: TocItem[];
  activeId: string;
}> = ({ type, onClose, isDark, currentDocSlug, toc, activeId }) => {
  const t = tk(isDark);

  // Блокировка скролла страницы и закрытие по Escape
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
      background: t.panelFullBg,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      animation: 'mobPanelIn 0.22s cubic-bezier(0.4,0,0.2,1)',
      paddingBottom: '60px',
    }}>
      <style>{`@keyframes mobPanelIn{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>

      {/* Шапка панели */}
      <div style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '52px 20px 16px',
        borderBottom: `1px solid ${t.border}`,
        background: t.panelFullBg,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{
            fontSize: '1.25rem', fontWeight: 700,
            color: t.fg,
            letterSpacing: '-0.01em',
          }}>
            {PANEL_TITLES[type]}
          </span>
          {type === 'toc' && toc.length > 0 && (
            <span style={{ fontSize: '0.8rem', color: t.fgMuted }}>
              {toc.length} {tocSectionLabel(toc.length)}
            </span>
          )}
        </div>
        <button onClick={onClose}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: '10px',
            border: `1px solid ${t.border}`,
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            color: t.fg, cursor: 'pointer',
            flexShrink: 0,
          }}>
          <X size={16} />
        </button>
      </div>

      {/* Контент панели */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {type === 'nav'      && <NavPanelContent isDark={isDark} currentDocSlug={currentDocSlug} onOpenSearch={() => {}} mobile />}
        {type === 'toc'      && <div style={{ flex: 1, overflowY: 'auto' }}><TocPanelContent toc={toc} activeId={activeId} isDark={isDark} onItemClick={onClose} mobile /></div>}
        {type === 'contacts' && <div style={{ overflowY: 'auto' }}><ContactsPanelContent isDark={isDark} mobile /></div>}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

// ─── MobBtn ───────────────────────────────────────────────────────────────────

const MobBtn: React.FC<{
  label: string; icon: React.ReactNode; isDark: boolean; onClick: () => void; isActive: boolean;
}> = ({ label, icon, isDark, onClick, isActive }) => {
  const t = tk(isDark);
  return (
    <button onClick={onClick}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '4px', padding: '0', border: 'none', background: 'transparent',
        cursor: 'pointer', color: isActive ? t.accent : t.fgMuted,
        outline: 'none', minWidth: 0,
      }}>
      <span style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      <span style={{ fontSize: '10px', fontWeight: 400, lineHeight: 1, marginTop: '1px' }}>{label}</span>
    </button>
  );
};

// ─── MOBILE NAV ───────────────────────────────────────────────────────────────

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
      {sheet && (
        <MobilePanel
          type={sheet}
          onClose={() => setSheet(null)}
          isDark={isDark}
          currentDocSlug={currentDocSlug}
          toc={toc}
          activeId={activeId}
        />
      )}

      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 60,
        height: '60px',
        background: t.mobBg,
        borderTop: `1px solid ${t.border}`,
        display: 'flex', alignItems: 'stretch',
      }}>
        <MobBtn label="Тема"        icon={isDark ? <Sun size={22} /> : <Moon size={22} />} isDark={isDark} onClick={toggleTheme}                                                      isActive={false} />
        <MobBtn label="Поиск"       icon={<Search size={22} />}                            isDark={isDark} onClick={() => { setSheet(null); setSearchOpen(true); }}                   isActive={false} />
        <MobBtn label="Разделы"     icon={<FolderOpen size={22} />}                        isDark={isDark} onClick={() => toggle('nav')}                                              isActive={sheet === 'nav'} />

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/favicon.png" alt="hub" style={{ width: 38, height: 38, objectFit: 'contain' }} />
        </div>

        <MobBtn label="Оглавление"  icon={<List size={22} />}                              isDark={isDark} onClick={() => toggle('toc')}                                              isActive={sheet === 'toc'} />
        <MobBtn label="Наверх"      icon={<ArrowUp size={22} />}                           isDark={isDark} onClick={() => { setSheet(null); globalThis.scrollTo({ top: 0, behavior: 'smooth' }); }} isActive={false} />
        <MobBtn label="Контакты"    icon={<Mail size={22} />}                              isDark={isDark} onClick={() => toggle('contacts')}                                         isActive={sheet === 'contacts'} />
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
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return <DesktopNav isDark={isDark} toggleTheme={toggleTheme} currentDocSlug={currentDocSlug} toc={toc} activeId={activeHeadingId} />;
  }
  return <MobileNav isDark={isDark} toggleTheme={toggleTheme} currentDocSlug={currentDocSlug} toc={toc} activeId={activeHeadingId} />;
};

export default Navigation;