import React from 'react';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { scrollToElement } from '@/features/docs/utils/scrollUtils';
import { X, ArrowUp } from 'lucide-react';
import { GlowingEffect } from './glowing-effect';

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
    setTimeout(onClose, 100);
  };

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

  const borderColor = isDark ? 'border-white/10' : 'border-black/10';
  const bgColor = isDark ? 'bg-[#0a0a0a]' : 'bg-[#E8E7E3]';
  const shadowInner = isDark ? 'shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)]' : '';

  // ── Мобиль: bottom sheet ──────────────────────────────────────────────────
  if (!isDesktop) {
    return (
      <>
        <div className={`fixed inset-0 z-[60] ${isDark ? 'bg-black/50' : 'bg-white/50'}`} onClick={onClose} />
        <div className={`fixed bottom-0 left-0 right-0 z-[61] w-full rounded-t-2xl border-t max-h-[70vh] overflow-y-auto ${bgColor} ${isDark ? 'border-white/10' : 'border-black/10'}`}>
          <div className={`sticky top-0 flex items-center justify-between p-4 border-b ${bgColor}/95 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>На этой странице</h3>
            <button onClick={onClose} className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}><X size={20} /></button>
          </div>
          {toc.length === 0
            ? <div className="px-4 py-10 text-center"><p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>На этой странице нет оглавления</p></div>
            : <div className="p-4 space-y-1">{toc.map(item => (
                <button key={item.id} onClick={() => handleClick(item.id)}
                  className={`w-full text-left py-2 rounded-lg transition-colors text-sm ${isDark ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-black/70 hover:bg-black/5 hover:text-black'}`}
                  style={{ paddingLeft: `${12 + (item.level - 2) * 16}px` }}>
                  {item.text}
                </button>
              ))}</div>
          }
        </div>
      </>
    );
  }

  // ── Десктоп: карточка с GlowingEffect — точно как в проекте ────────────────
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      <div className="fixed right-0 top-0 h-screen z-50" style={{ width: '18rem' }}>
        <div className="h-full p-3">
          {/* Outer: rounded-[1.25rem] border-[0.75px] p-2 — точно как карточки принципов */}
          <div className={`relative h-full rounded-[1.25rem] border-[0.75px] p-2 md:rounded-[1.5rem] md:p-3 ${borderColor} ${bgColor}`}>
            <GlowingEffect
              spread={40}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
              borderWidth={3}
              isNegative={isDark}
            />
            {/* Inner: relative flex h-full flex-col rounded-xl border-[0.75px] */}
            <div className={`relative flex flex-col h-full overflow-hidden rounded-xl border-[0.75px] ${borderColor} ${bgColor} ${shadowInner}`}>
              {/* Заголовок */}
              <div className={`flex-shrink-0 flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-white/8' : 'border-black/8'}`}>
                <h2 className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                  На этой странице
                </h2>
                <div className="flex items-center gap-1">
                  <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg border transition-colors ${isDark ? 'text-white/60 hover:bg-white/5 hover:text-white border-white/10' : 'text-black/60 hover:bg-black/5 hover:text-black border-black/10'}`}
                    title="Наверх">
                    <ArrowUp size={15} />
                    <span className="text-[9px] font-medium leading-none">Наверх</span>
                  </button>
                  <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-white/70 hover:bg-white/5' : 'text-black/70 hover:bg-black/5'}`}><X size={16} /></button>
                </div>
              </div>

              {/* Список */}
              {toc.length === 0
                ? <div className="flex-1 flex items-center justify-center p-4"><p className={`text-sm text-center ${isDark ? 'text-white/50' : 'text-black/50'}`}>На этой странице нет оглавления</p></div>
                : <div className="flex-1 overflow-y-auto p-3"><div className="space-y-1">{toc.map(item => (
                    <button key={item.id} onClick={() => handleClick(item.id)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors text-sm ${isDark ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-black/70 hover:bg-black/5 hover:text-black'}`}
                      style={{ paddingLeft: `${12 + (item.level - 2) * 12}px` }}>
                      {item.text}
                    </button>
                  ))}</div></div>
              }
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TocPanel;