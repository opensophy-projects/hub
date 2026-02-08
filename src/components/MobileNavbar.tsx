import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import UnifiedSearchPanel from './navbar/UnifiedSearchPanel';
import TocPanel from './navbar/TocPanel';
import ContactsPanel from './navbar/ContactsPanel';

interface ToContentsItem {
  id: string;
  text: string;
  level: number;
}

const SearchIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const SunIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
);

const MoonIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

const MailIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const BackIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const ArrowUpIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

const ListIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const NavButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
}> = ({ icon, label, onClick, isActive = false }) => {
  const { isDark } = useTheme();
  
  const getTextColor = () => {
    if (isActive) {
      return isDark ? 'text-white' : 'text-black';
    }
    return isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black';
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 px-2 py-2 transition-colors ${getTextColor()}`}
    >
      <div className="w-6 h-6 flex items-center justify-center">{icon}</div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
};

const MobileNavbar: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isContactsOpen, setIsContactsOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [toc, setToc] = useState<ToContentsItem[]>([]);
  const [isArticlePage, setIsArticlePage] = useState(false);

  useEffect(() => {
    const pathMatch = /^\/docs\/|^\/blog\/|^\/news\//.test(globalThis.location.pathname);
    setIsArticlePage(pathMatch);

    if (pathMatch) {
      const generateTOC = () => {
        const articleContent = document.querySelector('[data-article-content]');
        if (!articleContent) return;

        const headings = articleContent.querySelectorAll('h2, h3, h4');
        const items: ToContentsItem[] = [];

        headings.forEach((heading, index) => {
          const id = `heading-${index}`;
          heading.id = id;
          items.push({
            id,
            text: heading.textContent || '',
            level: Number.parseInt(heading.tagName[1], 10),
          });
        });

        setToc(items);
      };

      const timer = setTimeout(generateTOC, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleTocClick = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    const headerOffset = 80;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
    setIsTocOpen(false);
  };

  const handleBackClick = () => {
    globalThis.location.href = '/';
  };

  const handleScrollTop = () => {
    globalThis.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <nav
        className={`fixed bottom-0 left-0 right-0 z-50 border-t ${
          isDark ? 'bg-[#0a0a0a]/95 border-white/10 backdrop-blur-sm' : 'bg-[#E8E7E3]/95 border-black/10 backdrop-blur-sm'
        }`}
      >
        <div className="flex items-center justify-around px-2 py-1">
          {isArticlePage ? (
            <>
              <NavButton icon={<BackIcon />} label="Назад" onClick={handleBackClick} />
              <NavButton icon={<ArrowUpIcon />} label="Наверх" onClick={handleScrollTop} />
              <NavButton icon={<ListIcon />} label="Оглавление" onClick={() => setIsTocOpen(!isTocOpen)} />
              <div className={`w-px h-8 ${isDark ? 'bg-white/20' : 'bg-black/20'}`} />
              <NavButton icon={isDark ? <SunIcon /> : <MoonIcon />} label="Тема" onClick={toggleTheme} />
              <NavButton icon={<MailIcon />} label="Контакты" onClick={() => setIsContactsOpen(true)} />
            </>
          ) : (
            <>
              <NavButton icon={<SearchIcon />} label="Поиск" onClick={() => setIsSearchOpen(true)} />
              <a href="/" className="flex flex-col items-center justify-center gap-1 px-2 py-2">
                <img src="/favicon.png" alt="Opensophy" className="w-10 h-10 object-contain" />
              </a>
              <NavButton icon={isDark ? <SunIcon /> : <MoonIcon />} label="Тема" onClick={toggleTheme} />
              <NavButton icon={<MailIcon />} label="Контакты" onClick={() => setIsContactsOpen(true)} />
            </>
          )}
        </div>
      </nav>

      <AnimatePresence>
        {isSearchOpen && (
          <UnifiedSearchPanel onClose={() => setIsSearchOpen(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTocOpen && toc.length > 0 && (
          <TocPanel
            toc={toc}
            onTocClick={handleTocClick}
            onClose={() => setIsTocOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isContactsOpen && (
          <ContactsPanel
            onClose={() => setIsContactsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNavbar;
