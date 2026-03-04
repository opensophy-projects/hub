import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { useDocuments } from '@/features/docs/hooks/useDocuments';
import { Search, Sun, Moon, ChevronDown, ChevronRight, Mail, X } from 'lucide-react';

interface Doc {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  typename: string;
  author?: string;
  date?: string;
  tags?: string[];
}

interface NavNode {
  title: string;
  docs: Doc[];
  children: Record<string, NavNode>;
  isCategory: boolean;
}

const createCloseKeyHandler = (onClose: () => void) => (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    onClose();
  }
};

const iconBtn = (isDark: boolean) =>
  `p-2 rounded-lg transition-colors ${isDark ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-black/70 hover:bg-black/5 hover:text-black'}`;

const borderStyle = (isDark: boolean) => ({
  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
});

const SidebarOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
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
      <h1 className="text-xl font-bold font-veilstack" style={{ color: '#7234ff' }}>
        hub
      </h1>
    </a>
    <div className="flex items-center gap-1">
      <button
        onClick={onToggleTheme}
        className={iconBtn(isDark)}
        title={isDark ? 'Светлая тема' : 'Тёмная тема'}
      >
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
      <Search
        size={16}
        className={`absolute left-3 top-1/2 -translate-y-1/2 ${
          isDark ? 'text-white/40' : 'text-black/40'
        }`}
      />
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

const DocLink: React.FC<{ doc: Doc; onClose: () => void; isDark: boolean }> = ({
  doc,
  onClose,
  isDark,
}) => {
  // slug уже содержит полный путь: папка/файл или просто файл
  const url = `/${doc.slug}`;

  return (
    <a
      href={url}
      onClick={onClose}
      className={`block px-3 py-1.5 rounded-lg text-sm transition-colors ${
        isDark
          ? 'text-white/70 hover:text-white hover:bg-white/5'
          : 'text-black/70 hover:text-black hover:bg-black/5'
      }`}
    >
      {doc.title}
    </a>
  );
};

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
          {hasChildren && (
            isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
          )}
          <span>{node.title}</span>
        </div>
        {totalDocs > 0 && (
          <span
            className={`text-xs px-2 py-0.5 rounded ${
              isDark ? 'bg-white/10 text-white/70' : 'bg-black/10 text-black/70'
            }`}
          >
            {totalDocs}
          </span>
        )}
      </button>

      {isExpanded && (
        <div className="ml-4 mt-1 space-y-1">
          {node.docs.length > 0 && (
            <div className="space-y-1">
              {[...node.docs]
                .sort((a, b) => a.title.localeCompare(b.title))
                .map((doc) => (
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
  Object.values(node.children).forEach((child) => {
    count += countDocsInNode(child);
  });
  return count;
}

function buildNavigationTree(docs: Doc[], searchQuery: string): NavNode {
  const root: NavNode = {
    title: 'Root',
    docs: [],
    children: {},
    isCategory: false,
  };

  const query = searchQuery.toLowerCase();

  docs.forEach((doc) => {
    // Фильтруем по поиску
    if (query && !doc.title.toLowerCase().includes(query)) {
      return;
    }

    const parts = doc.slug.split('/');
    let current = root;

    // Проходим по всем частям пути кроме последней
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current.children[part]) {
        current.children[part] = {
          title: part.charAt(0).toUpperCase() + part.slice(1),
          docs: [],
          children: {},
          isCategory: true,
        };
      }
      current = current.children[part];
    }

    // Добавляем документ в листовую категорию
    current.docs.push(doc);
  });

  return root;
}

const ContactLink: React.FC<{
  href: string;
  title: string;
  subtitle: string;
  external: boolean;
  isDark: boolean;
}> = ({ href, title, subtitle, external, isDark }) => (
  <a
    href={href}
    target={external ? '_blank' : undefined}
    rel={external ? 'noopener noreferrer' : undefined}
    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
      isDark
        ? 'text-white/70 hover:bg-white/5 hover:text-white'
        : 'text-black/70 hover:bg-black/5 hover:text-black'
    }`}
  >
    <div className="font-medium">{title}</div>
    <div className="text-xs opacity-70">{subtitle}</div>
  </a>
);

interface ContactItem {
  href: string;
  title: string;
  subtitle: string;
  external: boolean;
}

const CONTACTS: ContactItem[] = [
  { href: 'https://opensophy.com/', title: 'Сайт', subtitle: 'opensophy.com', external: true },
  { href: 'mailto:opensophy@gmail.com', title: 'Email', subtitle: 'opensophy@gmail.com', external: false },
  { href: 'https://t.me/veilosophy', title: 'Telegram', subtitle: '@veilosophy', external: true },
  { href: 'https://github.com/opensophy-projects', title: 'GitHub', subtitle: 'opensophy', external: true },
  { href: 'https://habr.com/ru/users/opensophy/', title: 'Habr', subtitle: 'opensophy', external: true },
];

const ContactsSection: React.FC<{
  isDark: boolean;
  isOpen: boolean;
  onClose: () => void;
}> = ({ isDark, isOpen, onClose }) => {
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
      <div
        className={`fixed left-0 top-0 w-full md:w-80 h-screen border-r flex flex-col z-50 ${
          isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-[#E8E7E3] border-black/10'
        }`}
      >
        <div className="flex items-center justify-between p-4">
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>Контакты</h2>
          <button onClick={onClose} className={iconBtn(isDark)} aria-label="Закрыть контакты">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {CONTACTS.map((c) => (
            <ContactLink
              key={c.href}
              href={c.href}
              title={c.title}
              subtitle={c.subtitle}
              external={c.external}
              isDark={isDark}
            />
          ))}
        </div>
      </div>
    </>
  );
};

const Sidebar: React.FC = () => {
  const { isDark, toggleTheme, isSidebarOpen, setSidebarOpen } = useTheme();
  const { manifest: docs } = useDocuments();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [showContacts, setShowContacts] = useState(false);

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

  useEffect(() => {
    if (!isDesktop && isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen, isDesktop]);

  const navTree = useMemo(
    () => buildNavigationTree(docs as Doc[], searchQuery),
    [docs, searchQuery]
  );

  const togglePath = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleClose = () => {
    setSidebarOpen(false);
  };

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
        <div className="flex-1 overflow-y-auto p-3">
          <nav className="space-y-2">
            {navTree.docs.length > 0 && (
              <div className="space-y-1 mb-4">
                {[...navTree.docs]
                  .sort((a, b) => a.title.localeCompare(b.title))
                  .map((doc) => (
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
      <ContactsSection
        isDark={isDark}
        isOpen={showContacts}
        onClose={() => setShowContacts(false)}
      />
    </>
  );
};

export default Sidebar;
