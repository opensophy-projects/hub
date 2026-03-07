import React from 'react';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { scrollToElement } from '@/features/docs/utils/scrollUtils';
import { X, ArrowUp } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ToContentsItem {
  id: string;
  text: string;
  level: number;
}

interface TocPanelProps {
  toc: ToContentsItem[];
  onClose: () => void;
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

const Backdrop: React.FC<{ className: string; onClose: () => void }> = ({ className, onClose }) => (
  <button
    type="button"
    aria-label="Закрыть"
    onClick={onClose}
    className={className}
    style={{ border: 'none', padding: 0, cursor: 'pointer' }}
  />
);

// ─── TocList ──────────────────────────────────────────────────────────────────

interface TocListProps {
  toc: ToContentsItem[];
  isDark: boolean;
  onItemClick: (id: string) => void;
  itemClassName: string;
}

const TocList: React.FC<TocListProps> = ({ toc, isDark, onItemClick, itemClassName }) => {
  if (toc.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className={`text-sm text-center ${isDark ? 'text-white/50' : 'text-black/50'}`}>
          На этой странице нет оглавления
        </p>
      </div>
    );
  }

  return (
    <div className={itemClassName}>
      {toc.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onItemClick(item.id)}
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
  );
};

// ─── MobileTocPanel ───────────────────────────────────────────────────────────

interface MobileTocPanelProps {
  toc: ToContentsItem[];
  isDark: boolean;
  onClose: () => void;
  onItemClick: (id: string) => void;
}

const MobileTocPanel: React.FC<MobileTocPanelProps> = ({ toc, isDark, onClose, onItemClick }) => (
  <>
    <Backdrop
      className={`fixed inset-0 z-[60] ${isDark ? 'bg-black/50' : 'bg-white/50'}`}
      onClose={onClose}
    />
    <div
      className={`fixed bottom-0 left-0 right-0 z-[61] w-full rounded-t-2xl border-t max-h-[70vh] overflow-y-auto ${
        isDark ? 'bg-[#0F0F0F] border-white/10' : 'bg-[#E1E0DC] border-black/10'
      }`}
    >
      <div
        className={`sticky top-0 flex items-center justify-between p-4 border-b ${
          isDark ? 'bg-[#0F0F0F]/95 border-white/10' : 'bg-[#E1E0DC]/95 border-black/10'
        }`}
      >
        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
          На этой странице
        </h3>
        <button
          type="button"
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
          <TocList
            toc={toc}
            isDark={isDark}
            onItemClick={onItemClick}
            itemClassName="space-y-1"
          />
        </div>
      )}
    </div>
  </>
);

// ─── DesktopTocPanel ──────────────────────────────────────────────────────────

interface DesktopTocPanelProps {
  toc: ToContentsItem[];
  isDark: boolean;
  onClose: () => void;
  onItemClick: (id: string) => void;
}

const DesktopTocPanel: React.FC<DesktopTocPanelProps> = ({ toc, isDark, onClose, onItemClick }) => {
  const handleScrollTop = () => {
    globalThis.window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Backdrop
        className="fixed inset-0 bg-black/50 z-40"
        onClose={onClose}
      />
      <aside
        className={`fixed right-0 top-0 h-screen w-80 border-l flex flex-col z-50 ${
          isDark ? 'bg-[#0F0F0F] border-white/10' : 'bg-[#E1E0DC] border-black/10'
        }`}
      >
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
        >
          <h2 className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            На этой странице
          </h2>

          <div className="flex items-center gap-1">
            <button
              type="button"
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

            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-black/70 hover:bg-black/5 hover:text-black'
              }`}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <TocList
            toc={toc}
            isDark={isDark}
            onItemClick={onItemClick}
            itemClassName="space-y-1"
          />
        </div>
      </aside>
    </>
  );
};

// ─── TocPanel ─────────────────────────────────────────────────────────────────

const TocPanel: React.FC<TocPanelProps> = ({ toc, onClose }) => {
  const { isDark } = useTheme();

  const handleItemClick = (id: string) => {
    scrollToElement(id);
    setTimeout(onClose, 100);
  };

  const isDesktop = globalThis.window !== undefined && globalThis.window.innerWidth >= 768;

  if (!isDesktop) {
    return (
      <MobileTocPanel
        toc={toc}
        isDark={isDark}
        onClose={onClose}
        onItemClick={handleItemClick}
      />
    );
  }

  return (
    <DesktopTocPanel
      toc={toc}
      isDark={isDark}
      onClose={onClose}
      onItemClick={handleItemClick}
    />
  );
};

export default TocPanel;