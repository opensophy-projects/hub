import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTheme } from '@/shared/contexts/ThemeContext';
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
      className={`flex flex-col items-center justify-center gap-1 px-2 py-2 transition-colors ${getTextColor()}`}
    >
      <div className="w-5 h-5 flex items-center justify-center">{icon}</div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
};

function getHeadingText(heading: Element): string {
  return heading.textContent?.trim() || '';
}

function scanHeadings(): TocItem[] {
  const container =
    document.querySelector('[data-article-content]') ||
    document.querySelector('article') ||
    document.querySelector('main');

  if (!container) return [];

  const headings = container.querySelectorAll('h2, h3, h4');
  const items: TocItem[] = [];
  headings.forEach((heading, index) => {
    const id = heading.id || `heading-${index}`;
    if (!heading.id) heading.id = id;
    items.push({
      id,
      text: getHeadingText(heading),
      level: Number.parseInt(heading.tagName[1], 10),
    });
  });
  return items;
}

/**
 * MobileNavbar no longer wraps itself in ThemeProvider.
 * Uses useTheme() directly — context is provided by Layout.astro.
 */
const MobileNavbar: React.FC = () => {
  const { isDark, setSidebarOpen } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [toc, setToc] = useState<TocItem[]>([]);

  useEffect(() => {
    const items = scanHeadings();
    if (items.length > 0) {
      setToc(items);
      return;
    }

    const observer = new MutationObserver(() => {
      const found = scanHeadings();
      if (found.length > 0) {
        setToc(found);
        observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const fallback = setTimeout(() => {
      const found = scanHeadings();
      if (found.length > 0) setToc(found);
      observer.disconnect();
    }, 3000);

    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  const handleTocOpen = () => {
    const freshItems = scanHeadings();

    if (freshItems.length > 0) {
      setToc(freshItems);
      setIsTocOpen(true);
    } else if (toc.length > 0) {
      setIsTocOpen(true);
    } else {
      setIsTocOpen((v) => !v);
    }
  };

  const handleScrollTop = () => {
    globalThis.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Mobile bottom navbar */}
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

      <AnimatePresence>
        {isTocOpen && (
          <TocPanel toc={toc} onClose={() => setIsTocOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNavbar;