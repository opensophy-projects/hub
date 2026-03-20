import React, { useState, useMemo, useEffect, useRef, lazy, Suspense, memo, startTransition } from 'react';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useManifest } from '@/features/docs/hooks/useDocuments';
import { useIsDesktop } from '@/shared/hooks/useBreakpoint';
import { storageSet } from '@/shared/lib/storage';
import { CONTACTS } from '@/shared/data/contacts';
import { Search, Sun, Moon, ChevronDown, ChevronRight, Mail, X, Home, SlidersHorizontal, AlertTriangle } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

const LazyUnifiedSearchPanel = lazy(() => import('./UnifiedSearchPanel'));

interface CategoryPathItem { slug: string; title: string; icon: string | null; }
interface Doc { id: string; slug: string; title: string; description: string; type: string; typename: string; icon?: string; author?: string; date?: string; tags?: string[]; navSlug?: string; navTitle?: string; navIcon?: string; categoryPath?: CategoryPathItem[]; }
interface NavNode { title: string; slug: string; icon: string | null; docs: Doc[]; children: Record<string, NavNode>; isCategory: boolean; }
interface NavSection { navSlug: string; navTitle: string; navIcon: string; }

const iconCache = new Map<string, React.FC<{ size?: number; className?: string }>>();
const LucideIcon: React.FC<{ name: string; size?: number; className?: string }> = memo(({ name, size = 16, className }) => {
  const [Icon, setIcon] = useState<React.FC<{ size?: number; className?: string }> | null>(() => iconCache.get(name) ?? null);
  useEffect(() => {
    if (!name || iconCache.has(name)) return;
    const pascal = name.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
    import('lucide-react').then((mod) => {
      const ic = (mod as Record<string, unknown>)[pascal] as React.FC<{ size?: number; className?: string }> | undefined;
      if (ic) { iconCache.set(name, ic); setIcon(() => ic); }
    });
  }, [name]);
  if (!Icon) return <span style={{ width: size, height: size, display: 'inline-block', flexShrink: 0 }} />;
  return <Icon size={size} className={className} />;
});

const NavPopoverSwitcher: React.FC<{ sections: NavSection[]; activeSlug: string; onSelect: (slug: string) => void; isDark: boolean; }> = memo(({ sections, activeSlug, onSelect, isDark }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const active = useMemo(() => sections.find(s => s.navSlug === activeSlug) ?? sections[0], [sections, activeSlug]);
  const bdr = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const clr = isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)';
  const bg  = isDark ? '#0F0F0F' : '#E1E0DC';
  const act = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const mut = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
  return (
    <div className="flex-shrink-0 px-3 py-2" ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem', border: `1px solid ${bdr}`, background: 'transparent', color: clr, cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
          {active.navSlug === '' ? <Home size={15} style={{ color: mut }} /> : <LucideIcon key={active.navSlug} name={active.navIcon} size={15} className={isDark ? 'text-white/50' : 'text-black/50'} />}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{active.navTitle}</span>
        </div>
        <ChevronDown size={14} style={{ flexShrink: 0, color: mut, transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', left: '0.75rem', right: '0.75rem', marginTop: '0.25rem', borderRadius: '0.75rem', border: `1px solid ${bdr}`, boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.7)' : '0 8px 24px rgba(0,0,0,0.15)', zIndex: 50, overflow: 'hidden', background: bg }}>
          {sections.map(section => (
            <button key={section.navSlug} onClick={() => { onSelect(section.navSlug); setOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 0.75rem', fontSize: '0.875rem', border: 'none', cursor: 'pointer', textAlign: 'left', background: section.navSlug === activeSlug ? act : 'transparent', color: section.navSlug === activeSlug ? (isDark ? '#fff' : '#000') : clr, fontWeight: section.navSlug === activeSlug ? 600 : 400 }}>
              {section.navSlug === '' ? <Home size={15} style={{ color: mut }} /> : <LucideIcon name={section.navIcon} size={15} className={isDark ? 'text-white/50' : 'text-black/50'} />}
              <span>{section.navTitle}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

const IconButton: React.FC<{ icon: React.ReactNode; label: string; onClick: (e: React.MouseEvent) => void; isDark: boolean; title?: string; }> = ({ icon, label, onClick, isDark, title }) => (
  <button onClick={onClick} title={title} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', padding: '6px 8px', borderRadius: '0.5rem', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, background: 'transparent', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)', cursor: 'pointer' }}>
    <div style={{ width: '1.25rem', height: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
    <span style={{ fontSize: '9px', fontWeight: 500, lineHeight: 1 }}>{label}</span>
  </button>
);

const SidebarHeader: React.FC<{ isDark: boolean; onToggleTheme: (e: React.MouseEvent) => void; onToggleContacts: () => void; }> = memo(({ isDark, onToggleTheme, onToggleContacts }) => (
  <div style={{ flexShrink: 0, padding: '0.75rem 1rem', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 20, backgroundColor: isDark ? 'rgba(15,15,15,0.95)' : 'rgba(225,224,220,0.95)', backdropFilter: 'blur(10px)' }}>
    <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
      <img src="/favicon.png" alt="Opensophy" style={{ width: '1.75rem', height: '1.75rem', objectFit: 'contain' }} />
      <h1 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'customfont', color: '#7234ff', margin: 0 }}>hub</h1>
    </a>
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      <IconButton icon={isDark ? <Sun size={17} /> : <Moon size={17} />} label={isDark ? 'Светлая' : 'Тёмная'} onClick={onToggleTheme} isDark={isDark} />
      <IconButton icon={<Mail size={17} />} label="Контакты" onClick={onToggleContacts} isDark={isDark} />
    </div>
  </div>
));

const SidebarSearch: React.FC<{ value: string; onChange: (v: string) => void; isDark: boolean; onOpenAdvanced: () => void; }> = memo(({ value, onChange, isDark, onOpenAdvanced }) => {
  const bdr = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const bg  = isDark ? '#0F0F0F' : '#E1E0DC';
  const clr = isDark ? '#fff' : '#000';
  const ic  = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  return (
    <div style={{ flexShrink: 0, padding: '0.75rem', borderBottom: `1px solid ${bdr}` }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: ic, pointerEvents: 'none' }} />
          <input type="text" placeholder="Поиск по названию..." value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', paddingLeft: '2rem', paddingRight: '0.75rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', borderRadius: '0.5rem', fontSize: '0.875rem', border: `1px solid ${bdr}`, background: bg, color: clr, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <button onClick={onOpenAdvanced} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', padding: '0 10px', borderRadius: '0.5rem', border: `1px solid ${bdr}`, background: 'transparent', color: ic, cursor: 'pointer', minHeight: '38px', flexShrink: 0 }}>
          <SlidersHorizontal size={15} />
          <span style={{ fontSize: '9px', fontWeight: 500, lineHeight: 1 }}>Расширенный</span>
        </button>
      </div>
    </div>
  );
});

const DocLink: React.FC<{ doc: Doc; isDark: boolean; isActive: boolean; }> = memo(({ doc, isDark, isActive }) => {
  const acc = isDark ? '#ffffff' : '#000000';
  const bas = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
  return (
    <a href={`/${doc.slug}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '6px 12px', borderRadius: '0.5rem', fontSize: '0.875rem', textDecoration: 'none', borderLeft: '2px solid', borderLeftColor: isActive ? acc : 'transparent', boxShadow: isActive ? `inset 3px 0 10px -2px ${acc}88` : 'none', color: isActive ? acc : bas, fontWeight: isActive ? 600 : 400, background: 'transparent' }}>
      <span style={{ flexShrink: 0, width: '1rem', height: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {doc.icon && <LucideIcon name={doc.icon} size={15} className={isDark ? 'text-white/60' : 'text-black/60'} />}
      </span>
      <span>{doc.title}</span>
    </a>
  );
});

function countDocsInNode(node: NavNode): number {
  let count = node.docs.length;
  for (const child of Object.values(node.children)) count += countDocsInNode(child);
  return count;
}

const CategoryNode: React.FC<{ node: NavNode; path: string; expandedPaths: Set<string>; onToggle: (path: string) => void; isDark: boolean; currentDocSlug?: string; }> = memo(({ node, path, expandedPaths, onToggle, isDark, currentDocSlug }) => {
  const isExpanded  = expandedPaths.has(path);
  const hasChildren = Object.keys(node.children).length > 0;
  const totalDocs   = countDocsInNode(node);
  const tc = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)';
  const mc = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  const bc = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  return (
    <div>
      <button onClick={() => onToggle(path)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600, border: 'none', background: 'transparent', color: tc, cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ flexShrink: 0, width: '1rem', height: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {hasChildren && (isExpanded ? <ChevronDown size={15} style={{ color: mc }} /> : <ChevronRight size={15} style={{ color: mc }} />)}
          </span>
          <span style={{ flexShrink: 0, width: '1rem', height: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {node.icon && <LucideIcon name={node.icon} size={15} className={isDark ? 'text-white/60' : 'text-black/60'} />}
          </span>
          <span>{node.title}</span>
        </div>
        {totalDocs > 0 && <span style={{ fontSize: '0.75rem', padding: '1px 8px', borderRadius: '4px', background: bc, color: mc }}>{totalDocs}</span>}
      </button>
      {isExpanded && (
        <div style={{ marginLeft: '1rem', marginTop: '0.25rem' }}>
          {node.docs.length > 0 && <div>{[...node.docs].sort((a, b) => a.title.localeCompare(b.title)).map(doc => <DocLink key={doc.id} doc={doc} isDark={isDark} isActive={currentDocSlug === doc.slug} />)}</div>}
          {Object.entries(node.children).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => <CategoryNode key={key} node={child} path={`${path}/${key}`} expandedPaths={expandedPaths} onToggle={onToggle} isDark={isDark} currentDocSlug={currentDocSlug} />)}
        </div>
      )}
    </div>
  );
});

function buildNavigationTree(docs: Doc[], searchQuery: string, activeNavSlug: string): NavNode {
  const root: NavNode = { title: 'Root', slug: '', icon: null, docs: [], children: {}, isCategory: false };
  const query = searchQuery.toLowerCase();
  const filtered = docs.filter(doc => (!query || doc.title.toLowerCase().includes(query)) && (doc.navSlug ?? '') === activeNavSlug);
  for (const doc of filtered) {
    let slugForTree = doc.slug;
    if (activeNavSlug !== '' && doc.slug.startsWith(activeNavSlug + '/')) slugForTree = doc.slug.slice(activeNavSlug.length + 1);
    const parts = slugForTree.split('/');
    const catPath = doc.categoryPath ?? [];
    let current = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current.children[part]) { const ci = catPath[i]; current.children[part] = { title: ci?.title ?? part, slug: part, icon: ci?.icon ?? null, docs: [], children: {}, isCategory: true }; }
      current = current.children[part];
    }
    current.docs.push(doc);
  }
  return root;
}

// ─── Sidebar — строго только десктоп ─────────────────────────────────────────

interface SidebarProps { currentDocSlug?: string; }

const Sidebar: React.FC<SidebarProps> = ({ currentDocSlug }) => {
  const { isDark, toggleTheme } = useTheme();
  
  // КРИТИЧНО: useState(false) — при первом рендере всегда false
  // useEffect потом установит правильное значение
  // Это предотвращает показ sidebar на мобильных при hydration
  const isDesktop = useIsDesktop();

  const { manifest: docs, loading, error } = useManifest();
  const [searchQuery, setSearchQuery]     = useState('');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [showContacts, setShowContacts]   = useState(false);
  const [activeNavSlug, setActiveNavSlug] = useState<string>('');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // ВОТ КЛЮЧЕВОЙ GUARD: если не десктоп — не рендерим НИЧЕГО
  if (!isDesktop) return null;

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
    if (sections.length === 0) return;
    const pathname = globalThis.window.location.pathname.replace(/^\//, '');
    const matched  = sections.filter(s => s.navSlug !== '').find(s => pathname === s.navSlug || pathname.startsWith(s.navSlug + '/'));
    const detected = matched?.navSlug ?? '';
    storageSet('hub:activeNavSlug', detected);
    startTransition(() => setActiveNavSlug(detected));
  }, [sections]);

  useEffect(() => {
    if (!currentDocSlug) return;
    let slugForTree = currentDocSlug;
    if (activeNavSlug !== '' && currentDocSlug.startsWith(activeNavSlug + '/')) slugForTree = currentDocSlug.slice(activeNavSlug.length + 1);
    const parts = slugForTree.split('/');
    const pathParts = parts.slice(0, -1).map((_, i) => parts.slice(0, i + 1).join('/'));
    if (pathParts.length > 0) startTransition(() => setExpandedPaths(new Set(pathParts)));
  }, [currentDocSlug, activeNavSlug]);

  const navTree = useMemo(() => buildNavigationTree(docs as Doc[], searchQuery, activeNavSlug), [docs, searchQuery, activeNavSlug]);

  const togglePath = (path: string) => {
    setExpandedPaths(prev => { const next = new Set(prev); next.has(path) ? next.delete(path) : next.add(path); return next; });
  };

  const sidebarBg  = isDark ? '#0F0F0F' : '#E1E0DC';
  const sidebarBdr = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <>
      <aside style={{ position: 'fixed', left: 0, top: 0, height: '100vh', width: '100%', maxWidth: '20rem', borderRight: `1px solid ${sidebarBdr}`, display: 'flex', flexDirection: 'column', zIndex: 50, background: sidebarBg }}>
        <SidebarHeader isDark={isDark} onToggleTheme={e => toggleTheme(e)} onToggleContacts={() => setShowContacts(!showContacts)} />
        <SidebarSearch value={searchQuery} onChange={setSearchQuery} isDark={isDark} onOpenAdvanced={() => setIsAdvancedOpen(true)} />
        {sections.length > 1 && <NavPopoverSwitcher sections={sections} activeSlug={activeNavSlug} onSelect={slug => { storageSet('hub:activeNavSlug', slug); setActiveNavSlug(slug); setExpandedPaths(new Set()); }} isDark={isDark} />}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
          {error ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '2rem 1.5rem', textAlign: 'center' }}>
              <AlertTriangle size={28} style={{ color: isDark ? 'rgba(251,191,36,0.7)' : 'rgba(180,130,0,0.8)' }} />
              <p style={{ margin: 0, fontSize: '0.8rem', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>Не удалось загрузить список документов</p>
              <button onClick={() => globalThis.window?.location?.reload()} style={{ padding: '0.35rem 0.9rem', borderRadius: '7px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`, background: 'transparent', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', fontSize: '0.75rem', cursor: 'pointer' }}>Обновить</button>
            </div>
          ) : loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontSize: '0.8rem', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>Загрузка...</div>
          ) : (
            <nav>
              {navTree.docs.length > 0 && <div style={{ marginBottom: '1rem' }}>{[...navTree.docs].sort((a, b) => a.title.localeCompare(b.title)).map(doc => <DocLink key={doc.id} doc={doc} isDark={isDark} isActive={currentDocSlug === doc.slug} />)}</div>}
              {Object.entries(navTree.children).sort(([a], [b]) => a.localeCompare(b)).map(([key, node]) => <CategoryNode key={key} node={node} path={key} expandedPaths={expandedPaths} onToggle={togglePath} isDark={isDark} currentDocSlug={currentDocSlug} />)}
            </nav>
          )}
        </div>
      </aside>

      {showContacts && (
        <div style={{ position: 'fixed', left: 0, top: 0, width: '100%', maxWidth: '20rem', height: '100vh', borderRight: `1px solid ${sidebarBdr}`, display: 'flex', flexDirection: 'column', zIndex: 60, background: sidebarBg }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: isDark ? '#fff' : '#000' }}>Контакты</h2>
            <button onClick={() => setShowContacts(false)} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', background: 'transparent', cursor: 'pointer', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}><X size={20} /></button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
            {CONTACTS.map(c => (
              <a key={c.href} href={c.href} target={c.external ? '_blank' : undefined} rel={c.external ? 'noopener noreferrer' : undefined} style={{ display: 'block', padding: '8px 12px', borderRadius: '0.5rem', fontSize: '0.875rem', textDecoration: 'none', color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
                <div style={{ fontWeight: 500 }}>{c.title}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{c.subtitle}</div>
              </a>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {isAdvancedOpen && <Suspense fallback={null}><LazyUnifiedSearchPanel onClose={() => setIsAdvancedOpen(false)} /></Suspense>}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;