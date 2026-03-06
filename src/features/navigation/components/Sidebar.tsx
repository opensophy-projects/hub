import React, { useState, useMemo, useEffect, useRef, lazy, Suspense, memo, useCallback } from 'react';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useDocuments } from '@/features/docs/hooks/useDocuments';
import {
  Search, Sun, Moon, ChevronDown, ChevronRight,
  Mail, X, Home, SlidersHorizontal,
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

const LazyUnifiedSearchPanel = lazy(() => import('./UnifiedSearchPanel'));

interface Doc {
  id: string; slug: string; title: string; description: string;
  type: string; typename: string; icon?: string; author?: string;
  date?: string; tags?: string[]; navSlug?: string; navTitle?: string; navIcon?: string;
}
interface NavNode { title: string; slug: string; docs: Doc[]; children: Record<string, NavNode>; isCategory: boolean; }
interface NavSection { navSlug: string; navTitle: string; navIcon: string; }

// ─── GlowingEffect — точная копия механики из GlowingEffect.tsx ──────────────

const easeOutQuint = (x: number): number => 1 - Math.pow(1 - x, 5);

const GlowingEffect = memo(({
  spread = 20,
  movementDuration = 2,
  borderWidth = 1,
  inactiveZone = 0.7,
  proximity = 0,
  isDark = true,
}: {
  spread?: number;
  movementDuration?: number;
  borderWidth?: number;
  inactiveZone?: number;
  proximity?: number;
  isDark?: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPosition = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>(0);

  const animateAngleTransition = useCallback((
    element: HTMLDivElement,
    startValue: number,
    endValue: number,
    duration: number
  ) => {
    const startTime = performance.now();
    const animateValue = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuint(progress);
      const value = startValue + (endValue - startValue) * easedProgress;
      element.style.setProperty('--start', String(value));
      if (progress < 1) requestAnimationFrame(animateValue);
    };
    requestAnimationFrame(animateValue);
  }, []);

  const handleMove = useCallback((e?: MouseEvent | { x: number; y: number }) => {
    if (!containerRef.current) return;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(() => {
      const element = containerRef.current;
      if (!element) return;
      const { left, top, width, height } = element.getBoundingClientRect();
      const mouseX = e?.x ?? lastPosition.current.x;
      const mouseY = e?.y ?? lastPosition.current.y;
      if (e) lastPosition.current = { x: mouseX, y: mouseY };

      const center = [left + width * 0.5, top + height * 0.5];
      const distanceFromCenter = Math.hypot(mouseX - center[0], mouseY - center[1]);
      const inactiveRadius = 0.5 * Math.min(width, height) * inactiveZone;

      if (distanceFromCenter < inactiveRadius) {
        element.style.setProperty('--active', '0');
        return;
      }

      const isActive =
        mouseX > left - proximity &&
        mouseX < left + width + proximity &&
        mouseY > top - proximity &&
        mouseY < top + height + proximity;

      element.style.setProperty('--active', isActive ? '1' : '0');
      if (!isActive) return;

      const currentAngle = Number.parseFloat(element.style.getPropertyValue('--start')) || 0;
      const targetAngle = (180 * Math.atan2(mouseY - center[1], mouseX - center[0])) / Math.PI + 90;
      const angleDiff = ((targetAngle - currentAngle + 180) % 360) - 180;
      const newAngle = currentAngle + angleDiff;
      animateAngleTransition(element, currentAngle, newAngle, movementDuration * 1000);
    });
  }, [inactiveZone, proximity, movementDuration, animateAngleTransition]);

  useEffect(() => {
    const handleScroll = () => handleMove();
    const handlePointerMove = (e: PointerEvent) => handleMove(e);
    globalThis.addEventListener('scroll', handleScroll, { passive: true });
    document.body.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      globalThis.removeEventListener('scroll', handleScroll);
      document.body.removeEventListener('pointermove', handlePointerMove);
    };
  }, [handleMove]);

  // repeating-conic-gradient — точно как в оригинале GlowingEffect.tsx
  // isNegative=true вариант (белый) для тёмной темы
  const gradient = isDark
    ? `repeating-conic-gradient(from 236.84deg at 50% 50%, #ffffff, #ffffff calc(25% / var(--repeating-conic-gradient-times)))`
    : `repeating-conic-gradient(from 236.84deg at 50% 50%, #000000, #000000 calc(25% / var(--repeating-conic-gradient-times)))`;

  return (
    <>
      {/* Статичная базовая граница */}
      <div
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          border: `${borderWidth}px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}`,
          zIndex: 0,
        }}
      />
      {/* Динамическая светящаяся граница — точно механика из GlowingEffect.tsx */}
      <div
        ref={containerRef}
        style={{
          '--spread': spread,
          '--start': '0',
          '--active': '0',
          '--glowingeffect-border-width': `${borderWidth}px`,
          '--repeating-conic-gradient-times': '5',
          '--gradient': gradient,
          pointerEvents: 'none',
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          zIndex: 0,
        } as React.CSSProperties}
      >
        <div className="sidebar-glowing-inner" />
      </div>
      <style>{`
        .sidebar-glowing-inner {
          border-radius: inherit;
          position: absolute;
          inset: 0;
        }
        .sidebar-glowing-inner::after {
          content: "";
          border-radius: inherit;
          position: absolute;
          inset: calc(-1 * var(--glowingeffect-border-width));
          border: var(--glowingeffect-border-width) solid transparent;
          background: var(--gradient);
          background-attachment: fixed;
          opacity: var(--active);
          transition: opacity 0.3s;
          mask-clip: padding-box, border-box;
          mask-composite: intersect;
          mask-image:
            linear-gradient(#0000, #0000),
            conic-gradient(
              from calc((var(--start) - var(--spread)) * 1deg),
              #00000000 0deg,
              #fff,
              #00000000 calc(var(--spread) * 2deg)
            );
        }
      `}</style>
    </>
  );
});

// ─── Иконки ───────────────────────────────────────────────────────────────────

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
  if (!Icon) return <span style={{ width: size, height: size, display: 'inline-block' }} />;
  return <Icon size={size} className={className} />;
});

const createCloseKeyHandler = (onClose: () => void) => (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClose(); }
};

// ─── NavPopoverSwitcher ───────────────────────────────────────────────────────

const NavPopoverSwitcher: React.FC<{
  sections: NavSection[]; activeSlug: string; onSelect: (slug: string) => void; isDark: boolean;
}> = memo(({ sections, activeSlug, onSelect, isDark }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const active = sections.find((s) => s.navSlug === activeSlug) ?? sections[0];
  const hoverItem = isDark ? 'hover:bg-white/5 text-white/80' : 'hover:bg-black/5 text-black/80';
  const activeItem = isDark ? 'bg-white/10 text-white font-medium' : 'bg-black/10 text-black font-medium';

  return (
    <div className="flex-shrink-0 px-3 py-2" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${isDark ? 'border-white/10 hover:bg-white/5 text-white/80' : 'border-black/10 hover:bg-black/5 text-black/80'}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {active.navSlug === '' ? <Home size={15} className={isDark ? 'text-white/50' : 'text-black/50'} /> : <LucideIcon name={active.navIcon} size={15} className={isDark ? 'text-white/50' : 'text-black/50'} />}
          <span className="truncate">{active.navTitle}</span>
        </div>
        <ChevronDown size={14} className={`flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${isDark ? 'text-white/40' : 'text-black/40'}`} />
      </button>
      {open && (
        <div className={`absolute left-3 right-3 mt-1 rounded-xl border shadow-xl z-50 overflow-hidden ${isDark ? 'bg-[#0f0f0f] border-white/10' : 'bg-[#E8E7E3] border-black/10'}`}>
          {sections.map((section) => (
            <button key={section.navSlug} onClick={() => { onSelect(section.navSlug); setOpen(false); }} className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${section.navSlug === activeSlug ? activeItem : hoverItem}`}>
              {section.navSlug === '' ? <Home size={15} className={isDark ? 'text-white/50' : 'text-black/50'} /> : <LucideIcon name={section.navIcon} size={15} className={isDark ? 'text-white/50' : 'text-black/50'} />}
              <span>{section.navTitle}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

// ─── SidebarOverlay ───────────────────────────────────────────────────────────

const SidebarOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);
  return (
    <button type="button" className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 cursor-default" onClick={onClose} onKeyDown={createCloseKeyHandler(onClose)} aria-label="Закрыть боковую панель" />
  );
};

// ─── IconButton ───────────────────────────────────────────────────────────────

const IconButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; isDark: boolean; title?: string }> = ({ icon, label, onClick, isDark, title }) => (
  <button onClick={onClick} title={title} className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg border transition-colors ${isDark ? 'text-white/70 hover:bg-white/5 hover:text-white border-white/10' : 'text-black/70 hover:bg-black/5 hover:text-black border-black/10'}`}>
    <div className="w-5 h-5 flex items-center justify-center">{icon}</div>
    <span className="text-[9px] font-medium leading-none">{label}</span>
  </button>
);

// ─── SidebarHeader ────────────────────────────────────────────────────────────

const SidebarHeader: React.FC<{
  onClose: () => void; isDark: boolean; onToggleTheme: () => void; onToggleContacts: () => void; isDesktop: boolean;
}> = memo(({ onClose, isDark, onToggleTheme, onToggleContacts, isDesktop }) => (
  <div
    className="flex-shrink-0 px-4 py-3 border-b flex items-center justify-between sticky top-0 z-20"
    style={{
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      backgroundColor: isDark ? 'rgba(10,10,10,0.97)' : 'rgba(232,231,227,0.97)',
      backdropFilter: 'blur(10px)',
    }}
  >
    <a href="/" className="flex items-center gap-2">
      <img src="/favicon.png" alt="Opensophy" className="w-7 h-7 object-contain" />
      <h1 className="text-xl font-bold font-veilstack" style={{ color: '#7234ff' }}>hub</h1>
    </a>
    <div className="flex items-center gap-0.5">
      <IconButton icon={isDark ? <Sun size={17} /> : <Moon size={17} />} label={isDark ? 'Светлая' : 'Тёмная'} onClick={onToggleTheme} isDark={isDark} />
      <IconButton icon={<Mail size={17} />} label="Контакты" onClick={onToggleContacts} isDark={isDark} />
      {!isDesktop && (
        <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${isDark ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-black/70 hover:bg-black/5 hover:text-black'}`} aria-label="Закрыть меню"><X size={18} /></button>
      )}
    </div>
  </div>
));

// ─── SidebarSearch ────────────────────────────────────────────────────────────

const SidebarSearch: React.FC<{
  value: string; onChange: (value: string) => void; isDark: boolean; onOpenAdvanced: () => void;
}> = memo(({ value, onChange, isDark, onOpenAdvanced }) => (
  <div className="flex-shrink-0 p-3">
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
        <input type="text" placeholder="Поиск по названию..." value={value} onChange={(e) => onChange(e.target.value)}
          className={`w-full pl-8 pr-3 py-2 rounded-lg text-sm border transition-colors outline-none ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:border-white/20' : 'bg-black/5 border-black/10 text-black placeholder-black/40 focus:border-black/20'}`} />
      </div>
      <button onClick={onOpenAdvanced} title="Расширенный поиск"
        className={`flex flex-col items-center justify-center gap-0.5 px-2.5 rounded-lg border transition-colors flex-shrink-0 ${isDark ? 'border-white/10 text-white/60 hover:bg-white/5 hover:text-white' : 'border-black/10 text-black/60 hover:bg-black/5 hover:text-black'}`}
        style={{ minHeight: '38px' }}>
        <SlidersHorizontal size={15} />
        <span className="text-[9px] font-medium leading-none">Расширенный</span>
      </button>
    </div>
  </div>
));

// ─── DocLink / CategoryNode ────────────────────────────────────────────────────

const DocLink: React.FC<{ doc: Doc; onClose: () => void; isDark: boolean }> = memo(({ doc, onClose, isDark }) => (
  <a href={`/${doc.slug}`} onClick={onClose} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${isDark ? 'text-white/70 hover:text-white hover:bg-white/5' : 'text-black/70 hover:text-black hover:bg-black/5'}`}>
    {doc.icon && <LucideIcon name={doc.icon} size={20} className={isDark ? 'text-white/60' : 'text-black/60'} />}
    <span>{doc.title}</span>
  </a>
));

function countDocsInNode(node: NavNode): number {
  let count = node.docs.length;
  Object.values(node.children).forEach((child) => { count += countDocsInNode(child); });
  return count;
}

const CategoryNode: React.FC<{
  node: NavNode; path: string; expandedPaths: Set<string>; onToggle: (path: string) => void; onDocClick: () => void; isDark: boolean;
}> = memo(({ node, path, expandedPaths, onToggle, onDocClick, isDark }) => {
  const isExpanded = expandedPaths.has(path);
  const hasChildren = Object.keys(node.children).length > 0;
  const totalDocs = countDocsInNode(node);
  return (
    <div>
      <button onClick={() => onToggle(path)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${isDark ? 'text-white/90 hover:bg-white/5' : 'text-black/90 hover:bg-black/5'}`}>
        <div className="flex items-center gap-2">
          {hasChildren && (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
          <span>{node.title}</span>
        </div>
        {totalDocs > 0 && <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-white/10 text-white/70' : 'bg-black/10 text-black/70'}`}>{totalDocs}</span>}
      </button>
      {isExpanded && (
        <div className="ml-4 mt-1 space-y-1">
          {node.docs.length > 0 && <div className="space-y-1">{[...node.docs].sort((a, b) => a.title.localeCompare(b.title)).map((doc) => <DocLink key={doc.id} doc={doc} onClose={onDocClick} isDark={isDark} />)}</div>}
          {Object.entries(node.children).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => <CategoryNode key={key} node={child} path={`${path}/${key}`} expandedPaths={expandedPaths} onToggle={onToggle} onDocClick={onDocClick} isDark={isDark} />)}
        </div>
      )}
    </div>
  );
});

function buildNavigationTree(docs: Doc[], searchQuery: string, activeNavSlug: string): NavNode {
  const root: NavNode = { title: 'Root', slug: '', docs: [], children: {}, isCategory: false };
  const query = searchQuery.toLowerCase();
  const filtered = docs.filter((doc) => (!query || doc.title.toLowerCase().includes(query)) && (doc.navSlug ?? '') === activeNavSlug);
  filtered.forEach((doc) => {
    let slugForTree = doc.slug;
    if (activeNavSlug !== '') slugForTree = doc.slug.startsWith(activeNavSlug + '/') ? doc.slug.slice(activeNavSlug.length + 1) : doc.slug;
    const parts = slugForTree.split('/');
    let current = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current.children[part]) {
        current.children[part] = { title: i === parts.length - 2 && doc.typename ? doc.typename : part, slug: part, docs: [], children: {}, isCategory: true };
      }
      current = current.children[part];
    }
    current.docs.push(doc);
  });
  return root;
}

const CONTACTS = [
  { href: 'https://opensophy.com/', title: 'Сайт', subtitle: 'opensophy.com', external: true },
  { href: 'mailto:opensophy@gmail.com', title: 'Email', subtitle: 'opensophy@gmail.com', external: false },
  { href: 'https://t.me/veilosophy', title: 'Telegram', subtitle: '@veilosophy', external: true },
  { href: 'https://github.com/opensophy-projects', title: 'GitHub', subtitle: 'opensophy', external: true },
  { href: 'https://habr.com/ru/users/opensophy/', title: 'Habr', subtitle: 'opensophy', external: true },
];

const ContactsSection: React.FC<{ isDark: boolean; isOpen: boolean; onClose: () => void }> = memo(({ isDark, isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className={`fixed left-0 top-0 w-full md:w-80 h-screen border-r flex flex-col z-50 ${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-[#E8E7E3] border-black/10'}`}>
      <div className="flex items-center justify-between p-4">
        <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>Контакты</h2>
        <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${isDark ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-black/70 hover:bg-black/5 hover:text-black'}`}><X size={20} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {CONTACTS.map((c) => (
          <a key={c.href} href={c.href} target={c.external ? '_blank' : undefined} rel={c.external ? 'noopener noreferrer' : undefined}
            className={`block px-3 py-2 rounded-lg text-sm transition-colors ${isDark ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-black/70 hover:bg-black/5 hover:text-black'}`}>
            <div className="font-medium">{c.title}</div>
            <div className="text-xs opacity-70">{c.subtitle}</div>
          </a>
        ))}
      </div>
    </div>
  );
});

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const Sidebar: React.FC = () => {
  const { isDark, toggleTheme, isSidebarOpen, setSidebarOpen } = useTheme();
  const { manifest: docs } = useDocuments();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [showContacts, setShowContacts] = useState(false);
  const [activeNavSlug, setActiveNavSlug] = useState<string>('');
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

  useEffect(() => {
    if (!isDesktop && isSidebarOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isSidebarOpen, isDesktop]);

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
    const pathname = window.location.pathname.replace(/^\//, '');
    const matched = sections.filter(s => s.navSlug !== '').find(s => pathname === s.navSlug || pathname.startsWith(s.navSlug + '/'));
    const detected = matched ? matched.navSlug : '';
    setActiveNavSlug(detected);
    try { localStorage.setItem('hub:activeNavSlug', detected); } catch {}
  }, [sections]);

  const navTree = useMemo(() => buildNavigationTree(docs as Doc[], searchQuery, activeNavSlug), [docs, searchQuery, activeNavSlug]);

  const togglePath = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  const handleClose = () => setSidebarOpen(false);
  if (!isSidebarOpen && !isDesktop) return null;

  return (
    <>
      {!isDesktop && <SidebarOverlay onClose={handleClose} />}

      {/* Позиционирующий контейнер */}
      <div
        className="fixed left-0 top-0 h-screen z-50"
        style={{ width: isDesktop ? '20rem' : '100%' }}
      >
        {/*
          На десктопе: карточка с отступами и rounded углами — точно как на image 1.
          На мобильном: полная высота без отступов.
        */}
        <div
          style={{
            position: 'relative',
            height: '100%',
            // Отступы чтобы карточка не прилипала к краям экрана
            padding: isDesktop ? '12px 0 12px 12px' : '0',
          }}
        >
          {/* Сама карточка */}
          <div
            className={`relative flex flex-col h-full ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#E8E7E3]'}`}
            style={{
              borderRadius: isDesktop ? '16px' : '0',
              overflow: 'hidden',
            }}
          >
            {/* GlowingEffect только на десктопе */}
            {isDesktop && (
              <GlowingEffect
                spread={25}
                movementDuration={2}
                borderWidth={1}
                inactiveZone={0.7}
                proximity={40}
                isDark={isDark}
              />
            )}

            {/* Контент поверх glowing эффекта */}
            <div className="relative z-10 flex flex-col h-full" style={{ overflow: 'hidden' }}>
              <SidebarHeader onClose={handleClose} isDark={isDark} onToggleTheme={toggleTheme} onToggleContacts={() => setShowContacts(!showContacts)} isDesktop={isDesktop} />
              <SidebarSearch value={searchQuery} onChange={setSearchQuery} isDark={isDark} onOpenAdvanced={() => setIsAdvancedSearchOpen(true)} />

              {sections.length > 1 && (
                <NavPopoverSwitcher sections={sections} activeSlug={activeNavSlug} onSelect={(slug) => {
                  try { localStorage.setItem('hub:activeNavSlug', slug); } catch {}
                  setActiveNavSlug(slug);
                  setExpandedPaths(new Set());
                }} isDark={isDark} />
              )}

              <div className="flex-1 overflow-y-auto p-3">
                <nav className="space-y-2">
                  {navTree.docs.length > 0 && (
                    <div className="space-y-1 mb-4">
                      {[...navTree.docs].sort((a, b) => a.title.localeCompare(b.title)).map((doc) => <DocLink key={doc.id} doc={doc} onClose={handleClose} isDark={isDark} />)}
                    </div>
                  )}
                  {Object.entries(navTree.children).sort(([a], [b]) => a.localeCompare(b)).map(([key, node]) => (
                    <CategoryNode key={key} node={node} path={key} expandedPaths={expandedPaths} onToggle={togglePath} onDocClick={handleClose} isDark={isDark} />
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ContactsSection isDark={isDark} isOpen={showContacts} onClose={() => setShowContacts(false)} />

      <AnimatePresence>
        {isAdvancedSearchOpen && (
          <Suspense fallback={null}>
            <LazyUnifiedSearchPanel onClose={() => setIsAdvancedSearchOpen(false)} />
          </Suspense>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;