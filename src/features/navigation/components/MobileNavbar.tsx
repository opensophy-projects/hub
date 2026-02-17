import React, { useState } from 'react';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { Menu, Search, ArrowUp } from 'lucide-react';

const MobileNavbar: React.FC = () => {
  const { isDark, setSidebarOpen, setSearchOpen } = useTheme();
  const [showScrollTop, setShowScrollTop] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMenuClick = () => {
    setSidebarOpen(true);
  };

  const handleSearchClick = () => {
    setSearchOpen(true);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 border-b ${
        isDark
          ? 'bg-[#0a0a0a]/95 border-white/10'
          : 'bg-[#E8E7E3]/95 border-black/10'
      } backdrop-blur-sm`}
    >
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <button
          onClick={handleMenuClick}
          className={`p-2 rounded-lg transition-colors ${
            isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
          }`}
          aria-label="Открыть меню"
          title="Меню"
        >
          <Menu size={24} className={isDark ? 'text-white' : 'text-black'} />
        </button>

        <a
          href="/"
          className={`text-lg md:text-xl font-bold font-veilstack flex-1 text-center mx-4`}
          style={{ color: '#7234ff' }}
          title="На главную"
        >
          hub
        </a>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSearchClick}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
            }`}
            aria-label="Поиск"
            title="Поиск"
          >
            <Search size={24} className={isDark ? 'text-white' : 'text-black'} />
          </button>

          {showScrollTop && (
            <button
              onClick={handleScrollToTop}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
              }`}
              aria-label="Наверх"
              title="Наверх"
            >
              <ArrowUp
                size={24}
                className={isDark ? 'text-white' : 'text-black'}
              />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default MobileNavbar;
