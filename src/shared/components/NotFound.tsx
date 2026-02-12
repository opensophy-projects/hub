import React, { useEffect, useState } from 'react';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import TopNavbar from '@/features/navigation/components/MobileNavbar';
import Sidebar from '@/features/navigation/components/Sidebar';

const NotFoundContent: React.FC = () => {
  const { isDark } = useTheme();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          globalThis.location.href = '/';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <TopNavbar />
      <Sidebar />
      <div className={`min-h-screen flex items-center justify-center px-4 pt-16 ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#E8E7E3]'}`}>
        <div className="max-w-2xl w-full text-center">
          <h1 className={`text-8xl md:text-9xl font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>404</h1>
          <h2 className={`text-2xl md:text-3xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Страница не найдена</h2>
          <p className={`text-lg mb-8 ${isDark ? 'text-white/70' : 'text-black/70'}`}>К сожалению, запрашиваемая страница не существует или была перемещена.</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <button
              onClick={() => globalThis.history.back()}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium ${
                isDark 
                  ? 'bg-white/10 hover:bg-white/20 text-white' 
                  : 'bg-black/10 hover:bg-black/20 text-black'
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Назад
            </button>
            <a 
              href="/" 
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium ${
                isDark
                  ? 'bg-white text-black hover:bg-white/90'
                  : 'bg-black text-white hover:bg-black/90'
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              На главную
            </a>
          </div>

          <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>Автоматический редирект через {countdown} сек...</p>
        </div>
      </div>
    </>
  );
};

const NotFound: React.FC = () => {
  return (
    <ThemeProvider>
      <NotFoundContent />
    </ThemeProvider>
  );
};

export default NotFound;