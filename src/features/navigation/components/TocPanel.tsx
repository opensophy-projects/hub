import React from 'react';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { scrollToElement } from '@/features/docs/utils/scrollUtils';
import { X, ArrowUp } from 'lucide-react';

interface ToContentsItem {
  id: string;
  text: string;
  level: number;
}

interface TocPanelProps {
  toc: ToContentsItem[];
  onClose: () => void;
}

const TocPanel: React.FC<TocPanelProps> = ({ toc, onClose }) => {
  const { isDark } = useTheme();

  const handleClick = (id: string) => {
    scrollToElement(id);
    setTimeout(() => {
      onClose();
    }, 100);
  };

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

  if (!isDesktop) {
    // Мобильная версия — bottom sheet
    return (
      <>
        <div
          className={`fixed inset-0 z-[60] ${isDark ? 'bg-black/50' : 'bg-white/50'}`}
          onClick={onClose}
        />
        <div
          className={`fixed bottom-0 left-0 right-0 z-[61] w-full rounded-t-2xl border-t max-h-[70vh] overflow-y-auto ${
            isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-[#E8E7E3] border-black/10'
          }`}
        >
          <div
            className={`sticky top-0 flex items-center justify-between p-4 border-b ${
              isDark ? 'bg-[#0a0a0a]/95 border-white/10' : 'bg-[#E8E7E3]/95 border-black/10'
            }`}
          >
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              На этой странице
            </h3>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
            >
              <X size={20} />
            </button>
          </div>
          {toc.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                На этой странице нет оглавления
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-1">
              {toc.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleClick(item.id)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors text-sm ${
                    isDark
                      ? 'text-white/70 hover:bg-white/5 hover:text-white'
                      : 'text-black/70 hover:bg-black/5 hover:text-black'
                  }`}
                  style={{ paddingLeft: `${12 + (item.level - 2) * 16}px` }}
                >
                  {item.text}
                </button>
              ))}
            </div>
          )}
        </div>
      </>
    );
  }

  // Десктопная версия — sidebar справа
  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      <aside
        className={`fixed right-0 top-0 h-screen w-80 border-l flex flex-col z-50 ${
          isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-[#E8E7E3] border-black/10'
        }`}
      >
        {/* Заголовок: текст + кнопка Наверх */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          }}
        >
          <h2 className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            На этой странице
          </h2>

          <div className="flex items-center gap-1">
            {/* Кнопка Наверх с границей как в sidebar */}
            <button
              onClick={handleScrollTop}
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg border transition-colors ${
                isDark
                  ? 'text-white/60 hover:bg-white/5 hover:text-white border-white/10'
                  : 'text-black/60 hover:bg-black/5 hover:text-black border-black/10'
              }`}
              title="Наверх"
            >
              <ArrowUp size={15} />
              <span className="text-[9px] font-medium leading-none">Наверх</span>
            </button>

            {/* Кнопка закрытия */}
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-black/70 hover:bg-black/5 hover:text-black'
              }`}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {toc.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <p className={`text-sm text-center ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              На этой странице нет оглавления
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-1">
              {toc.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleClick(item.id)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors text-sm ${
                    isDark
                      ? 'text-white/70 hover:bg-white/5 hover:text-white'
                      : 'text-black/70 hover:bg-black/5 hover:text-black'
                  }`}
                  style={{ paddingLeft: `${12 + (item.level - 2) * 12}px` }}
                >
                  {item.text}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default TocPanel;
