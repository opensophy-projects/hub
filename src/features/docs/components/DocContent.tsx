import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider, useTheme } from '@/shared/contexts/ThemeContext';
import TocPanel from './TocPanel';
import { PanelLeft, Search, ArrowUp, List } from 'lucide-react';

const LazyUnifiedSearchPanel = lazy(() => import('./UnifiedSearchPanel'));

interface TocItem {
  id: string;
  text: string;
  level: number;
}

const NavButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
}> = ({ icon, label, onClick, isActive = false }) => {
  const { isDark } = useTheme();

  const getTextColor = () => {
    if (isActive) return isDark ? 'text-white' : 'text-black';
    return isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black';
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 md:py-0 transition-colors ${getTextColor()}`}
    >
      <div className="w-5 h-5 md:w-4 md:h-4 flex items-center justify-center">{icon}</div>
      <span className="text-[10px] md:text-sm font-medium">{label}</span>
    </button>
  );
};

const MobileNavbarInner: React.FC = () => {
  const { isDark, setSidebarOpen } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [toc, setToc] = useState<TocItem[]>([]);

  useEffect(() => {
    const generateTOC = (): boolean => {
      const container =
        document.querySelector('[data-article-content]') ||
        document.querySelector('article') ||
        document.querySelector('main');

      if (!container) return false;

      const headings = container.querySelectorAll('h2, h3, h4');
      if (headings.length === 0) return false;

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
      return true;
    };

    if (generateTOC()) return;

    const observer = new MutationObserver(() => {
      if (generateTOC()) observer.disconnect();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const fallback = setTimeout(() => {
      generateTOC();
      observer.disconnect();
    }, 3000);

    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  const handleTocOpen = () => {
    if (toc.length === 0) {
      const container =
        document.querySelector('[data-article-content]') ||
        document.querySelector('article') ||
        document.querySelector('main');

      if (container) {
        const headings = container.querySelectorAll('h2, h3, h4');
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
        if (items.length > 0) {
          setToc(items);
          setIsTocOpen(true);
          return;
        }
      }
    }
    setIsTocOpen((v) => !v);
  };

  const handleScrollTop = () => {
    globalThis.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Десктопный навбар — сверху, лого по центру */}
      <nav
        className={`hidden md:flex fixed top-0 left-0 right-0 z-50 border-b items-center h-16 ${
          isDark
            ? 'bg-[#0a0a0a]/95 border-white/10 backdrop-blur-sm'
            : 'bg-[#E8E7E3]/95 border-black/10 backdrop-blur-sm'
        }`}
      >
        {/* Левая часть */}
        <div className="flex items-center pl-4 w-64 flex-shrink-0">
          <NavButton icon={<Search size={18} />} label="Поиск" onClick={() => setIsSearchOpen(true)} />
        </div>

        {/* Центр — лого */}
        <div className="flex-1 flex items-center justify-center">
          <a href="/" className="flex items-center gap-2">
            <img src="/favicon.png" alt="Opensophy" className="w-10 h-10 object-contain" />
          </a>
        </div>

        {/* Правая часть */}
        <div className="flex items-center pr-4 w-64 flex-shrink-0 justify-end">
          <NavButton icon={<ArrowUp size={18} />} label="Наверх" onClick={handleScrollTop} />
        </div>
      </nav>

      {/* Мобильный навбар — снизу (с кнопкой Оглавление) */}
      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 z-50 border-t ${
          isDark
            ? 'bg-[#0a0a0a]/95 border-white/10 backdrop-blur-sm'
            : 'bg-[#E8E7E3]/95 border-black/10 backdrop-blur-sm'
        }`}
      >
        <div className="flex items-center justify-around px-2 py-1">
          <NavButton icon={<PanelLeft size={20} />} label="Меню" onClick={() => setSidebarOpen(true)} />
          <NavButton icon={<Search size={20} />} label="Поиск" onClick={() => setIsSearchOpen(true)} />

          <a href="/" className="flex flex-col items-center justify-center gap-1 px-2 py-2">
            <img src="/favicon.png" alt="Opensophy" className="w-10 h-10 object-contain" />
          </a>

          <NavButton
            icon={<List size={20} />}
            label="Оглавление"
            onClick={handleTocOpen}
            isActive={isTocOpen}
          />
          <NavButton icon={<ArrowUp size={20} />} label="Наверх" onClick={handleScrollTop} />
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

      {/* TOC Panel — только для мобильных */}
      <AnimatePresence>
        {isTocOpen && (
          <TocPanel toc={toc} onClose={() => setIsTocOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

const MobileNavbar: React.FC = () => (
  <ThemeProvider>
    <MobileNavbarInner />
  </ThemeProvider>
);

export default MobileNavbar;