import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTheme } from '@/shared/contexts/ThemeContext';
import TocPanel from './TocPanel';
import { PanelLeft } from 'lucide-react';

const LazyUnifiedSearchPanel = lazy(() => import('./UnifiedSearchPanel'));

interface TocItem {
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
  const { isDark, toggleSidebar } = useTheme();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [toc, setToc] = useState<TocItem[]>([]);

  useEffect(() => {
    const generateTOC = () => {
      const articleContent = document.querySelector('[data-article-content]');
      if (!articleContent) return;

      const headings = articleContent.querySelectorAll('h2, h3, h4');
      const items: TocItem[] = [];

      headings.forEach((heading, index) => {
        const id = heading.id || `heading-${index}`;
        if (!heading.id) heading.id = id;
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
  }, []);

  const handleTocClick = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    const headerOffset = 80;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });
    setIsTocOpen(false);
  };

  const handleScrollTop = () => {
    globalThis.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <nav
        className={`fixed bottom-0 left-0 right-0 z-50 border-t ${
          isDark
            ? 'bg-[#0a0a0a]/95 border-white/10 backdrop-blur-sm'
            : 'bg-[#E8E7E3]/95 border-black/10 backdrop-blur-sm'
        }`}
      >
        <div className="flex items-center justify-around px-2 py-1">
          {/* Меню */}
          <NavButton
            icon={<PanelLeft size={20} />}
            label="Меню"
            onClick={toggleSidebar}
          />

          {/* Поиск */}
          <NavButton
            icon={<SearchIcon />}
            label="Поиск"
            onClick={() => setIsSearchOpen(true)}
          />

          {/* Лого */}
          <a
            href="/"
            className="flex flex-col items-center justify-center gap-1 px-2 py-2"
          >
            <img src="/favicon.png" alt="Opensophy" className="w-10 h-10 object-contain" />
          </a>

          {/* Оглавление */}
          <NavButton
            icon={<ListIcon />}
            label="Оглавление"
            onClick={() => setIsTocOpen(!isTocOpen)}
            isActive={isTocOpen}
          />

          {/* Наверх */}
          <NavButton
            icon={<ArrowUpIcon />}
            label="Наверх"
            onClick={handleScrollTop}
          />
        </div>
      </nav>

      <AnimatePresence>
        {isSearchOpen && (
          <Suspense
            fallback={
              <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
                <div className={`text-sm ${isDark ? 'text-white' : 'text-black'}`}>
                  Загрузка поиска...
                </div>
              </div>
            }
          >
            <LazyUnifiedSearchPanel onClose={() => setIsSearchOpen(false)} />
          </Suspense>
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
    </>
  );
};

export default MobileNavbar;