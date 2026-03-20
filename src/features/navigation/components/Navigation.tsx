/**
 * Navigation.tsx — Rail Navigation
 *
 * Desktop (>820px):
 *   - Rail (64px): лого + кнопки с иконками и подписями
 *   - При клике на кнопку (кроме темы) → выезжает панель из-за рейла
 *   - Панель можно тащить за ручку — resize drag
 *   - Кнопка panel-left скрывает/показывает весь рейл
 *
 * Mobile (≤820px):
 *   - Нижний бар: те же кнопки горизонтально
 *   - При клике → шторка снизу (drawer)
 */

import React, {
  useState, useEffect, useRef, useMemo, useCallback,
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
  FolderOpen, List, PanelLeft, ArrowUp,
} from 'lucide-react';

const LazyUnifiedSearchPanel = lazy(() => import('./UnifiedSearchPanel'));

// ─── Breakpoint ───────────────────────────────────────────────────────────────

const BREAKPOINT = 820;
const RAIL_W = 64;
const PANEL_DEFAULT = 280;
const PANEL_MIN = 220;
const PANEL_MAX = 480;

function useIsDesktop(): boolean {
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

export interface TocItem { id: string; text: string; level: number; }
interface CategoryPathItem { slug: string; title: string; icon: string | null; }
interface Doc { id: string; slug: string; title: string; description: string; type: string; typename: string; icon?: string; navSlug?: string; navTitle?: string; navIcon?: string; categoryPath?: CategoryPathItem[]; }
interface NavNode { title: string; slug: string; icon: string | null; docs: Doc[]; children: Record<string, NavNode>; isCategory: boolean; }
interface NavSection { navSlug: string; navTitle: string; navIcon: string; }

export type PanelType = 'nav' | 'toc' | 'contacts' | 'search' | null;

interface NavigationProps {
  currentDocSlug?: string;
  toc?: TocItem[];
  activeHeadingId?: string;
}

// ─── Design tokens ────────────────────────────────────────────────────────────

function tk(isDark: boolean) {
  return {
    railBg:    isDark ? '#0d0d0d' : '#E0DFDb',
    panelBg:   isDark ? '#111111' : '#D8D7D3',
    border:    isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    fg:        isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
    fgMuted:   isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
    fgSub:     isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
    hov:       isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
    active:    isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)',
    accent:    isDark ? '#ffffff' : '#000000',
    accentSoft:isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    inputBg:   isDark ? '#1a1a1a' : '#cccbc7',
    inputClr:  isDark ? '#fff' : '#000',
    mobBg:     isDark ? 'rgba(10,10,10,0.97)' : 'rgba(228,227,223,0.97)',
    sheetBg:   isDark ? '#111111' : '#D0CFC9',
    handle:    isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
    logoClr:   '#7234ff',
  };
}

// ─── LucideIcon (lazy) ────────────────────────────────────────────────────────

const iconCache = new Map<string, React.FC<{ size?: number }>>();
const LucideIcon: React.FC<{ name: string; size?: number }> = memo(({ name, size = 16 }) => {
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
    const cats = doc.categoryPath ?? [];
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
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: '6px 10px', borderRadius: '7px', fontSize: '0.875rem',
      textDecoration: 'none',
      borderLeft: `2px solid ${isActive ? t.accent : 'transparent'}`,
      color: isActive ? t.accent : t.fg,
      fontWeight: isActive ? 600 : 400,
      background: isActive ? t.accentSoft : 'transparent',
      boxShadow: isActive ? `inset 3px 0 10px -2px ${t.accent}44` : 'none',
    }}>
      {doc.icon && <span style={{ flexShrink: 0, width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.fgMuted }}><LucideIcon name={doc.icon} size={13} /></span>}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</span>
    </a>
  );
});

// ─── CategoryNode ─────────────────────────────────────────────────────────────

const CategoryNode: React.FC<{ node: NavNode; path: string; expandedPaths: Set<string>; onToggle: (p: string) => void; isDark: boolean; currentDocSlug?: string; onDocClick?: () => void }> = memo(({ node, path, expandedPaths, onToggle, isDark, currentDocSlug, onDocClick }) => {
  const t = tk(isDark);
  const expanded = expandedPaths.has(path);
  const total = countDocs(node);
  return (
    <div>
      <button onClick={() => onToggle(path)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '7px 10px', borderRadius: '7px', fontSize: '0.875rem', fontWeight: 600,
        border: 'none', background: 'transparent', color: t.fg, cursor: 'pointer', textAlign: 'left',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: t.fgMuted }}>
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </span>
          {node.icon && <span style={{ width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: t.fgMuted }}><LucideIcon name={node.icon} size={13} /></span>}
          <span>{node.title}</span>
        </div>
        {total > 0 && <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: t.accentSoft, color: t.fgMuted }}>{total}</span>}
      </button>
      {expanded && (
        <div style={{ marginLeft: '0.875rem', borderLeft: `1px solid ${t.border}`, paddingLeft: '0.5rem' }}>
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

// ─── NavPanelContent — дерево документов ─────────────────────────────────────

const NavPanelContent: React.FC<{ isDark: boolean; currentDocSlug?: string; onDocClick?: () => void; onOpenSearch: () => void }> = ({ isDark, currentDocSlug, onDocClick, onOpenSearch }) => {
  const t = tk(isDark);
  const { manifest: docs, loading, error } = useManifest();
  const [query, setQuery] = useState('');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [activeNavSlug, setActiveNavSlug] = useState('');
  const [sectionOpen, setSectionOpen] = useState(false);
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
    const matched = sections.filter(s => s.navSlug).find(s => pathname === s.navSlug || pathname.startsWith(s.navSlug + '/'));
    startTransition(() => setActiveNavSlug(matched?.navSlug ?? ''));
  }, [sections]);

  useEffect(() => {
    if (!currentDocSlug) return;
    let slug = currentDocSlug;
    if (activeNavSlug && slug.startsWith(activeNavSlug + '/')) slug = slug.slice(activeNavSlug.length + 1);
    const parts = slug.split('/');
    const pathParts = parts.slice(0, -1).map((_, i) => parts.slice(0, i + 1).join('/'));
    if (pathParts.length) startTransition(() => setExpandedPaths(new Set(pathParts)));
  }, [currentDocSlug, activeNavSlug]);

  const navTree = useMemo(() => buildTree(docs as Doc[], query, activeNavSlug), [docs, query, activeNavSlug]);
  const activeSection = sections.find(s => s.navSlug === activeNavSlug) ?? sections[0];
  const togglePath = (path: string) => setExpandedPaths(prev => { const n = new Set(prev); n.has(path) ? n.delete(path) : n.add(path); return n; });

  useEffect(() => {
    if (!sectionOpen) return;
    const h = (e: MouseEvent) => { if (sectionRef.current && !sectionRef.current.contains(e.target as Node)) setSectionOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [sectionOpen]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Поиск */}
      <div style={{ flexShrink: 0, padding: '10px', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={13} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: t.fgMuted, pointerEvents: 'none' }} />
            <input type="text" placeholder="Фильтр по названию..." value={query} onChange={e => setQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: '2rem', paddingRight: '0.5rem', paddingTop: '0.4rem', paddingBottom: '0.4rem', borderRadius: '7px', fontSize: '0.83rem', border: `1px solid ${t.border}`, background: t.inputBg, color: t.inputClr, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <button onClick={onOpenSearch} title="Расширенный поиск"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', padding: '0 8px', borderRadius: '7px', border: `1px solid ${t.border}`, background: 'transparent', color: t.fgMuted, cursor: 'pointer', flexShrink: 0, minHeight: '34px' }}>
            <SlidersHorizontal size={13} />
          </button>
        </div>
      </div>

      {/* Section switcher */}
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
            <div style={{ position: 'absolute', left: '10px', right: '10px', top: 'calc(100% - 4px)', borderRadius: '10px', border: `1px solid ${t.border}`, background: t.panelBg, boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.7)' : '0 8px 24px rgba(0,0,0,0.15)', zIndex: 100, overflow: 'hidden' }}>
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 6px' }}>
        {error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '2rem', textAlign: 'center' }}>
            <AlertTriangle size={22} style={{ color: isDark ? 'rgba(251,191,36,0.7)' : 'rgba(180,130,0,0.8)' }} />
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
                  <DocLink key={doc.id} doc={doc} isDark={isDark} isActive={currentDocSlug === doc.slug} onClick={onDocClick} />
                ))}
              </div>
            )}
            {Object.entries(navTree.children).sort(([a], [b]) => a.localeCompare(b)).map(([key, node]) => (
              <CategoryNode key={key} node={node} path={key} expandedPaths={expandedPaths} onToggle={togglePath} isDark={isDark} currentDocSlug={currentDocSlug} onDocClick={onDocClick} />
            ))}
          </nav>
        )}
      </div>
    </div>
  );
};

// ─── TocPanelContent ──────────────────────────────────────────────────────────

const TocPanelContent: React.FC<{ toc: TocItem[]; activeId: string; isDark: boolean; onItemClick?: () => void }> = ({ toc, activeId, isDark, onItemClick }) => {
  const t = tk(isDark);
  if (!toc.length) return (
    <div style={{ padding: '2rem', textAlign: 'center', fontSize: '0.85rem', color: t.fgMuted }}>На этой странице нет заголовков</div>
  );
  return (
    <nav style={{ padding: '6px 4px' }}>
      {toc.map((item, index) => {
        const activeIndex = toc.findIndex(i => i.id === activeId);
        const dist = Math.abs(index - activeIndex);
        const isActive = item.id === activeId && activeId !== '';
        const hasActive = activeId !== '';
        const opacity = !hasActive ? 0.6 : isActive ? 1 : Math.max(0.3, 0.8 - dist * 0.18);
        return (
          <button key={item.id} onClick={() => { scrollToElement(item.id); onItemClick?.(); }}
            style={{
              width: '100%', textAlign: 'left',
              paddingTop: '0.38rem', paddingBottom: '0.38rem',
              paddingRight: '0.75rem',
              paddingLeft: `${12 + (item.level - 2) * 14}px`,
              fontSize: '0.82rem', lineHeight: 1.4,
              background: 'transparent', border: 'none', cursor: 'pointer',
              borderLeft: '2px solid',
              borderLeftColor: isActive ? t.accent : 'transparent',
              color: isActive ? t.accent : isDark ? `rgba(255,255,255,${opacity})` : `rgba(0,0,0,${opacity})`,
              fontWeight: isActive ? 600 : 400,
            }}>
            {item.text}
          </button>
        );
      })}
    </nav>
  );
};

// ─── ContactsPanelContent ─────────────────────────────────────────────────────

const ContactsPanelContent: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const t = tk(isDark);
  return (
    <div style={{ padding: '8px 8px' }}>
      {CONTACTS.map(c => (
        <a key={c.href} href={c.href} target={c.external ? '_blank' : undefined} rel={c.external ? 'noopener noreferrer' : undefined}
          style={{ display: 'flex', flexDirection: 'column', padding: '10px 10px', borderRadius: '8px', textDecoration: 'none', color: t.fg, fontSize: '0.875rem', gap: '2px' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = t.hov; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
          <div style={{ fontWeight: 500 }}>{c.title}</div>
          <div style={{ fontSize: '0.75rem', color: t.fgMuted }}>{c.subtitle}</div>
        </a>
      ))}
    </div>
  );
};

// ─── Rail button ──────────────────────────────────────────────────────────────

const RailBtn: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  isDark: boolean;
  onClick: () => void;
  title?: string;
}> = ({ icon, label, isActive, isDark, onClick, title }) => {
  const t = tk(isDark);
  return (
    <button onClick={onClick} title={title}
      style={{
        width: RAIL_W, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '4px', padding: '10px 4px', border: 'none', background: isActive ? t.active : 'transparent',
        color: isActive ? t.accent : t.fgMuted, cursor: 'pointer', borderRadius: '10px',
        flexShrink: 0,
      }}
      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = t.hov; (e.currentTarget as HTMLElement).style.color = t.fg; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isActive ? t.active : 'transparent'; (e.currentTarget as HTMLElement).style.color = isActive ? t.accent : t.fgMuted; }}>
      <span style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      <span style={{ fontSize: '9px', fontWeight: isActive ? 600 : 400, lineHeight: 1, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  );
};

// ─── Panel header ─────────────────────────────────────────────────────────────

const PanelHeader: React.FC<{ title: string; isDark: boolean; onClose?: () => void; rightSlot?: React.ReactNode }> = ({ title, isDark, onClose, rightSlot }) => {
  const t = tk(isDark);
  return (
    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 12px 10px', borderBottom: `1px solid ${t.border}` }}>
      <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: t.fgMuted }}>{title}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {rightSlot}
        {onClose && (
          <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '6px', border: 'none', background: 'transparent', color: t.fgMuted, cursor: 'pointer' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = t.hov; (e.currentTarget as HTMLElement).style.color = t.fg; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = t.fgMuted; }}>
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

// ─── DESKTOP ──────────────────────────────────────────────────────────────────

const DesktopNav: React.FC<{ isDark: boolean; toggleTheme: () => void; currentDocSlug?: string; toc: TocItem[]; activeId: string }> = ({ isDark, toggleTheme, currentDocSlug, toc, activeId }) => {
  const t = tk(isDark);

  const [railVisible, setRailVisible] = useState(true);
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [panelWidth, setPanelWidth] = useState(PANEL_DEFAULT);
  const [searchOpen, setSearchOpen] = useState(false);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartW = useRef(0);

  const togglePanel = useCallback((panel: PanelType) => {
    setActivePanel(prev => prev === panel ? null : panel);
  }, []);

  // Resize drag
  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartW.current = panelWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = ev.clientX - dragStartX.current;
      setPanelWidth(Math.max(PANEL_MIN, Math.min(PANEL_MAX, dragStartW.current + delta)));
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

  const panelTitle: Record<Exclude<PanelType, null>, string> = {
    nav: 'Навигация', toc: 'Оглавление', contacts: 'Контакты', search: 'Поиск',
  };

  const totalLeft = (railVisible ? RAIL_W : 0) + (activePanel ? panelWidth : 0);

  // Сообщаем DocContent о ширине
  useEffect(() => {
    document.documentElement.style.setProperty('--nav-left', `${totalLeft}px`);
    return () => document.documentElement.style.removeProperty('--nav-left');
  }, [totalLeft]);

  return (
    <>
      {/* Rail */}
      {railVisible && (
        <aside style={{
          position: 'fixed', left: 0, top: 0, height: '100vh', width: RAIL_W,
          background: t.railBg, borderRight: `1px solid ${t.border}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          zIndex: 50, paddingTop: '8px', paddingBottom: '8px', gap: '2px',
        }}>
          {/* Logo */}
          <a href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: RAIL_W, height: 48, textDecoration: 'none', flexShrink: 0 }}>
            <img src="/favicon.png" alt="hub" style={{ width: 28, height: 28, objectFit: 'contain' }} />
          </a>

          {/* Кнопки */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flex: 1, width: '100%', paddingTop: '4px' }}>
            <RailBtn icon={<PanelLeft size={18} />} label="Панель" isDark={isDark} onClick={() => setRailVisible(false)} title="Скрыть панель" />
            <RailBtn icon={<Search size={18} />} label="Поиск" isDark={isDark} isActive={activePanel === 'search'} onClick={() => { setSearchOpen(true); }} title="Поиск" />
            <RailBtn icon={<List size={18} />} label="Оглавл." isDark={isDark} isActive={activePanel === 'toc'} onClick={() => togglePanel('toc')} title="Оглавление" />
            <RailBtn icon={<FolderOpen size={18} />} label="Разделы" isDark={isDark} isActive={activePanel === 'nav'} onClick={() => togglePanel('nav')} title="Навигация по разделам" />
            <RailBtn icon={<Mail size={18} />} label="Контакты" isDark={isDark} isActive={activePanel === 'contacts'} onClick={() => togglePanel('contacts')} title="Контакты" />
          </div>

          {/* Тема внизу */}
          <div style={{ flexShrink: 0, width: '100%', display: 'flex', justifyContent: 'center', paddingBottom: '4px' }}>
            <RailBtn icon={isDark ? <Sun size={18} /> : <Moon size={18} />} label="Тема" isDark={isDark} onClick={toggleTheme} title={isDark ? 'Светлая тема' : 'Тёмная тема'} />
          </div>
        </aside>
      )}

      {/* Кнопка вернуть рейл (когда скрыт) */}
      {!railVisible && (
        <button onClick={() => setRailVisible(true)}
          style={{
            position: 'fixed', left: 8, top: 8, zIndex: 55,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: '8px',
            border: `1px solid ${t.border}`, background: t.railBg,
            color: t.fgMuted, cursor: 'pointer',
          }}
          title="Показать панель">
          <PanelLeft size={16} />
        </button>
      )}

      {/* Panel */}
      {railVisible && activePanel && (
        <aside style={{
          position: 'fixed', left: RAIL_W, top: 0, height: '100vh',
          width: panelWidth, background: t.panelBg,
          borderRight: `1px solid ${t.border}`,
          display: 'flex', flexDirection: 'column',
          zIndex: 49, overflow: 'hidden',
        }}>
          <PanelHeader
            title={panelTitle[activePanel]}
            isDark={isDark}
            onClose={() => setActivePanel(null)}
            rightSlot={activePanel === 'toc' ? (
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '4px 7px', borderRadius: '6px', border: `1px solid ${t.border}`, background: 'transparent', color: t.fgMuted, cursor: 'pointer', fontSize: '8px' }}>
                <ArrowUp size={12} /><span>Вверх</span>
              </button>
            ) : undefined}
          />
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activePanel === 'nav' && <NavPanelContent isDark={isDark} currentDocSlug={currentDocSlug} onOpenSearch={() => setSearchOpen(true)} />}
            {activePanel === 'toc' && <div style={{ flex: 1, overflowY: 'auto' }}><TocPanelContent toc={toc} activeId={activeId} isDark={isDark} /></div>}
            {activePanel === 'contacts' && <div style={{ overflowY: 'auto' }}><ContactsPanelContent isDark={isDark} /></div>}
          </div>

          {/* Resize handle */}
          <div
            onMouseDown={onResizeMouseDown}
            style={{
              position: 'absolute', right: 0, top: 0, bottom: 0, width: '4px',
              cursor: 'col-resize', zIndex: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div style={{ width: '2px', height: '32px', borderRadius: '2px', background: t.handle, opacity: 0.5 }} />
          </div>
        </aside>
      )}

      {/* Search */}
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

// ─── MOBILE ───────────────────────────────────────────────────────────────────

type MobileSheet = 'nav' | 'toc' | 'contacts' | null;

const MobileNav: React.FC<{ isDark: boolean; toggleTheme: () => void; currentDocSlug?: string; toc: TocItem[]; activeId: string }> = ({ isDark, toggleTheme, currentDocSlug, toc, activeId }) => {
  const t = tk(isDark);
  const [sheet, setSheet] = useState<MobileSheet>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const close = () => setSheet(null);
  const toggle = (s: MobileSheet) => setSheet(prev => prev === s ? null : s);

  useEffect(() => {
    document.addEventListener('astro:after-swap', close);
    return () => document.removeEventListener('astro:after-swap', close);
  }, []);

  const sheetHeights: Record<MobileSheet & string, string> = { nav: '75dvh', toc: '65dvh', contacts: '50dvh' };

  const navButtons = [
    { icon: <Search size={20} />, label: 'Поиск', action: () => { close(); setSearchOpen(true); } },
    { icon: <FolderOpen size={20} />, label: 'Разделы', sheet: 'nav' as MobileSheet },
    null, // лого
    { icon: <List size={20} />, label: 'Оглавл.', sheet: 'toc' as MobileSheet },
    { icon: <Mail size={20} />, label: 'Контакты', sheet: 'contacts' as MobileSheet },
  ];

  const sheetContent: Record<string, React.ReactNode> = {
    nav: (
      <>
        <PanelHeader title="Навигация" isDark={isDark} onClose={close}
          rightSlot={<button onClick={toggleTheme} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '4px 8px', borderRadius: '6px', border: `1px solid ${t.border}`, background: 'transparent', color: t.fgMuted, cursor: 'pointer', fontSize: '8px' }}>
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
            <span>Тема</span>
          </button>}
        />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <NavPanelContent isDark={isDark} currentDocSlug={currentDocSlug} onDocClick={close} onOpenSearch={() => { close(); setSearchOpen(true); }} />
        </div>
      </>
    ),
    toc: (
      <>
        <PanelHeader title="Оглавление" isDark={isDark} onClose={close}
          rightSlot={<button onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); close(); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '4px 7px', borderRadius: '6px', border: `1px solid ${t.border}`, background: 'transparent', color: t.fgMuted, cursor: 'pointer', fontSize: '8px' }}>
            <ArrowUp size={12} /><span>Вверх</span>
          </button>}
        />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <TocPanelContent toc={toc} activeId={activeId} isDark={isDark} onItemClick={close} />
        </div>
      </>
    ),
    contacts: (
      <>
        <PanelHeader title="Контакты" isDark={isDark} onClose={close} />
        <div style={{ overflowY: 'auto' }}><ContactsPanelContent isDark={isDark} /></div>
      </>
    ),
  };

  return (
    <>
      {/* Backdrop */}
      {sheet && (
        <div onClick={close} style={{ position: 'fixed', inset: 0, background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.25)', zIndex: 58, backdropFilter: 'blur(4px)' }} />
      )}

      {/* Шторки */}
      {(['nav', 'toc', 'contacts'] as MobileSheet[]).map(s => s && (
        <div key={s} style={{
          position: 'fixed', bottom: '3.5rem', left: 0, right: 0, zIndex: 59,
          height: sheet === s ? sheetHeights[s] : 0,
          overflow: 'hidden', transition: 'height 0.28s cubic-bezier(0.4,0,0.2,1)',
        }}>
          <div style={{
            height: '100%', background: t.sheetBg, borderTop: `1px solid ${t.border}`,
            borderRadius: '14px 14px 0 0', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            {/* Drag handle */}
            <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', paddingTop: '8px', paddingBottom: '2px' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: t.handle }} />
            </div>
            {sheetContent[s]}
          </div>
        </div>
      ))}

      {/* Bottom bar */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 60,
        height: '3.5rem', background: t.mobBg, borderTop: `1px solid ${t.border}`,
        backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'stretch',
      }}>
        {navButtons.map((btn, i) => {
          if (!btn) {
            return (
              <a key="logo" href="/" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                <img src="/favicon.png" alt="hub" style={{ width: 34, height: 34, objectFit: 'contain' }} />
              </a>
            );
          }
          const isActive = btn.sheet ? sheet === btn.sheet : false;
          return (
            <button key={i} onClick={btn.sheet ? () => toggle(btn.sheet!) : btn.action}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '2px', border: 'none', background: 'transparent', cursor: 'pointer',
                color: isActive ? t.accent : t.fgMuted, fontSize: '9px', fontWeight: isActive ? 600 : 400,
                borderTop: isActive ? `2px solid ${t.accent}` : '2px solid transparent',
              }}>
              {btn.icon}
              <span>{btn.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Search */}
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

// ─── Navigation (главный экспорт) ─────────────────────────────────────────────

const Navigation: React.FC<NavigationProps> = ({ currentDocSlug, toc = [], activeHeadingId = '' }) => {
  const { isDark, toggleTheme } = useTheme();
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return <DesktopNav isDark={isDark} toggleTheme={toggleTheme} currentDocSlug={currentDocSlug} toc={toc} activeId={activeHeadingId} />;
  }
  return <MobileNav isDark={isDark} toggleTheme={toggleTheme} currentDocSlug={currentDocSlug} toc={toc} activeId={activeHeadingId} />;
};

export default Navigation;