/**
 * Navigation.tsx
 *
 * Desktop (>1000px): Rail 64px + slide-out panel + resize handle
 * Mobile (≤1000px):  Bottom bar centered + full-screen panels (like search)
 *
 * Mobile buttons (centered, no Панель):
 *   {Тема}  Поиск  Разделы  [Лого]  Оглавление  Наверх  {Контакты}
 *
 * {} = hidden under fade, visible when scrolling left/right
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
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search, Sun, Moon, ChevronDown, ChevronRight,
  Mail, X, Home, AlertTriangle,
  FolderOpen, List, PanelLeft, ArrowUp,
} from 'lucide-react';

const LazyUnifiedSearchPanel = lazy(() => import('./UnifiedSearchPanel'));

// ─── Constants ────────────────────────────────────────────────────────────────

const BREAKPOINT    = 1000;
const RAIL_W        = 64;
const PANEL_DEFAULT = 280;
const PANEL_MIN     = 220;
const PANEL_MAX     = 500;

// ─── useIsDesktop ─────────────────────────────────────────────────────────────

function useIsDesktop(): boolean {
  const [v, setV] = useState(false);
  useEffect(() => {
    const check = () => setV(window.innerWidth > BREAKPOINT);
    check();
    window.addEventListener('resize', check, { passive: true });
    document.addEventListener('astro:after-swap', check);
    document.addEventListener('astro:page-load', check);
    return () => {
      window.removeEventListener('resize', check);
      document.removeEventListener('astro:after-swap', check);
      document.removeEventListener('astro:page-load', check);
    };
  }, []);
  return v;
}

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Design tokens ────────────────────────────────────────────────────────────

function tk(isDark: boolean) {
  return {
    railBg:     isDark ? '#0d0d0d'                 : '#E0DFDb',
    panelBg:    isDark ? '#0d0d0d'                 : '#E0DFDb',
    border:     isDark ? 'rgba(255,255,255,0.08)'  : 'rgba(0,0,0,0.08)',
    fg:         isDark ? 'rgba(255,255,255,0.85)'  : 'rgba(0,0,0,0.85)',
    fgMuted:    isDark ? 'rgba(255,255,255,0.38)'  : 'rgba(0,0,0,0.38)',
    fgSub:      isDark ? 'rgba(255,255,255,0.22)'  : 'rgba(0,0,0,0.22)',
    hov:        isDark ? 'rgba(255,255,255,0.05)'  : 'rgba(0,0,0,0.04)',
    accent:     isDark ? '#ffffff'                 : '#000000',
    accentSoft: isDark ? 'rgba(255,255,255,0.08)'  : 'rgba(0,0,0,0.07)',
    inputBg:    isDark ? '#1a1a1a'                 : '#cccbc7',
    inputClr:   isDark ? '#fff'                    : '#000',
    // Мобильный бар — строго непрозрачный, без артефактов при смене темы
    mobBg:      isDark ? '#0a0a0a'                 : '#dcdbd7',
    overlay:    isDark ? 'rgba(0,0,0,0.7)'         : 'rgba(0,0,0,0.3)',
    handle:     isDark ? 'rgba(255,255,255,0.25)'  : 'rgba(0,0,0,0.25)',
    handleHov:  isDark ? 'rgba(255,255,255,0.7)'   : 'rgba(0,0,0,0.7)',
    // Панели (полноэкранные на мобиле)
    panelFullBg: isDark ? '#0f0f0f'                : '#E0DFDb',
    surface:     isDark ? '#141414'                : '#d5d4d0',
  };
}

// ─── LucideIcon lazy ─────────────────────────────────────────────────────────

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

// ─── Nav tree ─────────────────────────────────────────────────────────────────

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

const DocLink: React.FC<{ doc: Doc; isDark: boolean; isActive: boolean; onClick?: () => void }> = memo(({ doc, isDark, isActive, onClick }) => {
  const t = tk(isDark);
  return (
    <a href={`/${doc.slug}`} onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '0.4rem',
      padding: '5px 10px', borderRadius: '7px', fontSize: '0.875rem',
      textDecoration: 'none',
      borderLeft: `2px solid ${isActive ? t.accent : 'transparent'}`,
      color: isActive ? t.accent : t.fg,
      fontWeight: 400,
      background: isActive ? t.accentSoft : 'transparent',
    }}>
      {doc.icon && <span style={{ flexShrink: 0, width: 13, height: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.fgMuted }}><LucideIcon name={doc.icon} size={12} /></span>}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.3 }}>{doc.title}</span>
    </a>
  );
});

// ─── CategoryNode ─────────────────────────────────────────────────────────────

const CategoryNode: React.FC<{
  node: NavNode; path: string; expandedPaths: Set<string>;
  onToggle: (p: string) => void; isDark: boolean; currentDocSlug?: string; onDocClick?: () => void;
}> = memo(({ node, path, expandedPaths, onToggle, isDark, currentDocSlug, onDocClick }) => {
  const t = tk(isDark);
  const expanded = expandedPaths.has(path);
  const total    = countDocs(node);
  return (
    <div>
      <button onClick={() => onToggle(path)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 10px', borderRadius: '7px', fontSize: '0.875rem', fontWeight: 600,
        border: 'none', background: 'transparent', color: t.fg, cursor: 'pointer', textAlign: 'left',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 13, height: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: t.fgMuted }}>
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </span>
          {node.icon && <span style={{ width: 13, height: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: t.fgMuted }}><LucideIcon name={node.icon} size={12} /></span>}
          <span style={{ wordBreak: 'break-word', lineHeight: 1.3 }}>{node.title}</span>
        </div>
        {total > 0 && <span style={{ fontSize: '0.67rem', padding: '1px 6px', borderRadius: '4px', background: t.accentSoft, color: t.fgMuted }}>{total}</span>}
      </button>
      {expanded && (
        <div style={{ marginLeft: '0.75rem', borderLeft: `1px solid ${t.border}`, paddingLeft: '0.4rem' }}>
          {[...node.docs].sort((a, b) => a.title.localeCompare(b.title)).map(doc => (
            <DocLink key={doc.id} doc={doc} isDark={isDark} isActive={currentDocSlug === doc.slug} onClick={onDocClick} />
          ))}
          {Object.entries(node.children).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => (
            <CategoryNode key={key} node={child} path={`${path}/${key}`} expandedPaths={expandedPaths} onToggle={onToggle} isDark={isDark} currentDocSlug={currentDocSlug} onDocClick={onDocClick} />
          ))}
        </div>
      )}
    </div>
  );
});

// ─── NavPanelContent (shared desktop+mobile) ─────────────────────────────────

const NavPanelContent: React.FC<{
  isDark: boolean; currentDocSlug?: string; onOpenSearch: () => void;
}> = ({ isDark, currentDocSlug, onOpenSearch }) => {
  const t = tk(isDark);
  const { manifest: docs, loading, error } = useManifest();
  const [query, setQuery]                 = useState('');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [activeNavSlug, setActiveNavSlug] = useState('');
  const [sectionOpen, setSectionOpen]     = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const sections = useMemo<NavSection[]>(() => {
    const map = new Map<string, NavSection>();
    map.set('', { navSlug: '', navTitle: 'Главная', navIcon: 'home' });
    for (const doc of docs as Doc[]) {
      const slug = doc.navSlug ?? '';
      if (slug && !map.has(slug)) map.set(slug, { navSlug: slug, navTitle: doc.navTitle ?? slug, navIcon: doc.navIcon ?? '' });
    }
    return Array.from(map.values());
  }, [docs]);

  useEffect(() => {
    if (!sections.length) return;
    const pathname = window.location.pathname.replace(/^\//, '');
    const matched  = sections.filter(s => s.navSlug).find(s => pathname === s.navSlug || pathname.startsWith(s.navSlug + '/'));
    startTransition(() => setActiveNavSlug(matched?.navSlug ?? ''));
  }, [sections]);

  useEffect(() => {
    if (!currentDocSlug) return;
    let slug = currentDocSlug;
    if (activeNavSlug && slug.startsWith(activeNavSlug + '/')) slug = slug.slice(activeNavSlug.length + 1);
    const parts     = slug.split('/');
    const pathParts = parts.slice(0, -1).map((_, i) => parts.slice(0, i + 1).join('/'));
    if (pathParts.length) startTransition(() => setExpandedPaths(new Set(pathParts)));
  }, [currentDocSlug, activeNavSlug]);

  useEffect(() => {
    if (!sectionOpen) return;
    const h = (e: MouseEvent) => { if (sectionRef.current && !sectionRef.current.contains(e.target as Node)) setSectionOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [sectionOpen]);

  const navTree       = useMemo(() => buildTree(docs as Doc[], query, activeNavSlug), [docs, query, activeNavSlug]);
  const activeSection = sections.find(s => s.navSlug === activeNavSlug) ?? sections[0];
  const togglePath    = (path: string) => setExpandedPaths(prev => { const n = new Set(prev); n.has(path) ? n.delete(path) : n.add(path); return n; });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Поиск — прозрачный фон как у navpopover */}
      <div style={{ flexShrink: 0, padding: '10px', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: t.fgSub, pointerEvents: 'none' }} />
          <input
            type="text" placeholder="Фильтр по названию..." value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              width: '100%', paddingLeft: '2.1rem', paddingRight: '0.5rem',
              paddingTop: '0.45rem', paddingBottom: '0.45rem',
              borderRadius: '7px', fontSize: '0.855rem',
              border: `1px solid ${t.border}`,
              background: 'transparent', color: t.fg,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Section switcher — без тени */}
      {sections.length > 1 && activeSection && (
        <div style={{ flexShrink: 0, padding: '8px 10px', borderBottom: `1px solid ${t.border}`, position: 'relative' }} ref={sectionRef}>
          <button onClick={() => setSectionOpen(v => !v)} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.4rem 0.65rem', borderRadius: '7px', fontSize: '0.875rem',
            border: `1px solid ${t.border}`, background: 'transparent', color: t.fg, cursor: 'pointer',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
              {activeSection.navSlug === '' ? <Home size={13} style={{ color: t.fgMuted, flexShrink: 0 }} /> : <LucideIcon name={activeSection.navIcon} size={13} />}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeSection.navTitle}</span>
            </div>
            <ChevronDown size={12} style={{ color: t.fgMuted, flexShrink: 0, transform: sectionOpen ? 'rotate(180deg)' : 'none' }} />
          </button>
          {sectionOpen && (
            <div style={{
              position: 'absolute', left: '10px', right: '10px', top: 'calc(100% - 2px)',
              borderRadius: '10px', border: `1px solid ${t.border}`, background: t.panelBg,
              zIndex: 100, overflow: 'hidden',
            }}>
              {sections.map(s => (
                <button key={s.navSlug} onClick={() => { storageSet('hub:activeNavSlug', s.navSlug); setActiveNavSlug(s.navSlug); setExpandedPaths(new Set()); setSectionOpen(false); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 0.75rem', fontSize: '0.875rem', border: 'none', cursor: 'pointer', textAlign: 'left', background: s.navSlug === activeNavSlug ? t.accentSoft : 'transparent', color: s.navSlug === activeNavSlug ? t.accent : t.fg, fontWeight: s.navSlug === activeNavSlug ? 600 : 400 }}>
                  {s.navSlug === '' ? <Home size={13} style={{ color: t.fgMuted }} /> : <LucideIcon name={s.navIcon} size={13} />}
                  <span>{s.navTitle}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tree */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
        {error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '2rem', textAlign: 'center' }}>
            <AlertTriangle size={22} style={{ color: 'rgba(251,191,36,0.7)' }} />
            <p style={{ margin: 0, fontSize: '0.8rem', color: t.fgMuted }}>Не удалось загрузить документы</p>
            <button onClick={() => window.location.reload()} style={{ padding: '0.25rem 0.75rem', borderRadius: '6px', border: `1px solid ${t.border}`, background: 'transparent', color: t.fgMuted, fontSize: '0.75rem', cursor: 'pointer' }}>Обновить</button>
          </div>
        ) : loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', fontSize: '0.8rem', color: t.fgMuted }}>Загрузка...</div>
        ) : (
          <nav>
            {navTree.docs.length > 0 && (
              <div style={{ marginBottom: '6px' }}>
                {[...navTree.docs].sort((a, b) => a.title.localeCompare(b.title)).map(doc => (
                  <DocLink key={doc.id} doc={doc} isDark={isDark} isActive={currentDocSlug === doc.slug} />
                ))}
              </div>
            )}
            {Object.entries(navTree.children).sort(([a], [b]) => a.localeCompare(b)).map(([key, node]) => (
              <CategoryNode key={key} node={node} path={key} expandedPaths={expandedPaths} onToggle={togglePath} isDark={isDark} currentDocSlug={currentDocSlug} />
            ))}
          </nav>
        )}
      </div>
    </div>
  );
};

// ─── TocPanelContent — glow effect ───────────────────────────────────────────

const TocPanelContent: React.FC<{
  toc: TocItem[]; activeId: string; isDark: boolean; onItemClick?: () => void;
}> = ({ toc, activeId, isDark, onItemClick }) => {
  const t = tk(isDark);
  if (!toc.length) return <div style={{ padding: '2rem', textAlign: 'center', fontSize: '0.85rem', color: t.fgMuted }}>На этой странице нет заголовков</div>;
  return (
    <nav style={{ padding: '6px 4px' }}>
      {toc.map((item, index) => {
        const activeIndex = toc.findIndex(i => i.id === activeId);
        const dist      = Math.abs(index - activeIndex);
        const isActive  = item.id === activeId && activeId !== '';
        const hasActive = activeId !== '';
        const opacity   = !hasActive ? 0.55 : isActive ? 1 : Math.max(0.28, 0.78 - dist * 0.18);
        const glowOp    = !hasActive ? 0 : isActive ? 1 : Math.max(0, 0.5 - dist * 0.16);
        const borderClr = isActive ? t.accent : glowOp > 0 ? (isDark ? `rgba(255,255,255,${glowOp})` : `rgba(0,0,0,${glowOp})`) : 'transparent';
        const shadow    = isActive ? `inset 3px 0 10px -2px ${t.accent}88` : glowOp > 0 ? `inset 3px 0 8px -3px ${isDark ? `rgba(255,255,255,${glowOp * 0.35})` : `rgba(0,0,0,${glowOp * 0.35})`}` : 'none';
        return (
          <button key={item.id} onClick={() => { scrollToElement(item.id); onItemClick?.(); }}
            style={{
              width: '100%', textAlign: 'left', paddingTop: '0.38rem', paddingBottom: '0.38rem',
              paddingRight: '0.75rem', paddingLeft: `${12 + (item.level - 2) * 14}px`,
              fontSize: '0.82rem', lineHeight: 1.4, background: 'transparent', border: 'none', cursor: 'pointer',
              borderLeft: '2px solid', borderLeftColor: borderClr, boxShadow: shadow,
              color: isActive ? t.accent : isDark ? `rgba(255,255,255,${opacity})` : `rgba(0,0,0,${opacity})`,
              fontWeight: 400,
              textShadow: isActive ? `0 0 12px ${t.accent}55` : 'none',
            }}
          >{item.text}</button>
        );
      })}
    </nav>
  );
};

// ─── ContactsPanelContent ─────────────────────────────────────────────────────

const ContactsPanelContent: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const t = tk(isDark);
  return (
    <div style={{ padding: '8px' }}>
      {CONTACTS.map(c => (
        <a key={c.href} href={c.href} target={c.external ? '_blank' : undefined} rel={c.external ? 'noopener noreferrer' : undefined}
          style={{ display: 'flex', flexDirection: 'column', padding: '10px', borderRadius: '8px', textDecoration: 'none', color: t.fg, fontSize: '0.875rem', gap: '2px' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = t.hov; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <div style={{ fontWeight: 500 }}>{c.title}</div>
          <div style={{ fontSize: '0.75rem', color: t.fgMuted }}>{c.subtitle}</div>
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

// ─── RailBtn — иконка + текст, без фона ──────────────────────────────────────

const RailBtn: React.FC<{
  icon: React.ReactNode; label: string;
  isActive?: boolean; isDark: boolean; onClick: () => void; title?: string;
}> = ({ icon, label, isActive, isDark, onClick, title }) => {
  const t = tk(isDark);
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: RAIL_W, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '4px', padding: '10px 4px', border: 'none', background: 'transparent',
        color: isActive ? t.accent : hov ? t.fg : t.fgMuted,
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

  // Восстанавливаем activePanel из sessionStorage — переживает навигацию Astro
  const [activePanel, setActivePanel] = useState<PanelType>(() => {
    try {
      const s = sessionStorage.getItem('hub:activePanel');
      if (s === 'nav' || s === 'toc' || s === 'contacts') return s as PanelType;
    } catch {}
    return null;
  });

  // Сохраняем panelWidth между сессиями
  const [panelWidth, setPanelWidth] = useState<number>(() => {
    try {
      const w = Number(sessionStorage.getItem('hub:panelWidth'));
      if (w >= PANEL_MIN && w <= PANEL_MAX) return w;
    } catch {}
    return PANEL_DEFAULT;
  });
  const [searchOpen, setSearchOpen]   = useState(false);
  const [handleHov, setHandleHov]     = useState(false);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartW = useRef(0);

  const togglePanel = useCallback((panel: PanelType) => {
    setActivePanel(prev => {
      const next = prev === panel ? null : panel;
      // Немедленно пишем в sessionStorage (useEffect может опоздать при Astro навигации)
      try { sessionStorage.setItem('hub:activePanel', next ?? ''); } catch {}
      return next;
    });
  }, []);

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
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [panelWidth]);

  // Сохраняем activePanel в sessionStorage
  useEffect(() => {
    try { sessionStorage.setItem('hub:activePanel', activePanel ?? ''); } catch {}
  }, [activePanel]);

  // Сохраняем panelWidth в sessionStorage
  useEffect(() => {
    try { sessionStorage.setItem('hub:panelWidth', String(panelWidth)); } catch {}
  }, [panelWidth]);

  // Отступ для контента
  useEffect(() => {
    const left = (railVisible ? RAIL_W : 0) + (activePanel ? panelWidth : 0);
    document.documentElement.style.setProperty('--nav-left', `${left}px`);
    return () => { document.documentElement.style.removeProperty('--nav-left'); };
  }, [railVisible, activePanel, panelWidth]);

  const panelTitles: Record<Exclude<PanelType, null>, string> = { nav: 'Навигация', toc: 'Оглавление', contacts: 'Контакты' };

  return (
    <>
      {/* Rail */}
      {railVisible && (
        <aside style={{
          position: 'fixed', left: 0, top: 0, height: '100vh', width: RAIL_W,
          background: t.railBg, borderRight: `1px solid ${t.border}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          zIndex: 50, padding: '8px 0', gap: '2px',
        }}>
          {/* Лого — не кнопка */}
          <div style={{ width: RAIL_W, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src="/favicon.png" alt="hub" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flex: 1, width: '100%' }}>
            <RailBtn icon={<PanelLeft size={18} />}                                 label="Панель"   isDark={isDark} onClick={() => setRailVisible(false)} title="Скрыть" />
            <RailBtn icon={isDark ? <Sun size={18} /> : <Moon size={18} />}         label="Тема"     isDark={isDark} onClick={toggleTheme}                 title={isDark ? 'Светлая' : 'Тёмная'} />
            <RailBtn icon={<Search size={18} />}                                    label="Поиск"    isDark={isDark} onClick={() => setSearchOpen(true)}   title="Поиск" />
            <RailBtn icon={<FolderOpen size={18} />}                                label="Разделы"  isDark={isDark} isActive={activePanel === 'nav'}      onClick={() => togglePanel('nav')}      title="Разделы" />
            <RailBtn icon={<List size={18} />}                                      label="Оглавл."  isDark={isDark} isActive={activePanel === 'toc'}      onClick={() => togglePanel('toc')}      title="Оглавление" />
            <RailBtn icon={<ArrowUp size={18} />}                                   label="Наверх"   isDark={isDark} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} title="Наверх" />
            <RailBtn icon={<Mail size={18} />}                                      label="Контакты" isDark={isDark} isActive={activePanel === 'contacts'} onClick={() => togglePanel('contacts')} title="Контакты" />
          </div>
        </aside>
      )}

      {/* Кнопка вернуть рейл */}
      {!railVisible && (
        <button onClick={() => setRailVisible(true)}
          style={{ position: 'fixed', left: 8, top: 8, zIndex: 55, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: '8px', border: `1px solid ${t.border}`, background: t.railBg, color: t.fgMuted, cursor: 'pointer' }}
          title="Показать">
          <PanelLeft size={14} />
        </button>
      )}

      {/* Panel */}
      {railVisible && activePanel && (
        <aside style={{
          position: 'fixed', left: RAIL_W, top: 0, height: '100vh',
          width: panelWidth, background: t.panelBg,
          borderRight: `1px solid ${t.border}`,
          display: 'flex', flexDirection: 'column', zIndex: 49, overflow: 'hidden',
        }}>
          <PanelHeader title={panelTitles[activePanel]} isDark={isDark} onClose={() => setActivePanel(null)} />
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activePanel === 'nav'      && <NavPanelContent isDark={isDark} currentDocSlug={currentDocSlug} onOpenSearch={() => setSearchOpen(true)} />}
            {activePanel === 'toc'      && <div style={{ flex: 1, overflowY: 'auto' }}><TocPanelContent toc={toc} activeId={activeId} isDark={isDark} /></div>}
            {activePanel === 'contacts' && <div style={{ overflowY: 'auto' }}><ContactsPanelContent isDark={isDark} /></div>}
          </div>
          {/* Resize handle */}
          <div onMouseDown={onResizeMouseDown} onMouseEnter={() => setHandleHov(true)} onMouseLeave={() => setHandleHov(false)}
            style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '8px', cursor: 'col-resize', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '3px', height: '56px', borderRadius: '3px', background: handleHov ? t.handleHov : t.handle, pointerEvents: 'none' }} />
          </div>
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

// ─── Mobile full-screen panel (portal) ───────────────────────────────────────
// Работает как UnifiedSearchPanel — через portal в body, полноэкранный overlay

const MobilePanel: React.FC<{
  type: 'nav' | 'toc' | 'contacts';
  onClose: () => void;
  isDark: boolean;
  currentDocSlug?: string;
  toc: TocItem[];
  activeId: string;
}> = ({ type, onClose, isDark, currentDocSlug, toc, activeId }) => {
  const t = tk(isDark);

  // Блокируем скролл body пока панель открыта
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const titles: Record<string, string> = { nav: 'Навигация', toc: 'Оглавление', contacts: 'Контакты' };

  const content = (
    <>


      {/* Panel — полноэкранный как поиск */}
      <div style={{
        position: 'fixed', inset: 0,
        zIndex: 62,
        background: t.panelFullBg,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: 'mobPanelIn 0.22s cubic-bezier(0.4,0,0.2,1)',
        paddingBottom: '60px',
      }}>
        <style>{`@keyframes mobPanelIn{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>

        {/* Header */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '52px 16px 12px', borderBottom: `1px solid ${t.border}` }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: t.fg }}>{titles[type]}</span>
          <button onClick={onClose}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '7px', border: 'none', background: t.hov, color: t.fgMuted, cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {type === 'nav'      && <NavPanelContent isDark={isDark} currentDocSlug={currentDocSlug} onOpenSearch={() => {}} />}
          {type === 'toc'      && <div style={{ flex: 1, overflowY: 'auto' }}><TocPanelContent toc={toc} activeId={activeId} isDark={isDark} onItemClick={onClose} /></div>}
          {type === 'contacts' && <div style={{ overflowY: 'auto' }}><ContactsPanelContent isDark={isDark} /></div>}
        </div>
      </div>
    </>
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
      {/* Полноэкранные панели через portal */}
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

      {/* Bottom bar — все кнопки видны сразу */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 60,
        height: '60px',
        background: t.mobBg,
        borderTop: `1px solid ${t.border}`,
        display: 'flex', alignItems: 'stretch',
      }}>
        <MobBtn label="Тема"     icon={isDark ? <Sun size={22} /> : <Moon size={22} />}  isDark={isDark} onClick={toggleTheme}                                         isActive={false} />
        <MobBtn label="Поиск"    icon={<Search size={22} />}                             isDark={isDark} onClick={() => { setSheet(null); setSearchOpen(true); }}       isActive={false} />
        <MobBtn label="Разделы"  icon={<FolderOpen size={22} />}                         isDark={isDark} onClick={() => toggle('nav')}                                  isActive={sheet === 'nav'} />

        {/* Лого — занимает flex:1 по центру */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/favicon.png" alt="hub" style={{ width: 38, height: 38, objectFit: 'contain' }} />
        </div>

        <MobBtn label="Оглавл."  icon={<List size={22} />}                               isDark={isDark} onClick={() => toggle('toc')}                                  isActive={sheet === 'toc'} />
        <MobBtn label="Наверх"   icon={<ArrowUp size={22} />}                            isDark={isDark} onClick={() => { setSheet(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} isActive={false} />
        <MobBtn label="Контакты" icon={<Mail size={22} />}                               isDark={isDark} onClick={() => toggle('contacts')}                             isActive={sheet === 'contacts'} />
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