import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useDocuments } from '@/features/docs/hooks/useDocuments';
import {
  Search, Sun, Moon, ChevronDown, ChevronRight,
  Mail, X, Home, type LucideProps,
} from 'lucide-react';
import * as icons from 'lucide-react';

interface Doc {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  typename: string;
  icon?: string;
  author?: string;
  date?: string;
  tags?: string[];
  navSlug?: string;
  navTitle?: string;
  navIcon?: string;
}

interface NavNode {
  title: string;
  slug: string;
  docs: Doc[];
  children: Record<string, NavNode>;
  isCategory: boolean;
}

interface NavSection {
  navSlug: string;   // '' = Главная
  navTitle: string;
  navIcon: string;
}

// ─── Dynamic lucide icon resolver ─────────────────────────────────────────────

function toIconName(raw: string): string {
  return raw
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

const LucideIcon: React.FC<{ name: string; size?: number; className?: string }> = ({
  name, size = 16, className,
}) => {
  if (!name) return null;
  const Icon = (icons as unknown as Record<string, React.FC<LucideProps>>)[toIconName(name)];
  if (!Icon) return null;
  return <Icon size={size} className={className} />;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const createCloseKeyHandler = (onClose: () => void) => (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClose(); }
};

const iconBtn = (isDark: boolean) =>
  `p-2 rounded-lg transition-colors ${isDark ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-black/70 hover:bg-black/5 hover:text-black'}`;

const borderStyle = (isDark: boolean) => ({
  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
});

// ─── NavPopover Switcher ───────────────────────────────────────────────────────

const NavPopoverSwitcher: React.FC<{
  sections: NavSection[];
  activeSlug: string;
  onSelect: (slug: string) => void;
  isDark: boolean;
}> = ({ sections, activeSlug, onSelect, isDark }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Закрываем при клике вне
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
    <div className={`flex-shrink-0 px-3 py-2 border-b ${border}`} style={borderStyle(isDark)} ref={ref}>
      {/* Кнопка-триггер */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${border} ${
          isDark ? 'hover:bg-white/5 text-white/80' : 'hover:bg-black/5 text-black/80'
        }`}
        style={borderStyle(isDark)}
      >
        <div className="flex items-center gap-2 min-w-0">
          {active.navSlug === '' ? (
            <Home size={15} className={isDark ? 'text-white/50' : 'text-black/50'} />
          ) : (
            <LucideIcon name={active.navIcon} size={15} className={isDark ? 'text-white/50' : 'text-black/50'} />
          )}
          <span className="truncate">{active.navTitle}</span>
        </div>
        <ChevronDown
          size={14}
          className={`flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${isDark ? 'text-white/40' : 'text-black/40'}`}
        />
      </button>

      {/* Выпадающее меню */}
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
              {section.navSlug === '' ? (
                <Home size={15} className={isDark ? 'text-white/50' : 'text-black/50'} />
              ) : (
                <LucideIcon name={section.navIcon} size={15} className={isDark ? 'text-white/50' : 'text-black/50'} />
              )}
              <span>{section.navTitle}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Subcomponents ────────────────────────────────────────────────────────────

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

const SidebarHeader: React.FC<{
  onClose: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onToggleContacts: () => void;
  isDesktop: boolean;
}> = ({ onClose, isDark, onToggleTheme, onToggleContacts, isDesktop }) => (
  <div
    className="flex-shrink-0 p-4 border-b flex items-center justify-between sticky top-0 z-20"
    style={{
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      backgroundColor: isDark ? 'rgba(10,10,10,0.95)' : 'rgba(232,231,227,0.95)',
      backdropFilter: 'blur(10px)',
    }}
  >
    <a href="/" className="block">
      <h1 className="text-xl font-bold font-veilstack" style={{ color: '#7234ff' }}>hub</h1>
    </a>
    <div className="flex items-center gap-1">
      <button onClick={onToggleTheme} className={iconBtn(isDark)} title={isDark ? 'Светлая тема' : 'Тёмная тема'}>
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <button onClick={onToggleContacts} className={iconBtn(isDark)} title="Контакты">
        <Mail size={18} />
      </button>
      {!isDesktop && (
        <button onClick={onClose} className={iconBtn(isDark)} aria-label="Закрыть меню">
          <X size={18} />
        </button>
      )}
    </div>
  </div>
);

const SidebarSearch: React.FC<{
  value: string;
  onChange: (value: string) => void;
  isDark: boolean;
}> = ({ value, onChange, isDark }) => (
  <div className="flex-shrink-0 p-3 border-b" style={borderStyle(isDark)}>
    <div className="relative">
      <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
      <input
        type="text"
        placeholder="Поиск по названию..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm border transition-colors outline-none ${
          isDark
            ? 'bg-[#0a0a0a] border-white/10 text-white placeholder-white/40 focus:bg-[#0a0a0a] focus:border-white/20'
            : 'bg-[#E8E7E3] border-black/10 text-black placeholder-black/40 focus:border-black/20'
        }`}
      />
    </div>
  </div>
);

const DocLink: React.FC<{ doc: Doc; onClose: () => void; isDark: boolean }> = ({ doc, onClose, isDark }) => (
  <a
    href={`/${doc.slug}`}
    onClick={onClose}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
      isDark ? 'text-white/70 hover:text-white hover:bg-white/5' : 'text-black/70 hover:text-black hover:bg-black/5'
    }`}
  >
    {doc.icon && <LucideIcon name={doc.icon} size={15} className={isDark ? 'text-white/40' : 'text-black/40'} />}
    <span>{doc.title}</span>
  </a>
);

const CategoryNode: React.FC<{
  node: NavNode;
  path: string;
  expandedPaths: Set<string>;
  onToggle: (path: string) => void;
  onDocClick: () => void;
  isDark: boolean;
}> = ({ node, path, expandedPaths, onToggle, onDocClick, isDark }) => {
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
                key={key}
                node={child}
                path={`${path}/${key}`}
                expandedPaths={expandedPaths}
                onToggle={onToggle}
                onDocClick={onDocClick}
                isDark={isDark}
              />
            ))}
        </div>
      )}
    </div>
  );
};

function countDocsInNode(node: NavNode): number {
  let count = node.docs.length;
  Object.values(node.children).forEach((child) => { count += countDocsInNode(child); });
  return count;
}

/**
 * Строит дерево навигации только для документов активной секции.
 * Для Главной (navSlug='') — корневые + папки без navSlug.
 * Для остальных — только документы с совпадающим navSlug, но slug уже содержит navSlug как первый сегмент —
 * его нужно убрать при построении дерева чтобы не создавать лишний уровень.
 */
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

    // Для не-главных секций убираем первый сегмент (navSlug) из slug при построении дерева
    if (activeNavSlug !== '') {
      const withoutNav = doc.slug.startsWith(activeNavSlug + '/')
        ? doc.slug.slice(activeNavSlug.length + 1)
        : doc.slug;
      slugForTree = withoutNav;
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

// ─── Contacts ─────────────────────────────────────────────────────────────────

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

const CONTACTS = [
  { href: 'https://opensophy.com/', title: 'Сайт', subtitle: 'opensophy.com', external: true },
  { href: 'mailto:opensophy@gmail.com', title: 'Email', subtitle: 'opensophy@gmail.com', external: false },
  { href: 'https://t.me/veilosophy', title: 'Telegram', subtitle: '@veilosophy', external: true },
  { href: 'https://github.com/opensophy-projects', title: 'GitHub', subtitle: 'opensophy', external: true },
  { href: 'https://habr.com/ru/users/opensophy/', title: 'Habr', subtitle: 'opensophy', external: true },
];

const ContactsSection: React.FC<{ isDark: boolean; isOpen: boolean; onClose: () => void }> = ({
  isDark, isOpen, onClose,
}) => {
  if (!isOpen) return null;
  return (
    <>
      <button
        type="button"
        className="fixed inset-0 bg-black/50 z-40 cursor-default"
        onClick={onClose}
        onKeyDown={createCloseKeyHandler(onClose)}
        aria-label="Закрыть контакты"
      />
      <div className={`fixed left-0 top-0 w-full md:w-80 h-screen border-r flex flex-col z-50 ${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-[#E8E7E3] border-black/10'}`}>
        <div className="flex items-center justify-between p-4">
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>Контакты</h2>
          <button onClick={onClose} className={iconBtn(isDark)} aria-label="Закрыть контакты">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {CONTACTS.map((c) => (
            <ContactLink key={c.href} href={c.href} title={c.title} subtitle={c.subtitle} external={c.external} isDark={isDark} />
          ))}
        </div>
      </div>
    </>
  );
};

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

const Sidebar: React.FC = () => {
  const { isDark, toggleTheme, isSidebarOpen, setSidebarOpen } = useTheme();
  const { manifest: docs } = useDocuments();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [showContacts, setShowContacts] = useState(false);
  const [activeNavSlug, setActiveNavSlug] = useState<string>('');

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

  useEffect(() => {
    if (!isDesktop && isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isSidebarOpen, isDesktop]);

  // Собираем уникальные секции из манифеста
  const sections = useMemo<NavSection[]>(() => {
    const map = new Map<string, NavSection>();

    // Всегда первая — Главная
    map.set('', { navSlug: '', navTitle: 'Главная', navIcon: 'home' });

    for (const doc of docs as Doc[]) {
      const slug = doc.navSlug ?? '';
      if (slug && !map.has(slug)) {
        map.set(slug, {
          navSlug: slug,
          navTitle: doc.navTitle ?? slug,
          navIcon: doc.navIcon ?? '',
        });
      }
    }

    return Array.from(map.values());
  }, [docs]);

  // Определяем активную секцию по текущему URL
  useEffect(() => {
    if (sections.length === 0) return;
    const pathname = window.location.pathname.replace(/^\//, ''); // убираем ведущий /

    // Ищем секцию, чей navSlug является префиксом текущего пути
    const matched = sections
      .filter(s => s.navSlug !== '') // сначала ищем среди не-главных
      .find(s => pathname === s.navSlug || pathname.startsWith(s.navSlug + '/'));

    const detected = matched ? matched.navSlug : '';
    setActiveNavSlug(detected);
    try { localStorage.setItem('hub:activeNavSlug', detected); } catch {}
  }, [sections]);

  // Показываем NavPopoverSwitcher только если есть хоть одна не-главная секция
  const hasMultipleSections = sections.length > 1;

  const navTree = useMemo(
    () => buildNavigationTree(docs as Doc[], searchQuery, activeNavSlug),
    [docs, searchQuery, activeNavSlug]
  );

  const togglePath = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) { next.delete(path); } else { next.add(path); }
      return next;
    });
  };

  const handleClose = () => setSidebarOpen(false);

  if (!isSidebarOpen && !isDesktop) return null;

  return (
    <>
      {!isDesktop && <SidebarOverlay onClose={handleClose} />}
      <aside
        className={`fixed left-0 top-0 h-screen w-full md:w-80 border-r flex flex-col z-50 ${
          isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-[#E8E7E3] border-black/10'
        } ${isDesktop ? 'md:top-16' : ''}`}
        style={{ height: isDesktop ? 'calc(100vh - 4rem)' : '100vh' }}
      >
        <SidebarHeader
          onClose={handleClose}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onToggleContacts={() => setShowContacts(!showContacts)}
          isDesktop={isDesktop}
        />
        <SidebarSearch value={searchQuery} onChange={setSearchQuery} isDark={isDark} />

        {/* Nav-popover switcher — только если есть несколько секций */}
        {hasMultipleSections && (
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
                  key={key}
                  node={node}
                  path={key}
                  expandedPaths={expandedPaths}
                  onToggle={togglePath}
                  onDocClick={handleClose}
                  isDark={isDark}
                />
              ))}
          </nav>
        </div>
      </aside>
      <ContactsSection isDark={isDark} isOpen={showContacts} onClose={() => setShowContacts(false)} />
    </>
  );
};

export default Sidebar;