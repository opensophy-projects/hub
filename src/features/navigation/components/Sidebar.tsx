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

type GroupedDocs = Record<string, Doc[]>;

const createCloseKeyHandler = (onClose: () => void) => (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    onClose();
  }
};

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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 cursor-default"
      onClick={onClose}
      onKeyDown={createCloseKeyHandler(onClose)}
      aria-label="Закрыть боковую панель"
    />
  );
};

const iconBtn = (isDark: boolean) =>
  `p-2 rounded-lg transition-colors ${
    isDark
      ? 'text-white hover:bg-white/10'
      : 'text-black hover:bg-black/10'
  }`;

const SidebarHeader: React.FC<{
  onClose: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onToggleContacts: () => void;
}> = ({ onClose, isDark, onToggleTheme, onToggleContacts }) => (
  <div
    className="flex-shrink-0 p-4 md:p-6 border-b flex items-center justify-between"
    style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
  >
    <a href="/" className="block">
      <h1 className="text-xl md:text-2xl font-bold font-veilstack" style={{ color: '#7234ff' }}>
        hub
      </h1>
    </a>
    <div className="flex items-center gap-1">
      <button onClick={onToggleTheme} className={iconBtn(isDark)} title={isDark ? 'Светлая тема' : 'Тёмная тема'}>
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      <button onClick={onToggleContacts} className={iconBtn(isDark)} title="Контакты">
        <Mail size={20} />
      </button>
      <button onClick={onClose} className={iconBtn(isDark)} aria-label="Закрыть меню">
        <X size={20} />
      </button>
    </div>
  </div>
);

const SidebarSearch: React.FC<{
  value: string;
  onChange: (value: string) => void;
  isDark: boolean;
}> = ({ value, onChange, isDark }) => (
  <div
    className="flex-shrink-0 p-3 md:p-4 border-b"
    style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
  >
    <div className="relative">
      <Search
        size={18}
        className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-white/40' : 'text-black/40'}`}
      />
      <input
        type="text"
        placeholder="Поиск по названию..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full pl-10 pr-4 py-2 rounded-lg text-sm border transition-colors outline-none ${
          isDark
            ? 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:bg-white/10 focus:border-white/20'
            : 'bg-[#ddd8cd] border-black/10 text-black placeholder-black/40 focus:border-black/20'
        }`}
      />
    </div>
  </div>
);

const DocLink: React.FC<{ doc: Doc; onClose: () => void; isDark: boolean }> = ({ doc, onClose, isDark }) => {
  const url = doc.type?.trim() ? `/${doc.type}/${doc.slug}` : `/${doc.slug}`;
  return (
    <a
      href={url}
      onClick={onClose}
      className={`block px-3 py-1 rounded-lg text-xs md:text-sm transition-colors ${
        isDark
          ? 'text-white/60 hover:text-white hover:bg-white/5'
          : 'text-black/60 hover:text-black hover:bg-black/5'
      }`}
    >
      {doc.title}
    </a>
  );
};

const TypeSection: React.FC<{
  typename: string;
  docs: Doc[];
  isExpanded: boolean;
  onToggle: () => void;
  onDocClick: () => void;
  isDark: boolean;
}> = ({ typename, docs, isExpanded, onToggle, onDocClick, isDark }) => (
  <div>
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-colors ${
        isDark ? 'text-white hover:bg-white/5' : 'text-black hover:bg-black/5'
      }`}
    >
      <div className="flex items-center gap-2">
        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <span>{typename}</span>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-white/10 text-white/70' : 'bg-black/10 text-black/70'}`}>
        {docs.length}
      </span>
    </button>
    {isExpanded && docs.length > 0 && (
      <div className="ml-4 mt-1 space-y-1">
        {[...docs]
          .sort((a, b) => a.title.localeCompare(b.title))
          .map((doc) => (
            <DocLink key={doc.id} doc={doc} onClose={onDocClick} isDark={isDark} />
          ))}
      </div>
    )}
  </div>
);

const ContactLink: React.FC<{
  href: string;
  title: string;
  subtitle: string;
  external?: boolean;
  isDark: boolean;
}> = ({ href, title, subtitle, external = false, isDark }) => (
  <a
    href={href}
    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    className={`block px-2 py-1.5 rounded-lg text-xs transition-colors ${
      isDark
        ? 'text-white/70 hover:bg-white/5 hover:text-white'
        : 'text-black/70 hover:bg-black/5 hover:text-black'
    }`}
  >
    <div className="font-medium">{title}</div>
    <div className="opacity-70">{subtitle}</div>
  </a>
);

const ContactsSection: React.FC<{ isDark: boolean; isOpen: boolean; onClose: () => void }> = ({
  isDark,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const contacts = [
    { href: 'https://opensophy.com/', title: 'Сайт', subtitle: 'opensophy.com', external: true },
    { href: 'mailto:opensophy@gmail.com', title: 'Email', subtitle: 'opensophy@gmail.com' },
    { href: 'https://t.me/veilosophy', title: 'Telegram', subtitle: '@veilosophy', external: true },
    { href: 'https://github.com/opensophy-projects', title: 'GitHub', subtitle: 'opensophy', external: true },
    { href: 'https://habr.com/ru/users/opensophy/', title: 'Habr', subtitle: 'opensophy', external: true },
  ];

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 cursor-default"
        onClick={onClose}
        onKeyDown={createCloseKeyHandler(onClose)}
        aria-label="Закрыть контакты"
      />
      <div
        className={`fixed left-0 top-0 w-full md:w-80 h-screen border-r flex flex-col z-50 ${
          isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-[#E8E7E3] border-black/10'
        }`}
      >
        <div
          className="flex items-center justify-between p-4 md:p-6 border-b"
          style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
        >
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>Контакты</h2>
          <button onClick={onClose} className={iconBtn(isDark)} aria-label="Закрыть контакты">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {contacts.map((c) => (
            <ContactLink key={c.href} {...c} isDark={isDark} />
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
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [showContacts, setShowContacts] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isSidebarOpen]);

  const groupedDocs = useMemo((): GroupedDocs => {
    const grouped: GroupedDocs = {};
    docs.forEach((doc: any) => {
      const key = doc.typename?.trim() || 'Без категории';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(doc as Doc);
    });
    return grouped;
  }, [docs]);

  const filteredDocs = useMemo((): GroupedDocs => {
    if (!searchQuery.trim()) return groupedDocs;
    const query = searchQuery.toLowerCase();
    const filtered: GroupedDocs = {};
    Object.entries(groupedDocs).forEach(([typename, docsList]) => {
      const matched = docsList.filter((doc) => doc.title.toLowerCase().includes(query));
      if (matched.length > 0) filtered[typename] = matched;
    });
    return filtered;
  }, [groupedDocs, searchQuery]);

  const toggleType = (typename: string) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      next.has(typename) ? next.delete(typename) : next.add(typename);
      return next;
    });
  };

  if (!isSidebarOpen) return null;

  return (
    <>
      <SidebarOverlay onClose={() => setSidebarOpen(false)} />
      <aside
        className={`fixed left-0 top-0 h-screen w-full md:w-80 border-r flex flex-col z-50 ${
          isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-[#E8E7E3] border-black/10'
        }`}
      >
        <SidebarHeader
          onClose={() => setSidebarOpen(false)}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onToggleContacts={() => setShowContacts(!showContacts)}
        />
        <SidebarSearch value={searchQuery} onChange={setSearchQuery} isDark={isDark} />
        <div className="flex-1 overflow-y-auto p-3 md:p-4">
          <nav className="space-y-1 md:space-y-2">
            {Object.entries(filteredDocs)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([typename, docsList]) => (
                <TypeSection
                  key={typename}
                  typename={typename}
                  docs={docsList}
                  isExpanded={expandedTypes.has(typename)}
                  onToggle={() => toggleType(typename)}
                  onDocClick={() => setSidebarOpen(false)}
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