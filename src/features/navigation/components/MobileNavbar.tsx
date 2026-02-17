import React, { useState, useEffect, Suspense, lazy, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Menu, Search, ArrowUp, List } from 'lucide-react';

const LazyUnifiedSearchPanel = lazy(() => import('./UnifiedSearchPanel'));
const LazyTocPanel = lazy(() => import('./TocPanel'));

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
  
  const color = isActive
    ? isDark ? 'text-white' : 'text-black'
    : isDark ? 'text-white/50' : 'text-black/50';

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 transition-colors ${color} hover:${isDark ? 'text-white' : 'text-black'}`}
      title={label}
      aria-label={label}
    >
      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">{icon}</div>
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </button>
  );
};

const MobileNavbar: React.FC = () => {
  const { isDark, setSidebarOpen, setSearchOpen } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isArticlePage, setIsArticlePage] = useState(false);

  useEffect(() => {
    const pathRegex = /^\/(\w+\/)?.+/;
    setIsArticlePage(pathRegex.test(globalThis.location.pathname));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(globalThis.scrollY > 300);
    };

    globalThis.addEventListener('scroll', handleScroll);
    return () => globalThis.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isArticlePage) {
      const generateTOC = () => {
        const main = document.querySelector('main article');
        if (!main) return;

        const headings = main.querySelectorAll('h2, h3, h4');
        const items: TocItem[] = [];

        headings.forEach((heading, idx) => {
          const id = heading.id || `heading-${idx}`;
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
    }
  }, [isArticlePage]);

  const handleMenuClick = () => {
    setSidebarOpen(true);
  };

  const handleSearchClick = () => {
    setIsSearchOpen(true);
  };

  const handleScrollTop = () => {
    globalThis.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTocClick = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    const headerOffset = 100;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + globalThis.pageYOffset - headerOffset;

    globalThis.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
    setIsTocOpen(false);
  };

  const logoButton = useMemo(() => (
    <a
      href="/"
      className="flex flex-col items-center justify-center gap-0.5 px-3 py-2"
      title="На главную"
      aria-label="На главную"
    >
      <img src="/favicon.png" alt="Logo" className="w-5 h-5 object-contain" />
      <span className="text-[10px] font-medium leading-none">Лого</span>
    </a>
  ), []);

  return (
    <>
      <nav
        className={`fixed bottom-0 left-0 right-0 z-40 border-t ${
          isDark
            ? 'bg-[#0a0a0a]/95 border-white/10'
            : 'bg-[#E8E7E3]/95 border-black/10'
        } backdrop-blur-sm`}
      >
        <div className="flex items-center justify-around px-1 py-1">
          <NavButton
            icon={<Menu size={20} />}
            label="Меню"
            onClick={handleMenuClick}
          />

          <NavButton
            icon={<Search size={20} />}
            label="Поиск"
            onClick={handleSearchClick}
          />

          {logoButton}

          {isArticlePage && toc.length > 0 && (
            <NavButton
              icon={<List size={20} />}
              label="Оглавление"
              onClick={() => setIsTocOpen(!isTocOpen)}
              isActive={isTocOpen}
            />
          )}

          {showScrollTop && (
            <NavButton
              icon={<ArrowUp size={20} />}
              label="Наверх"
              onClick={handleScrollTop}
            />
          )}
        </div>
      </nav>

      <AnimatePresence>
        {isSearchOpen && (
          <Suspense fallback={
            <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${isDark ? 'bg-black/50' : 'bg-white/50'}`}>
              <div className={`text-sm ${isDark ? 'text-white' : 'text-black'}`}>
                Загрузка...
              </div>
            </div>
          }>
            <LazyUnifiedSearchPanel onClose={() => setIsSearchOpen(false)} />
          </Suspense>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTocOpen && toc.length > 0 && (
          <Suspense fallback={null}>
            <LazyTocPanel
              toc={toc}
              onTocClick={handleTocClick}
              onClose={() => setIsTocOpen(false)}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNavbar;
