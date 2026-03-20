/**
 * Navigation.tsx — единый компонент навигации
 *
 * Breakpoint: <= 820px → MobileNav (bottom bar + sheets)
 *             >  820px → DesktopNav (sidebar слева + TOC справа)
 *
 * Используется вместо Sidebar + TocPanel + MobileNavbar.
 * Пример использования в DocContent:
 *   <Navigation currentDocSlug={doc.slug} toc={toc} activeHeadingId={activeId} />
 */

import React, {
  useState, useMemo, useEffect, useRef,
  lazy, Suspense, memo, startTransition,
} from 'react';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useManifest } from '@/features/docs/hooks/useDocuments';
import { storageSet } from '@/shared/lib/storage';
import { CONTACTS } from '@/shared/data/contacts';
import { scrollToElement } from '@/features/docs/utils/scrollUtils';
import { AnimatePresence } from 'framer-motion';
import {
  Search, Sun, Moon, ChevronDown, ChevronRight,
  Mail, X, Home, SlidersHorizontal, AlertTriangle,
  List, ArrowUp,
} from 'lucide-react';

const LazyUnifiedSearchPanel = lazy(() => import('./UnifiedSearchPanel'));

// ─── Breakpoint ───────────────────────────────────────────────────────────────

const BREAKPOINT = 820;

function useIsDesktop(): boolean {
  // Всегда стартуем с false — сайдбар не рендерится при hydration на мобильных
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth > BREAKPOINT);
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
  return isDesktop;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface CategoryPathItem { slug: string; title: string; icon: string | null; }

interface Doc {
  id: string; slug: string; title: string; description: string;
  type: string; typename: string; icon?: string;
  navSlug?: string; navTitle?: string; navIcon?: string;
  categoryPath?: CategoryPathItem[];
}

interface NavNode {
  title: string; slug: string; icon: string | null;
  docs: Doc[]; children: Record<string, NavNode>; isCategory: boolean;
}

interface NavSection { navSlug: string; navTitle: string; navIcon: string; }

interface NavigationProps {
  currentDocSlug?: string;
  toc?: TocItem[];
  activeHeadingId?: string;
}

// ─── LucideIcon (lazy) ────────────────────────────────────────────────────────

const iconCache = new Map<string, React.FC<{ size?: number; className?: string }>>();

const LucideIcon: React.FC<{ name: string; size?: number; className?: string }> = memo(({ name, size = 16, className }) => {
  const [Icon, setIcon] = useState<React.FC<{ size?: number; className?: string }> | null>(() => iconCache.get(name) ?? null);
  useEffect(() => {
    if (!name || iconCache.has(name)) return;
    const pascal = name.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
    import('lucide-react').then(mod => {
      const ic = (mod as Record<string, unknown>)[pascal] as React.FC<{ size?: number; className?: string }> | undefined;
      if (ic) { iconCache.set(name, ic); setIcon(() => ic); }
    });
  }, [name]);
  if (!Icon) return <span style={{ width: size, height: size, display: 'inline-block', flexShrink: 0 }} />;
  return <Icon size={size} className={className} />;
});

// ─── Nav tree ─────────────────────────────────────────────────────────────────

function countDocs(node: NavNode): number {
  return node.docs.length + Object.values(node.children).reduce((s, c) => s + countDocs(c), 0);
}

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
      if (!cur.children[p]) { const ci = cats[i]; cur.children[p] = { title: ci?.title ?? p, slug: p, icon: ci?.icon ?? null, docs: [], children: {}, isCategory: true }; }
      cur = cur.children[p];
    }
    cur.docs.push(doc);
  }
  return root;
}

// ─── Design tokens ────────────────────────────────────────────────────────────

function tk(isDark: boolean) {
  return {
    bg:        isDark ? '#0F0F0F' : '#E1E0DC',
    border:    isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    fg:        isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
    fgMuted:   isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
    fgSub:     isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
    inputBg:   isDark ? '#1a1a1a' : '#d8d7d3',
    inputClr:  isDark ? '#fff' : '#000',
    hov:       isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    accent:    isDark ? '#ffffff' : '#000000',
    accentSoft:isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    mobBg:     isDark ? 'rgba(10,10,10,0.97)' : 'rgba(232,231,227,0.97)',
    sheetBg:   isDark ? '#111111' : '#d8d7d3',
  };
}

// ─── Shared: DocLink ──────────────────────────────────────────────────────────

const DocLink: React.FC<{ doc: Doc; isDark: boolean; isActive: boolean; onClick?: () => void }> = memo(({ doc, isDark, isActive, onClick }) => {
  const t = tk(isDark);
  return (
    <a href={`/${doc.slug}`} onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: '6px 12px', borderRadius: '0.5rem', fontSize: '0.875rem',
      textDecoration: 'none',
      borderLeft: '2px solid',
      borderLeftColor: isActive ? t.accent : 'transparent',
      boxShadow: isActive ? `inset 3px 0 10px -2px ${t.accent}88` : 'none',
      color: isActive ? t.accent : t.fg,
      fontWeight: isActive ? 600 : 400,
      background: 'transparent',
    }}>
      <span style={{ flexShrink: 0, width: '1rem', height: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {doc.icon && <LucideIcon name={doc.icon} size={14} />}
      </span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</span>
    </a>
  );
});

// ─── Shared: CategoryNode ─────────────────────────────────────────────────────

const CategoryNode: React.FC<{ node: NavNode; path: string; expandedPaths: Set<string>; onToggle: (p: string) => void; isDark: boolean; currentDocSlug?: string; onDocClick?: () => void; }> = memo(({ node, path, expandedPaths, onToggle, isDark, currentDocSlug, onDocClick }) => {
  const t  = tk(isDark);
  const expanded    = expandedPaths.has(path);
  const hasChildren = Object.keys(node.children).length > 0;
  const total       = countDocs(node);
  return (
    <div>
      <button onClick={() => onToggle(path)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600, border: 'none', background: 'transparent', color: t.fg, cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '1rem', height: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {hasChildren && (expanded ? <ChevronDown size={14} style={{ color: t.fgMuted }} /> : <ChevronRight size={14} style={{ color: t.fgMuted }} />)}
          </span>
          <span style={{ width: '1rem', height: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {node.icon && <LucideIcon name={node.icon} size={14} />}
          </span>
          <span>{node.title}</span>
        </div>
        {total > 0 && <span style={{ fontSize: '0.7rem', padding: '1px 7px', borderRadius: '4px', background: t.accentSoft, color: t.fgMuted }}>{total}</span>}
      </button>
      {expanded && (
        <div style={{ marginLeft: '1rem' }}>
          {[...node.docs].sort((a, b) => a.title.localeCompare(b.title)).map(doc => <DocLink key={doc.id} doc={doc} isDark={isDark} isActive={currentDocSlug === doc.slug} onClick={onDocClick} />)}
          {Object.entries(node.children).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => <CategoryNode key={key} node={child} path={`${path}/${key}`} expandedPaths={expandedPaths} onToggle={onToggle} isDark={isDark} currentDocSlug={currentDocSlug} onDocClick={onDocClick} />)}
        </div>
      )}
    </div>
  );
});

// ─── Shared: NavContent (дерево документов) ───────────────────────────────────

const NavContent: React.FC<{ isDark: boolean; currentDocSlug?: string; onDocClick?: () => void }> = ({ isDark, currentDocSlug, onDocClick }) => {
  const t = tk(isDark);
  const { manifest: docs, loading, error } = useManifest();
  const [query, setQuery]               = useState('');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [activeNavSlug, setActiveNavSlug] = useState('');
  const [searchOpen, setSearchOpen]       = useState(false);

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
    const detected = matched?.navSlug ?? '';
    storageSet('hub:activeNavSlug', detected);
    startTransition(() => setActiveNavSlug(detected));
  }, [sections]);

  useEffect(() => {
    if (!currentDocSlug) return;
    let slug = currentDocSlug;
    if (activeNavSlug && slug.startsWith(activeNavSlug + '/')) slug = slug.slice(activeNavSlug.length + 1);
    const parts     = slug.split('/');
    const pathParts = parts.slice(0, -1).map((_, i) => parts.slice(0, i + 1).join('/'));
    if (pathParts.length) startTransition(() => setExpandedPaths(new Set(pathParts)));
  }, [currentDocSlug, activeNavSlug]);

  const navTree = useMemo(() => buildTree(docs as Doc[], query, activeNavSlug), [docs, query, activeNavSlug]);

  const togglePath = (path: string) => setExpandedPaths(prev => { const n = new Set(prev); n.has(path) ? n.delete(path) : n.add(path); return n; });
  const activeSection = sections.find(s => s.navSlug === activeNavSlug) ?? sections[0];

  const [sectionOpen, setSectionOpen] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sectionOpen) return;
    const h = (e: MouseEvent) => { if (sectionRef.current && !sectionRef.current.contains(e.target as Node)) setSectionOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [sectionOpen]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Поиск */}
      <div style={{ flexShrink: 0, padding: '0.75rem', borderBottom: `1px solid ${tk(isDark).border}` }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: tk(isDark).fgMuted, pointerEvents: 'none' }} />
            <input type="text" placeholder="Поиск по названию..." value={query} onChange={e => setQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: '2rem', paddingRight: '0.5rem', paddingTop: '0.45rem', paddingBottom: '0.45rem', borderRadius: '0.5rem', fontSize: '0.85rem', border: `1px solid ${tk(isDark).border}`, background: tk(isDark).inputBg, color: tk(isDark).inputClr, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <button onClick={() => setSearchOpen(true)} title="Расширенный поиск"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', padding: '0 9px', borderRadius: '0.5rem', border: `1px solid ${tk(isDark).border}`, background: 'transparent', color: tk(isDark).fgMuted, cursor: 'pointer', flexShrink: 0, minHeight: '36px' }}>
            <SlidersHorizontal size={14} />
            <span style={{ fontSize: '8px', fontWeight: 500 }}>Поиск</span>
          </button>
        </div>
      </div>

      {/* Section switcher */}
      {sections.length > 1 && activeSection && (
        <div style={{ flexShrink: 0, padding: '0.5rem 0.75rem', borderBottom: `1px solid ${tk(isDark).border}`, position: 'relative' }} ref={sectionRef}>
          <button onClick={() => setSectionOpen(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem', border: `1px solid ${tk(isDark).border}`, background: 'transparent', color: tk(isDark).fg, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
              {activeSection.navSlug === '' ? <Home size={14} style={{ color: tk(isDark).fgMuted, flexShrink: 0 }} /> : <LucideIcon name={activeSection.navIcon} size={14} />}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeSection.navTitle}</span>
            </div>
            <ChevronDown size={13} style={{ color: tk(isDark).fgMuted, flexShrink: 0, transform: sectionOpen ? 'rotate(180deg)' : 'none' }} />
          </button>
          {sectionOpen && (
            <div style={{ position: 'absolute', left: '0.75rem', right: '0.75rem', top: 'calc(100% - 0.25rem)', borderRadius: '0.75rem', border: `1px solid ${tk(isDark).border}`, background: tk(isDark).bg, boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.7)' : '0 8px 24px rgba(0,0,0,0.15)', zIndex: 100, overflow: 'hidden' }}>
              {sections.map(s => (
                <button key={s.navSlug} onClick={() => { storageSet('hub:activeNavSlug', s.navSlug); setActiveNavSlug(s.navSlug); setExpandedPaths(new Set()); setSectionOpen(false); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.75rem', fontSize: '0.875rem', border: 'none', cursor: 'pointer', textAlign: 'left', background: s.navSlug === activeNavSlug ? tk(isDark).accentSoft : 'transparent', color: s.navSlug === activeNavSlug ? tk(isDark).accent : tk(isDark).fg, fontWeight: s.navSlug === activeNavSlug ? 600 : 400 }}>
                  {s.navSlug === '' ? <Home size={14} style={{ color: tk(isDark).fgMuted }} /> : <LucideIcon name={s.navIcon} size={14} />}
                  <span>{s.navTitle}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tree */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.5rem' }}>
        {error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '2rem', textAlign: 'center' }}>
            <AlertTriangle size={24} style={{ color: isDark ? 'rgba(251,191,36,0.7)' : 'rgba(180,130,0,0.8)' }} />
            <p style={{ margin: 0, fontSize: '0.8rem', color: tk(isDark).fgMuted }}>Не удалось загрузить документы</p>
            <button onClick={() => window.location.reload()} style={{ padding: '0.25rem 0.75rem', borderRadius: '6px', border: `1px solid ${tk(isDark).border}`, background: 'transparent', color: tk(isDark).fgMuted, fontSize: '0.75rem', cursor: 'pointer' }}>Обновить</button>
          </div>
        ) : loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', fontSize: '0.8rem', color: tk(isDark).fgMuted }}>Загрузка...</div>
        ) : (
          <nav>
            {navTree.docs.length > 0 && (
              <div style={{ marginBottom: '0.75rem' }}>
                {[...navTree.docs].sort((a, b) => a.title.localeCompare(b.title)).map(doc => <DocLink key={doc.id} doc={doc} isDark={isDark} isActive={currentDocSlug === doc.slug} onClick={onDocClick} />)}
              </div>
            )}
            {Object.entries(navTree.children).sort(([a], [b]) => a.localeCompare(b)).map(([key, node]) => (
              <CategoryNode key={key} node={node} path={key} expandedPaths={expandedPaths} onToggle={togglePath} isDark={isDark} currentDocSlug={currentDocSlug} onDocClick={onDocClick} />
            ))}
          </nav>
        )}
      </div>

      {/* Advanced search panel */}
      <AnimatePresence>
        {searchOpen && (
          <Suspense fallback={null}>
            <LazyUnifiedSearchPanel onClose={() => setSearchOpen(false)} />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Shared: TocContent ───────────────────────────────────────────────────────

const TocContent: React.FC<{ toc: TocItem[]; activeId: string; isDark: boolean; onItemClick?: () => void }> = ({ toc, activeId, isDark, onItemClick }) => {
  const t = tk(isDark);
  if (!toc.length) return <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: t.fgMuted }}>На этой странице нет заголовков</div>;
  return (
    <nav style={{ padding: '0.5rem 0' }}>
      {toc.map((item, index) => {
        const activeIndex = toc.findIndex(i => i.id === activeId);
        const dist        = Math.abs(index - activeIndex);
        const isActive    = item.id === activeId && activeId !== '';
        const hasActive   = activeId !== '';
        const opacity     = !hasActive ? 0.6 : isActive ? 1 : Math.max(0.35, 0.8 - dist * 0.2);
        const glowOp      = !hasActive ? 0 : isActive ? 1 : Math.max(0, 0.55 - dist * 0.18);
        const borderClr   = isActive ? t.accent : glowOp > 0 ? (isDark ? `rgba(255,255,255,${glowOp})` : `rgba(0,0,0,${glowOp})`) : 'transparent';
        const shadow      = isActive ? `inset 3px 0 10px -2px ${t.accent}88` : glowOp > 0 ? `inset 3px 0 7px -3px ${isDark ? `rgba(255,255,255,${glowOp * 0.4})` : `rgba(0,0,0,${glowOp * 0.4})`}` : 'none';
        return (
          <button key={item.id} onClick={() => { scrollToElement(item.id); onItemClick?.(); }}
            style={{ width: '100%', textAlign: 'left', paddingTop: '0.4rem', paddingBottom: '0.4rem', paddingRight: '0.75rem', paddingLeft: `${14 + (item.level - 2) * 14}px`, fontSize: '0.82rem', lineHeight: 1.4, background: 'transparent', border: 'none', cursor: 'pointer', borderLeft: '2px solid', borderLeftColor: borderClr, boxShadow: shadow, color: isActive ? t.accent : (isDark ? `rgba(255,255,255,${opacity})` : `rgba(0,0,0,${opacity})`), textShadow: isActive ? `0 0 12px ${t.accent}66` : 'none' }}>
            {item.text}
          </button>
        );
      })}
    </nav>
  );
};

// ─── DESKTOP: Sidebar слева ───────────────────────────────────────────────────

const DesktopSidebar: React.FC<{ isDark: boolean; toggleTheme: () => void; currentDocSlug?: string }> = ({ isDark, toggleTheme, currentDocSlug }) => {
  const t = tk(isDark);
  const [showContacts, setShowContacts] = useState(false);

  return (
    <aside style={{ position: 'fixed', left: 0, top: 0, height: '100vh', width: '20rem', borderRight: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', zIndex: 50, background: t.bg }}>
      {/* Header */}
      <div style={{ flexShrink: 0, padding: '0.75rem 1rem', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isDark ? 'rgba(15,15,15,0.95)' : 'rgba(225,224,220,0.95)', backdropFilter: 'blur(10px)' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <img src="/favicon.png" alt="Opensophy" style={{ width: '1.75rem', height: '1.75rem', objectFit: 'contain' }} />
          <span style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'customfont', color: '#7234ff' }}>hub</span>
        </a>
        <div style={{ display: 'flex', gap: '2px' }}>
          {[
            { icon: isDark ? <Sun size={16} /> : <Moon size={16} />, label: isDark ? 'Светлая' : 'Тёмная', action: toggleTheme },
            { icon: <Mail size={16} />, label: 'Контакты', action: () => setShowContacts(v => !v) },
          ].map((btn, i) => (
            <button key={i} onClick={btn.action} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '5px 7px', borderRadius: '0.5rem', border: `1px solid ${t.border}`, background: 'transparent', color: t.fgMuted, cursor: 'pointer' }}>
              {btn.icon}
              <span style={{ fontSize: '8px', fontWeight: 500 }}>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      <NavContent isDark={isDark} currentDocSlug={currentDocSlug} />

      {/* Contacts overlay */}
      {showContacts && (
        <div style={{ position: 'absolute', inset: 0, background: t.bg, zIndex: 10, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: `1px solid ${t.border}` }}>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: t.fg }}>Контакты</span>
            <button onClick={() => setShowContacts(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.fgMuted }}><X size={18} /></button>
          </div>
          <div style={{ overflowY: 'auto', padding: '0.75rem' }}>
            {CONTACTS.map(c => (
              <a key={c.href} href={c.href} target={c.external ? '_blank' : undefined} rel={c.external ? 'noopener noreferrer' : undefined}
                style={{ display: 'block', padding: '8px 12px', borderRadius: '0.5rem', textDecoration: 'none', color: t.fg, fontSize: '0.875rem' }}>
                <div style={{ fontWeight: 500 }}>{c.title}</div>
                <div style={{ fontSize: '0.75rem', color: t.fgMuted }}>{c.subtitle}</div>
              </a>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

// ─── DESKTOP: TOC панель справа ───────────────────────────────────────────────

const DesktopToc: React.FC<{ toc: TocItem[]; activeId: string; isDark: boolean }> = ({ toc, activeId, isDark }) => {
  const t = tk(isDark);
  if (!toc.length) return null;
  return (
    <aside style={{ position: 'fixed', right: 0, top: 0, height: '100vh', width: '18rem', borderLeft: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', zIndex: 40, background: isDark ? '#0F0F0F' : '#E1E0DC' }}>
      <div style={{ flexShrink: 0, padding: '1rem', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.fgMuted }}>На этой странице</span>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '4px 8px', borderRadius: '6px', border: `1px solid ${t.border}`, background: 'transparent', color: t.fgMuted, cursor: 'pointer', fontSize: '8px' }}>
          <ArrowUp size={13} />
          <span>Наверх</span>
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <TocContent toc={toc} activeId={activeId} isDark={isDark} />
      </div>
    </aside>
  );
};

// ─── MOBILE: Bottom bar + sheets ─────────────────────────────────────────────

type MobileSheet = 'nav' | 'toc' | 'contacts' | null;

const MobileNav: React.FC<{ isDark: boolean; toggleTheme: () => void; currentDocSlug?: string; toc: TocItem[]; activeId: string; }> = ({ isDark, toggleTheme, currentDocSlug, toc, activeId }) => {
  const t = tk(isDark);
  const [sheet, setSheet] = useState<MobileSheet>(null);

  const closeSheet = () => setSheet(null);
  const toggleSheet = (s: MobileSheet) => setSheet(prev => prev === s ? null : s);

  // Закрываем sheet при навигации
  useEffect(() => {
    document.addEventListener('astro:after-swap', closeSheet);
    return () => document.removeEventListener('astro:after-swap', closeSheet);
  }, []);

  const navButtons = [
    { icon: <Search size={20} />, label: 'Поиск', action: () => { setSheet(null); /* открываем через NavContent */ } },
    { icon: <List size={20} />, label: 'Меню', action: () => toggleSheet('nav') },
    null, // логотип по центру
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="3" y2="12"/><line x1="17" y1="18" x2="3" y2="18"/></svg>, label: 'Оглавление', action: () => toggleSheet('toc') },
    { icon: <ArrowUp size={20} />, label: 'Наверх', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
  ];

  return (
    <>
      {/* Backdrop */}
      {sheet && (
        <div onClick={closeSheet} style={{ position: 'fixed', inset: 0, background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)', zIndex: 58, backdropFilter: 'blur(4px)' }} />
      )}

      {/* Sheet: Меню (навигация) */}
      <div style={{ position: 'fixed', bottom: '3.5rem', left: 0, right: 0, zIndex: 59, height: sheet === 'nav' ? '70dvh' : 0, overflow: 'hidden', transition: 'height 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ height: '100%', background: t.bg, borderTop: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', borderRadius: '1rem 1rem 0 0' }}>
          <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: t.border }} />
          </div>
          <div style={{ flexShrink: 0, padding: '0.5rem 1rem', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <img src="/favicon.png" alt="" style={{ width: '1.5rem', height: '1.5rem', objectFit: 'contain' }} />
              <span style={{ fontWeight: 700, fontFamily: 'customfont', color: '#7234ff', fontSize: '1.1rem' }}>hub</span>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={toggleTheme} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '5px 8px', borderRadius: '0.5rem', border: `1px solid ${t.border}`, background: 'transparent', color: t.fgMuted, cursor: 'pointer', fontSize: '8px' }}>
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
                <span>{isDark ? 'Светлая' : 'Тёмная'}</span>
              </button>
              <button onClick={() => toggleSheet('contacts')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '5px 8px', borderRadius: '0.5rem', border: `1px solid ${t.border}`, background: 'transparent', color: t.fgMuted, cursor: 'pointer', fontSize: '8px' }}>
                <Mail size={15} />
                <span>Контакты</span>
              </button>
              <button onClick={closeSheet} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '0.5rem', border: `1px solid ${t.border}`, background: 'transparent', color: t.fgMuted, cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <NavContent isDark={isDark} currentDocSlug={currentDocSlug} onDocClick={closeSheet} />
          </div>
        </div>
      </div>

      {/* Sheet: Оглавление */}
      <div style={{ position: 'fixed', bottom: '3.5rem', left: 0, right: 0, zIndex: 59, height: sheet === 'toc' ? '65dvh' : 0, overflow: 'hidden', transition: 'height 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ height: '100%', background: t.bg, borderTop: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', borderRadius: '1rem 1rem 0 0' }}>
          <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: t.border }} />
          </div>
          <div style={{ flexShrink: 0, padding: '0.5rem 1rem 0.75rem', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: t.fg }}>На этой странице</span>
            <button onClick={closeSheet} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.fgMuted }}><X size={18} /></button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <TocContent toc={toc} activeId={activeId} isDark={isDark} onItemClick={closeSheet} />
          </div>
        </div>
      </div>

      {/* Sheet: Контакты */}
      <div style={{ position: 'fixed', bottom: '3.5rem', left: 0, right: 0, zIndex: 59, height: sheet === 'contacts' ? '50dvh' : 0, overflow: 'hidden', transition: 'height 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ height: '100%', background: t.bg, borderTop: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', borderRadius: '1rem 1rem 0 0' }}>
          <div style={{ flexShrink: 0, padding: '0.75rem 1rem', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: t.fg }}>Контакты</span>
            <button onClick={closeSheet} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.fgMuted }}><X size={18} /></button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
            {CONTACTS.map(c => (
              <a key={c.href} href={c.href} target={c.external ? '_blank' : undefined} rel={c.external ? 'noopener noreferrer' : undefined}
                style={{ display: 'block', padding: '8px 12px', borderRadius: '0.5rem', textDecoration: 'none', color: t.fg, fontSize: '0.875rem' }}>
                <div style={{ fontWeight: 500 }}>{c.title}</div>
                <div style={{ fontSize: '0.75rem', color: t.fgMuted }}>{c.subtitle}</div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 60, height: '3.5rem', background: t.mobBg, borderTop: `1px solid ${t.border}`, backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'stretch' }}>
        {navButtons.map((btn, i) => {
          if (!btn) {
            // Логотип по центру
            return (
              <a key="logo" href="/" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                <img src="/favicon.png" alt="Opensophy" style={{ width: '2.2rem', height: '2.2rem', objectFit: 'contain' }} />
              </a>
            );
          }
          const isActive = (btn.label === 'Меню' && sheet === 'nav') || (btn.label === 'Оглавление' && sheet === 'toc');
          return (
            <button key={i} onClick={btn.action}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', border: 'none', background: 'transparent', cursor: 'pointer', color: isActive ? t.accent : t.fgMuted, fontSize: '9px', fontWeight: isActive ? 600 : 400, borderTop: isActive ? `2px solid ${t.accent}` : '2px solid transparent' }}>
              {btn.icon}
              <span>{btn.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

// ─── Navigation (главный экспорт) ─────────────────────────────────────────────

const Navigation: React.FC<NavigationProps> = ({ currentDocSlug, toc = [], activeHeadingId = '' }) => {
  const { isDark, toggleTheme } = useTheme();
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <>
        <DesktopSidebar isDark={isDark} toggleTheme={toggleTheme} currentDocSlug={currentDocSlug} />
        <DesktopToc toc={toc} activeId={activeHeadingId} isDark={isDark} />
      </>
    );
  }

  return (
    <MobileNav isDark={isDark} toggleTheme={toggleTheme} currentDocSlug={currentDocSlug} toc={toc} activeId={activeHeadingId} />
  );
};

export default Navigation;