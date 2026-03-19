import React, { useState, useMemo, useEffect, useRef, lazy, Suspense, memo, startTransition } from 'react';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useDocuments } from '@/features/docs/hooks/useDocuments';
import { storageSet } from '@/shared/lib/storage';
import { CONTACTS } from '@/shared/data/contacts';
import {
  Search, Sun, Moon, ChevronDown, ChevronRight,
  Mail, X, Home, SlidersHorizontal, AlertTriangle,
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

const LazyUnifiedSearchPanel = lazy(() => import('./UnifiedSearchPanel'));

interface CategoryPathItem {
  slug: string;
  title: string;
  icon: string | null;
}

interface Doc {
  id: string; slug: string; title: string; description: string;
  type: string; typename: string; icon?: string; author?: string;
  date?: string; tags?: string[]; navSlug?: string; navTitle?: string; navIcon?: string;
  categoryPath?: CategoryPathItem[];
}

interface NavNode {
  title: string;
  slug: string;
  icon: string | null;
  docs: Doc[];
  children: Record<string, NavNode>;
  isCategory: boolean;
}

interface NavSection { navSlug: string; navTitle: string; navIcon: string; }

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

  if (!Icon) return <span style={{ width: size, height: size, display: 'inline-block', flexShrink: 0 }} />;
  return <Icon size={size} className={className} />;
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

  const active = useMemo(
    () => sections.find((s) => s.navSlug === activeSlug) ?? sections[0],
    [sections, activeSlug]
  );

  const popBg = isDark ? '#0F0F0F' : '#E1E0DC';
  const borderClr = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const textClr = isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)';
  const hoverBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const activeBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const mutedClr = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
  const chevClr = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  return (
    <div className="flex-shrink-0 px-3 py-2" ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
          fontSize: '0.875rem', border: `1px solid ${borderClr}`,
          background: 'transparent', color: textClr, cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
          {active.navSlug === ''
            ? <Home size={15} style={{ color: mutedClr }} />
            : <LucideIcon key={active.navSlug} name={active.navIcon} size={15} className={isDark ? 'text-white/50' : 'text-black/50'} />
          }
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{active.navTitle}</span>
        </div>
        <ChevronDown
          size={14}
          style={{
            flexShrink: 0,
            color: chevClr,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
          }}
        />
      </button>

      {open && (
        <div style={{
          position: 'absolute', left: '0.75rem', right: '0.75rem', marginTop: '0.25rem',
          borderRadius: '0.75rem', border: `1px solid ${borderClr}`,
          boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.7)' : '0 8px 24px rgba(0,0,0,0.15)',
          zIndex: 50, overflow: 'hidden', background: popBg,
        }}>
          {sections.map((section) => (
            <button
              key={section.navSlug}
              onClick={() => { onSelect(section.navSlug); setOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem',
                padding: '0.625rem 0.75rem', fontSize: '0.875rem',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                background: section.navSlug === activeSlug ? activeBg : 'transparent',
                color: section.navSlug === activeSlug ? (isDark ? '#fff' : '#000') : textClr,
                fontWeight: section.navSlug === activeSlug ? 600 : 400,
              }}
            >
              {section.navSlug === ''
                ? <Home size={15} style={{ color: mutedClr }} />
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
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)', zIndex: 40, cursor: 'default',
        border: 'none', padding: 0,
      }}
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
  onClick: (e: React.MouseEvent) => void;
  isDark: boolean;
  title?: string;
}> = ({ icon, label, onClick, isDark, title }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: '2px', padding: '6px 8px',
      borderRadius: '0.5rem',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
      background: 'transparent',
      color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
      cursor: 'pointer',
    }}
  >
    <div style={{ width: '1.25rem', height: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
    <span style={{ fontSize: '9px', fontWeight: 500, lineHeight: 1 }}>{label}</span>
  </button>
);

// ─── SidebarHeader ────────────────────────────────────────────────────────────

const SidebarHeader: React.FC<{
  onClose: () => void; isDark: boolean;
  onToggleTheme: (e: React.MouseEvent) => void;
  onToggleContacts: () => void; isDesktop: boolean;
}> = memo(({ onClose, isDark, onToggleTheme, onToggleContacts, isDesktop }) => (
  <div
    style={{
      flexShrink: 0, padding: '0.75rem 1rem',
      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 20,
      backgroundColor: isDark ? 'rgba(15,15,15,0.95)' : 'rgba(225,224,220,0.95)',
      backdropFilter: 'blur(10px)',
    }}
  >
    <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
      <img src="/favicon.png" alt="Opensophy" style={{ width: '1.75rem', height: '1.75rem', objectFit: 'contain' }} />
      <h1 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'customfont', color: '#7234ff', margin: 0 }}>hub</h1>
    </a>

    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
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
          style={{
            padding: '0.5rem', borderRadius: '0.5rem', border: 'none',
            background: 'transparent', cursor: 'pointer',
            color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
          }}
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
}> = memo(({ value, onChange, isDark, onOpenAdvanced }) => {
  const borderClr = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const inputBg = isDark ? '#0F0F0F' : '#E1E0DC';
  const inputClr = isDark ? '#fff' : '#000';
  const plhClr = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const iconClr = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const btnClr = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';

  return (
    <div style={{ flexShrink: 0, padding: '0.75rem', borderBottom: `1px solid ${borderClr}` }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: iconClr, pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Поиск по названию..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: '100%', paddingLeft: '2rem', paddingRight: '0.75rem',
              paddingTop: '0.5rem', paddingBottom: '0.5rem',
              borderRadius: '0.5rem', fontSize: '0.875rem',
              border: `1px solid ${borderClr}`,
              background: inputBg, color: inputClr, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          onClick={onOpenAdvanced}
          title="Расширенный поиск"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: '2px', padding: '0 10px',
            borderRadius: '0.5rem',
            border: `1px solid ${borderClr}`,
            background: 'transparent', color: btnClr, cursor: 'pointer',
            minHeight: '38px', flexShrink: 0,
          }}
        >
          <SlidersHorizontal size={15} />
          <span style={{ fontSize: '9px', fontWeight: 500, lineHeight: 1 }}>Расширенный</span>
        </button>
      </div>
    </div>
  );
});

// ─── DocLink ──────────────────────────────────────────────────────────────────

const DocLink: React.FC<{
  doc: Doc;
  isDark: boolean;
  isActive: boolean;
}> = memo(({ doc, isDark, isActive }) => {
  const accentColor = isDark ? '#ffffff' : '#000000';
  const baseClr = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';

  return (
    <a
      href={`/${doc.slug}`}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '6px 12px', borderRadius: '0.5rem', fontSize: '0.875rem',
        textDecoration: 'none',
        borderLeft: '2px solid',
        borderLeftColor: isActive ? accentColor : 'transparent',
        boxShadow: isActive ? `inset 3px 0 10px -2px ${accentColor}88` : 'none',
        textShadow: isActive ? `0 0 12px ${accentColor}66` : 'none',
        color: isActive ? accentColor : baseClr,
        fontWeight: isActive ? 600 : 400,
        background: 'transparent',
      }}
    >
      <span style={{ flexShrink: 0, width: '1rem', height: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {doc.icon && (
          <LucideIcon name={doc.icon} size={15} className={isDark ? 'text-white/60' : 'text-black/60'} />
        )}
      </span>
      <span>{doc.title}</span>
    </a>
  );
});

// ─── Nav tree helpers ─────────────────────────────────────────────────────────

function countDocsInNode(node: NavNode): number {
  let count = node.docs.length;
  for (const child of Object.values(node.children)) count += countDocsInNode(child);
  return count;
}

// ─── CategoryNode ─────────────────────────────────────────────────────────────

const CategoryNode: React.FC<{
  node: NavNode; path: string; expandedPaths: Set<string>;
  onToggle: (path: string) => void; onDocClick: () => void; isDark: boolean;
  currentDocSlug?: string;
}> = memo(({ node, path, expandedPaths, onToggle, onDocClick, isDark, currentDocSlug }) => {
  const isExpanded = expandedPaths.has(path);
  const hasChildren = Object.keys(node.children).length > 0;
  const totalDocs = countDocsInNode(node);
  const textClr = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)';
  const mutedClr = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  const badgeBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <div>
      <button
        onClick={() => onToggle(path)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600,
          border: 'none', background: 'transparent', color: textClr, cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ flexShrink: 0, width: '1rem', height: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {hasChildren && (
              isExpanded
                ? <ChevronDown size={15} style={{ color: mutedClr }} />
                : <ChevronRight size={15} style={{ color: mutedClr }} />
            )}
          </span>
          <span style={{ flexShrink: 0, width: '1rem', height: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {node.icon && (
              <LucideIcon name={node.icon} size={15} className={isDark ? 'text-white/60' : 'text-black/60'} />
            )}
          </span>
          <span>{node.title}</span>
        </div>
        {totalDocs > 0 && (
          <span style={{
            fontSize: '0.75rem', padding: '1px 8px', borderRadius: '4px',
            background: badgeBg, color: mutedClr,
          }}>
            {totalDocs}
          </span>
        )}
      </button>

      {isExpanded && (
        <div style={{ marginLeft: '1rem', marginTop: '0.25rem' }}>
          {node.docs.length > 0 && (
            <div>
              {[...node.docs].sort((a, b) => a.title.localeCompare(b.title)).map((doc) => (
                <DocLink
                  key={doc.id}
                  doc={doc}
                  isDark={isDark}
                  isActive={currentDocSlug === doc.slug}
                />
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
                currentDocSlug={currentDocSlug}
              />
            ))}
        </div>
      )}
    </div>
  );
});

// ─── buildNavigationTree ──────────────────────────────────────────────────────

function buildNavigationTree(docs: Doc[], searchQuery: string, activeNavSlug: string): NavNode {
  const root: NavNode = { title: 'Root', slug: '', icon: null, docs: [], children: {}, isCategory: false };
  const query = searchQuery.toLowerCase();

  const filtered = docs.filter((doc) => {
    const matchesSearch = !query || doc.title.toLowerCase().includes(query);
    const matchesSection = (doc.navSlug ?? '') === activeNavSlug;
    return matchesSearch && matchesSection;
  });

  for (const doc of filtered) {
    let slugForTree = doc.slug;
    if (activeNavSlug !== '' && doc.slug.startsWith(activeNavSlug + '/')) {
      slugForTree = doc.slug.slice(activeNavSlug.length + 1);
    }

    const parts = slugForTree.split('/');
    const catPath = doc.categoryPath ?? [];

    let current = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current.children[part]) {
        const catInfo = catPath[i];
        current.children[part] = {
          title: catInfo?.title ?? part,
          slug: part,
          icon: catInfo?.icon ?? null,
          docs: [],
          children: {},
          isCategory: true,
        };
      }
      current = current.children[part];
    }
    current.docs.push(doc);
  }

  return root;
}

// ─── ContactsSection ──────────────────────────────────────────────────────────

const ContactLink: React.FC<{
  href: string; title: string; subtitle: string; external: boolean; isDark: boolean;
}> = ({ href, title, subtitle, external, isDark }) => (
  <a
    href={href}
    target={external ? '_blank' : undefined}
    rel={external ? 'noopener noreferrer' : undefined}
    style={{
      display: 'block', padding: '8px 12px', borderRadius: '0.5rem',
      fontSize: '0.875rem', textDecoration: 'none',
      color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
      background: 'transparent',
    }}
  >
    <div style={{ fontWeight: 500 }}>{title}</div>
    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{subtitle}</div>
  </a>
);

const ContactsSection: React.FC<{ isDark: boolean; isOpen: boolean; onClose: () => void }> = memo(({
  isDark, isOpen, onClose,
}) => {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', left: 0, top: 0, width: '100%', maxWidth: '20rem',
      height: '100vh', borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
      display: 'flex', flexDirection: 'column', zIndex: 50,
      background: isDark ? '#0F0F0F' : '#E1E0DC',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: isDark ? '#fff' : '#000' }}>Контакты</h2>
        <button
          onClick={onClose}
          style={{
            padding: '0.5rem', borderRadius: '0.5rem', border: 'none',
            background: 'transparent', cursor: 'pointer',
            color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
          }}
          aria-label="Закрыть контакты"
        >
          <X size={20} />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
        {CONTACTS.map((c) => (
          <ContactLink key={c.href} {...c} isDark={isDark} />
        ))}
      </div>
    </div>
  );
});

// ─── ManifestError ────────────────────────────────────────────────────────────

const ManifestError: React.FC<{ isDark: boolean; error: string }> = ({ isDark, error }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '0.75rem', padding: '2rem 1.5rem', textAlign: 'center',
  }}>
    <AlertTriangle size={28} style={{ color: isDark ? 'rgba(251,191,36,0.7)' : 'rgba(180,130,0,0.8)', flexShrink: 0 }} />
    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}>
      Не удалось загрузить список документов
    </p>
    <p style={{ margin: 0, fontSize: '0.72rem', color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)', wordBreak: 'break-all' }}>
      {error}
    </p>
    <button
      onClick={() => globalThis.window?.location?.reload()}
      style={{
        padding: '0.35rem 0.9rem', borderRadius: '7px',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
        background: 'transparent',
        color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
        fontSize: '0.75rem', cursor: 'pointer',
      }}
    >
      Обновить страницу
    </button>
  </div>
);

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  currentDocSlug?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentDocSlug }) => {
  const { isDark, toggleTheme, isSidebarOpen, setSidebarOpen } = useTheme();
  const { manifest: docs, loading, error } = useDocuments();
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
    const pathname = globalThis.window.location.pathname.replace(/^\//, '');
    const matched = sections
      .filter(s => s.navSlug !== '')
      .find(s => pathname === s.navSlug || pathname.startsWith(s.navSlug + '/'));
    const detected = matched?.navSlug ?? '';
    storageSet('hub:activeNavSlug', detected);
    startTransition(() => { setActiveNavSlug(detected); });
  }, [sections]);

  useEffect(() => {
    if (!currentDocSlug) return;
    let slugForTree = currentDocSlug;
    if (activeNavSlug !== '' && currentDocSlug.startsWith(activeNavSlug + '/')) {
      slugForTree = currentDocSlug.slice(activeNavSlug.length + 1);
    }
    const parts = slugForTree.split('/');
    const pathParts = parts.slice(0, -1).map((_, i) => parts.slice(0, i + 1).join('/'));
    if (pathParts.length > 0) {
      startTransition(() => { setExpandedPaths(new Set(pathParts)); });
    }
  }, [currentDocSlug, activeNavSlug]);

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

  const sidebarBg = isDark ? '#0F0F0F' : '#E1E0DC';
  const sidebarBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <>
      {!isDesktop && isSidebarOpen && <SidebarOverlay onClose={handleClose} />}
      <aside
        style={{
          position: 'fixed', left: 0, top: 0,
          height: '100vh', width: '100%', maxWidth: '20rem',
          borderRight: `1px solid ${sidebarBorder}`,
          display: 'flex', flexDirection: 'column', zIndex: 50,
          background: sidebarBg,
        }}
      >
        <SidebarHeader
          onClose={handleClose}
          isDark={isDark}
          onToggleTheme={(e) => toggleTheme(e)}
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
              storageSet('hub:activeNavSlug', slug);
              setActiveNavSlug(slug);
              setExpandedPaths(new Set());
            }}
            isDark={isDark}
          />
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
          {error ? (
            <ManifestError isDark={isDark} error={error} />
          ) : loading ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '2rem', fontSize: '0.8rem',
              color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
            }}>
              Загрузка...
            </div>
          ) : (
            <nav>
              {navTree.docs.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  {[...navTree.docs].sort((a, b) => a.title.localeCompare(b.title)).map((doc) => (
                    <DocLink key={doc.id} doc={doc} isDark={isDark} isActive={currentDocSlug === doc.slug} />
                  ))}
                </div>
              )}
              {Object.entries(navTree.children)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, node]) => (
                  <CategoryNode
                    key={key} node={node} path={key}
                    expandedPaths={expandedPaths} onToggle={togglePath}
                    onDocClick={() => {}}
                    isDark={isDark}
                    currentDocSlug={currentDocSlug}
                  />
                ))}
            </nav>
          )}
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