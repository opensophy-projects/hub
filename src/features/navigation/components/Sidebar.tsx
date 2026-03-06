import React, { useState, useMemo, useEffect, useRef, lazy, Suspense, memo, useCallback } from 'react';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useDocuments } from '@/features/docs/hooks/useDocuments';
import {
  Search, Sun, Moon, ChevronDown, ChevronRight,
  Mail, X, Home, SlidersHorizontal,
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

const LazyUnifiedSearchPanel = lazy(() => import('./UnifiedSearchPanel'));

// ─── Типы ─────────────────────────────────────────────────────────────────────

interface Doc {
  id: string; slug: string; title: string; description: string;
  type: string; typename: string; icon?: string; author?: string;
  date?: string; tags?: string[]; navSlug?: string; navTitle?: string; navIcon?: string;
}
interface NavNode { title: string; slug: string; docs: Doc[]; children: Record<string, NavNode>; isCategory: boolean; }
interface NavSection { navSlug: string; navTitle: string; navIcon: string; }

// ─── GlowingBorder — точная реализация GlowingEffect ─────────────────────────

const easeOutQuint = (x: number): number => 1 - Math.pow(1 - x, 5);

interface GlowingBorderProps {
  isDark: boolean;
  side?: 'right' | 'left';
  spread?: number;
  movementDuration?: number;
}

const GlowingBorder: React.FC<GlowingBorderProps> = ({
  isDark,
  side = 'right',
  spread = 28,
  movementDuration = 1.8,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPosition = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>(0);
  const tweenRef = useRef<number>(0);

  const animateAngleTransition = useCallback((
    element: HTMLDivElement,
    startValue: number,
    endValue: number,
    duration: number
  ) => {
    cancelAnimationFrame(tweenRef.current);
    const startTime = performance.now();
    const animateValue = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuint(progress);
      const value = startValue + (endValue - startValue) * easedProgress;
      element.style.setProperty('--start', String(value));
      if (progress < 1) tweenRef.current = requestAnimationFrame(animateValue);
    };
    tweenRef.current = requestAnimationFrame(animateValue);
  }, []);

  const handleMove = useCallback((e?: MouseEvent | { x: number; y: number }) => {
    if (!containerRef.current) return;
    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(() => {
      const element = containerRef.current;
      if (!element) return;
      const { left, top, width, height } = element.getBoundingClientRect();
      const mouseX = e?.x ?? lastPosition.current.x;
      const mouseY = e?.y ?? lastPosition.current.y;
      if (e) lastPosition.current = { x: mouseX, y: mouseY };

      const center = [left + width * 0.5, top + height * 0.5];
      const inactiveRadius = 0.5 * Math.min(width, height) * 0.5;
      const distanceFromCenter = Math.hypot(mouseX - center[0], mouseY - center[1]);
      if (distanceFromCenter < inactiveRadius) {
        element.style.setProperty('--active', '0');
        return;
      }

      const proximity = 80;
      const isActive =
        mouseX > left - proximity &&
        mouseX < left + width + proximity &&
        mouseY > top - proximity &&
        mouseY < top + height + proximity;

      element.style.setProperty('--active', isActive ? '1' : '0');
      if (!isActive) return;

      const currentAngle = Number.parseFloat(element.style.getPropertyValue('--start')) || 0;
      let targetAngle = (180 * Math.atan2(mouseY - center[1], mouseX - center[0])) / Math.PI + 90;
      const angleDiff = ((targetAngle - currentAngle + 180) % 360) - 180;
      const newAngle = currentAngle + angleDiff;
      animateAngleTransition(element, currentAngle, newAngle, movementDuration * 1000);
    });
  }, [movementDuration, animateAngleTransition]);

  useEffect(() => {
    const handleScroll = () => handleMove();
    const handlePointerMove = (e: PointerEvent) => handleMove(e);
    globalThis.addEventListener('scroll', handleScroll, { passive: true });
    document.body.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      cancelAnimationFrame(tweenRef.current);
      globalThis.removeEventListener('scroll', handleScroll);
      document.body.removeEventListener('pointermove', handlePointerMove);
    };
  }, [handleMove]);

  // Цвет свечения зависит от темы
  const glowColor = isDark
    ? 'conic-gradient(from 236.84deg at 50% 50%, #7234ff, #a855f7, #7234ff, #4f46e5, #7234ff calc(25% / 5))'
    : 'conic-gradient(from 236.84deg at 50% 50%, #7234ff, #a855f7, #7234ff, #4f46e5, #7234ff calc(25% / 5))';

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        borderRadius: 'inherit',
        '--spread': spread,
        '--start': '0',
        '--active': '0',
        '--gradient': glowColor,
      } as React.CSSProperties}
    >
      <style>{`
        .sidebar-glow-inner {
          position: absolute;
          inset: 0;
          border-radius: inherit;
        }
        .sidebar-glow-inner::after {
          content: "";
          position: absolute;
          border-radius: inherit;
          inset: -1px;
          border: 1px solid transparent;
          background: var(--gradient);
          background-attachment: fixed;
          opacity: var(--active);
          transition: opacity 0.4s ease;
          -webkit-mask-clip: padding-box, border-box;
          mask-clip: padding-box, border-box;
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          -webkit-mask-image: linear-gradient(#0000, #0000),
            conic-gradient(
              from calc((var(--start) - var(--spread)) * 1deg),
              #00000000 0deg,
              #fff,
              #00000000 calc(var(--spread) * 2deg)
            );
          mask-image: linear-gradient(#0000, #0000),
            conic-gradient(
              from calc((var(--start) - var(--spread)) * 1deg),
              #00000000 0deg,
              #fff,
              #00000000 calc(var(--spread) * 2deg)
            );
        }
      `}</style>
      <div className="sidebar-glow-inner" />
    </div>
  );
};

// ─── Динамическая загрузка иконки по имени ────────────────────────────────────

const iconCache = new Map<string, React.FC<{ size?: number; className?: string }>>();

const LucideIcon: React.FC<{ name: string; size?: number; className?: string }> = memo(({ name, size = 16, className }) => {
  const [Icon, setIcon] = useState<React.FC<{ size?: number; className?: string }> | null>(
    () => iconCache.get(name) ?? null
  );

  useEffect(() => {
    if (!name || iconCache.has(name)) return;
    const pascal = name.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
    import('lucide-react').then((mod) => {
      const ic = (mod as Record<string, unknown>)[pascal] as React.FC<{ size?: number; className?: string }> | undefined;
      if (ic) {
        iconCache.set(name, ic);
        setIcon(() => ic);
      }
    });
  }, [name]);

  if (!Icon) return <span style={{ width: size, height: size, display: 'inline-block' }} />;
  return <Icon size={size} className={className} />;
});

// ─── Хелперы стилей ───────────────────────────────────────────────────────────

const borderStyle = (isDark: boolean) => ({
  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
});

const createCloseKeyHandler = (onClose: () => void) => (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClose(); }
};

// ─── NavPopoverSwitcher ───────────────────────────────────────────────────────

const NavPopoverSwitcher: React.FC<{
  sections: NavSection[]; activeSlug: string;
  onSelect: (slug: string) => void; isDark: boolean;
}> = memo(({ sections, activeSlug, onSelect, isDark }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const active = sections.find((s) => s.navSlug === activeSlug) ?? sections[0];
  const bg = isDark ? 'bg-[#0a0a0a]' : 'bg-[#E8E7E3]';
  const border = isDark ? 'border-white/10' : 'border-black/10';
  const hoverItem = isDark ? 'hover:bg-white/5 text-white/80' : 'hover:bg-black/5 text-black/80';
  const activeItem = isDark ? 'bg-white/10 text-white font-medium' : 'bg-black/10 text-black font-medium';

  return (
    <div className={`flex-shrink-0 px-3 py-2`} ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${border} ${
          isDark ? 'hover:bg-white/5 text-white/80' : 'hover:bg-black/5 text-black/80'
        }`}
        style={borderStyle(isDark)}
      >
        <div className="flex items-center gap-2 min-w-0">
          {active.navSlug === ''
            ? <Home size={15} className={isDark ? 'text-white/50' : 'text-black/50'} />
            : <LucideIcon name={active.navIcon} size={15} className={isDark ? 'text-white/50' : 'text-black/50'} />
          }
          <span className="truncate">{active.navTitle}</span>
        </div>
        <ChevronDown
          size={14}
          className={`flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${isDark ? 'text-white/40' : 'text-black/40'}`}
        />
      </button>

      {open && (
        <div
          className={`absolute left-3 right-3 mt-1 rounded-xl border shadow-xl z-50 overflow-hidden ${bg} ${border}`}
          style={{ borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }}
        >
          {sections.map((section) => (
            <button
              key={section.navSlug}
              onClick={() => { onSelect(section.navSlug); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                section.navSlug === activeSlug ? activeItem : hoverItem
              }`}
            >
              {section.navSlug === ''
                ? <Home size={15} className={isDark ? 'text-white/50' : 'text-black/50'} />
                : <LucideIcon name={section.navIcon} size={15} className={isDark ? 'text-white/50' : 'text-black/50'} />
              }
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
    <button
      type="button"
      className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 cursor-default"
      onClick={onClose}
      onKeyDown={createCloseKeyHandler(onClose)}
      aria-label="Закрыть боковую панель"
    />
  );
};

// ─── IconButton ───────────────────────────────────────────────────────────────

const IconButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isDark: boolean;
  title?: string;
}> = ({ icon, label, onClick, isDark, title }) => (
  <button
    onClick={onClick}
    title={title}
    className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg border transition-colors ${
      isDark
        ? 'text-white/70 hover:bg-white/5 hover:text-white border-white/10'
        : 'text-black/70 hover:bg-black/5 hover:text-black border-black/10'
    }`}
  >
    <div className="w-5 h-5 flex items-center justify-center">{icon}</div>
    <span className="text-[9px] font-medium leading-none">{label}</span>
  </button>
);

// ─── SidebarHeader ────────────────────────────────────────────────────────────

const SidebarHeader: React.FC<{
  onClose: () => void; isDark: boolean;
  onToggleTheme: () => void; onToggleContacts: () => void; isDesktop: boolean;
}> = memo(({ onClose, isDark, onToggleTheme, onToggleContacts, isDesktop }) => (
  <div
    className="flex-shrink-0 px-4 py-3 border-b flex items-center justify-between sticky top-0 z-20"
    style={{
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      backgroundColor: isDark ? 'rgba(10,10,10,0.95)' : 'rgba(232,231,227,0.95)',
      backdropFilter: 'blur(10px)',
    }}
  >
    <a href="/" className="flex items-center gap-2">
      <img src="/favicon.png" alt="Opensophy" className="w-7 h-7 object-contain" />
      <h1 className="text-xl font-bold font-veilstack" style={{ color: '#7234ff' }}>hub</h1>
    </a>

    <div className="flex items-center gap-0.5">
      <IconButton
        icon={isDark ? <Sun size={17} /> : <Moon size={17} />}
        label={isDark ? 'Светлая' : 'Тёмная'}
        onClick={onToggleTheme}
        isDark={isDark}
        title={isDark ? 'Светлая тема' : 'Тёмная тема'}
      />
      <IconButton
        icon={<Mail size={17} />}
        label="Контакты"
        onClick={onToggleContacts}
        isDark={isDark}
        title="Контакты"
      />
      {!isDesktop && (
        <button
          onClick={onClose}
          className={`p-2 rounded-lg transition-colors ${isDark ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-black/70 hover:bg-black/5 hover:text-black'}`}
          aria-label="Закрыть меню"
        >
          <X size={18} />
        </button>
      )}
    </div>
  </div>
));

// ─── SidebarSearch ────────────────────────────────────────────────────────────

const SidebarSearch: React.FC<{
  value: string;
  onChange: (value: string) => void;
  isDark: boolean;
  onOpenAdvanced: () => void;
}> = memo(({ value, onChange, isDark, onOpenAdvanced }) => (
  <div className="flex-shrink-0 p-3" style={borderStyle(isDark)}>
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search
          size={15}
          className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-white/40' : 'text-black/40'}`}
        />
        <input
          type="text"
          placeholder="Поиск по названию..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full pl-8 pr-3 py-2 rounded-lg text-sm border transition-colors outline-none ${
            isDark
              ? 'bg-[#0a0a0a] border-white/10 text-white placeholder-white/40 focus:border-white/20'
              : 'bg-[#E8E7E3] border-black/10 text-black placeholder-black/40 focus:border-black/20'
          }`}
        />
      </div>

      <button
        onClick={onOpenAdvanced}
        title="Расширенный поиск"
        className={`flex flex-col items-center justify-center gap-0.5 px-2.5 rounded-lg border transition-colors flex-shrink-0 ${
          isDark
            ? 'border-white/10 text-white/60 hover:bg-white/5 hover:text-white hover:border-white/20'
            : 'border-black/10 text-black/60 hover:bg-black/5 hover:text-black hover:border-black/20'
        }`}
        style={{ minHeight: '38px' }}
      >
        <SlidersHorizontal size={15} />
        <span className="text-[9px] font-medium leading-none">Расширенный</span>
      </button>
    </div>
  </div>
));

// ─── DocLink ──────────────────────────────────────────────────────────────────

const DocLink: React.FC<{ doc: Doc; onClose: () => void; isDark: boolean }> = memo(({ doc, onClose, isDark }) => (
  <a
    href={`/${doc.slug}`}
    onClick={onClose}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
      isDark ? 'text-white/70 hover:text-white hover:bg-white/5' : 'text-black/70 hover:text-black hover:bg-black/5'
    }`}
  >
    {doc.icon && <LucideIcon name={doc.icon} size={20} className={isDark ? 'text-white/60' : 'text-black/60'} />}
    <span>{doc.title}</span>
  </a>
));

// ─── CategoryNode ─────────────────────────────────────────────────────────────

function countDocsInNode(node: NavNode): number {
  let count = node.docs.length;
  Object.values(node.children).forEach((child) => { count += countDocsInNode(child); });
  return count;
}

const CategoryNode: React.FC<{
  node: NavNode; path: string; expandedPaths: Set<string>;
  onToggle: (path: string) => void; onDocClick: () => void; isDark: boolean;
}> = memo(({ node, path, expandedPaths, onToggle, onDocClick, isDark }) => {
  const isExpanded = expandedPaths.has(path);
  const hasChildren = Object.keys(node.children).length > 0;
  const totalDocs = countDocsInNode(node);

  return (
    <div>
      <button
        onClick={() => onToggle(path)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
          isDark ? 'text-white/90 hover:bg-white/5' : 'text-black/90 hover:bg-black/5'
        }`}
      >
        <div className="flex items-center gap-2">
          {hasChildren && (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
          <span>{node.title}</span>
        </div>
        {totalDocs > 0 && (
          <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-white/10 text-white/70' : 'bg-black/10 text-black/70'}`}>
            {totalDocs}
          </span>
        )}
      </button>

      {isExpanded && (
        <div className="ml-4 mt-1 space-y-1">
          {node.docs.length > 0 && (
            <div className="space-y-1">
              {[...node.docs].sort((a, b) => a.title.localeCompare(b.title)).map((doc) => (
                <DocLink key={doc.id} doc={doc} onClose={onDocClick} isDark={isDark} />
              ))}
            </div>
          )}
          {Object.entries(node.children)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, child]) => (
              <CategoryNode
                key={key} node={child} path={`${path}/${key}`}
                expandedPaths={expandedPaths} onToggle={onToggle}
                onDocClick={onDocClick} isDark={isDark}
              />
            ))}
        </div>
      )}
    </div>
  );
});

// ─── buildNavigationTree ──────────────────────────────────────────────────────

function buildNavigationTree(docs: Doc[], searchQuery: string, activeNavSlug: string): NavNode {
  const root: NavNode = { title: 'Root', slug: '', docs: [], children: {}, isCategory: false };
  const query = searchQuery.toLowerCase();

  const filtered = docs.filter((doc) => {
    const matchesSearch = !query || doc.title.toLowerCase().includes(query);
    const matchesSection = (doc.navSlug ?? '') === activeNavSlug;
    return matchesSearch && matchesSection;
  });

  filtered.forEach((doc) => {
    let slugForTree = doc.slug;
    if (activeNavSlug !== '') {
      slugForTree = doc.slug.startsWith(activeNavSlug + '/')
        ? doc.slug.slice(activeNavSlug.length + 1)
        : doc.slug;
    }

    const parts = slugForTree.split('/');
    let current = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current.children[part]) {
        const displayTitle = i === parts.length - 2 && doc.typename ? doc.typename : part;
        current.children[part] = { title: displayTitle, slug: part, docs: [], children: {}, isCategory: true };
      }
      current = current.children[part];
    }
    current.docs.push(doc);
  });

  return root;
}

// ─── CONTACTS ─────────────────────────────────────────────────────────────────

const CONTACTS = [
  { href: 'https://opensophy.com/',                title: 'Сайт',     subtitle: 'opensophy.com',        external: true  },
  { href: 'mailto:opensophy@gmail.com',            title: 'Email',    subtitle: 'opensophy@gmail.com',   external: false },
  { href: 'https://t.me/veilosophy',               title: 'Telegram', subtitle: '@veilosophy',           external: true  },
  { href: 'https://github.com/opensophy-projects',  title: 'GitHub',  subtitle: 'opensophy',             external: true  },
  { href: 'https://habr.com/ru/users/opensophy/',  title: 'Habr',     subtitle: 'opensophy',             external: true  },
];

const ContactLink: React.FC<{
  href: string; title: string; subtitle: string; external: boolean; isDark: boolean;
}> = ({ href, title, subtitle, external, isDark }) => (
  <a
    href={href}
    target={external ? '_blank' : undefined}
    rel={external ? 'noopener noreferrer' : undefined}
    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
      isDark ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-black/70 hover:bg-black/5 hover:text-black'
    }`}
  >
    <div className="font-medium">{title}</div>
    <div className="text-xs opacity-70">{subtitle}</div>
  </a>
);

const ContactsSection: React.FC<{ isDark: boolean; isOpen: boolean; onClose: () => void }> = memo(({
  isDark, isOpen, onClose,
}) => {
  if (!isOpen) return null;
  return (
    <div
      className={`fixed left-0 top-0 w-full md:w-80 h-screen border-r flex flex-col z-50 ${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-[#E8E7E3] border-black/10'}`}
      style={{ position: 'relative' }}
    >
      <div className="flex items-center justify-between p-4">
        <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>Контакты</h2>
        <button
          onClick={onClose}
          className={`p-2 rounded-lg transition-colors ${isDark ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-black/70 hover:bg-black/5 hover:text-black'}`}
          aria-label="Закрыть контакты"
        >
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {CONTACTS.map((c) => (
          <ContactLink key={c.href} {...c} isDark={isDark} />
        ))}
      </div>
    </div>
  );
});

// ─── Sidebar (main) ───────────────────────────────────────────────────────────

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
    if (!isDesktop && isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isSidebarOpen, isDesktop]);

  const sections = useMemo<NavSection[]>(() => {
    const map = new Map<string, NavSection>();
    map.set('', { navSlug: '', navTitle: 'Главная', navIcon: 'home' });
    for (const doc of docs as Doc[]) {
      const slug = doc.navSlug ?? '';
      if (slug && !map.has(slug)) {
        map.set(slug, { navSlug: slug, navTitle: doc.navTitle ?? slug, navIcon: doc.navIcon ?? '' });
      }
    }
    return Array.from(map.values());
  }, [docs]);

  useEffect(() => {
    if (sections.length === 0) return;
    const pathname = window.location.pathname.replace(/^\//, '');
    const matched = sections
      .filter(s => s.navSlug !== '')
      .find(s => pathname === s.navSlug || pathname.startsWith(s.navSlug + '/'));
    const detected = matched ? matched.navSlug : '';
    setActiveNavSlug(detected);
    try { localStorage.setItem('hub:activeNavSlug', detected); } catch {}
  }, [sections]);

  const navTree = useMemo(
    () => buildNavigationTree(docs as Doc[], searchQuery, activeNavSlug),
    [docs, searchQuery, activeNavSlug]
  );

  const togglePath = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  const handleClose = () => setSidebarOpen(false);

  if (!isSidebarOpen && !isDesktop) return null;

  // Базовая граница sidebar
  const baseBorderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const innerBorderColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';

  return (
    <>
      {!isDesktop && <SidebarOverlay onClose={handleClose} />}

      <aside
        className={`fixed left-0 top-0 h-screen w-full md:w-80 flex flex-col z-50 ${
          isDark ? 'bg-[#0a0a0a]' : 'bg-[#E8E7E3]'
        }`}
        style={{
          height: '100vh',
          // Многослойная граница справа: базовая + внутренняя для глубины
          borderRight: `1px solid ${baseBorderColor}`,
          boxShadow: isDark
            ? `1px 0 0 0 ${innerBorderColor}, 4px 0 24px rgba(0,0,0,0.3)`
            : `1px 0 0 0 ${innerBorderColor}, 4px 0 24px rgba(0,0,0,0.06)`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* GlowingBorder — светящаяся граница следящая за курсором */}
        <GlowingBorder isDark={isDark} side="right" spread={30} movementDuration={1.8} />

        {/* Статическая декоративная граница (вторая линия) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '1px',
            height: '100%',
            background: isDark
              ? 'linear-gradient(to bottom, transparent, rgba(114,52,255,0.15) 30%, rgba(114,52,255,0.1) 70%, transparent)'
              : 'linear-gradient(to bottom, transparent, rgba(114,52,255,0.1) 30%, rgba(114,52,255,0.07) 70%, transparent)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />

        <SidebarHeader
          onClose={handleClose} isDark={isDark}
          onToggleTheme={toggleTheme}
          onToggleContacts={() => setShowContacts(!showContacts)}
          isDesktop={isDesktop}
        />
        <SidebarSearch
          value={searchQuery}
          onChange={setSearchQuery}
          isDark={isDark}
          onOpenAdvanced={() => setIsAdvancedSearchOpen(true)}
        />

        {sections.length > 1 && (
          <NavPopoverSwitcher
            sections={sections}
            activeSlug={activeNavSlug}
            onSelect={(slug) => {
              try { localStorage.setItem('hub:activeNavSlug', slug); } catch {}
              setActiveNavSlug(slug);
              setExpandedPaths(new Set());
            }}
            isDark={isDark}
          />
        )}

        <div className="flex-1 overflow-y-auto p-3">
          <nav className="space-y-2">
            {navTree.docs.length > 0 && (
              <div className="space-y-1 mb-4">
                {[...navTree.docs].sort((a, b) => a.title.localeCompare(b.title)).map((doc) => (
                  <DocLink key={doc.id} doc={doc} onClose={handleClose} isDark={isDark} />
                ))}
              </div>
            )}
            {Object.entries(navTree.children)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([key, node]) => (
                <CategoryNode
                  key={key} node={node} path={key}
                  expandedPaths={expandedPaths} onToggle={togglePath}
                  onDocClick={handleClose} isDark={isDark}
                />
              ))}
          </nav>
        </div>
      </aside>

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