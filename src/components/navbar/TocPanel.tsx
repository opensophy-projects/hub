import React, { useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface ToContentsItem {
  id: string;
  text: string;
  level: number;
}

const XIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

interface TocPanelProps {
  toc: ToContentsItem[];
  onTocClick: (id: string) => void;
  onClose: () => void;
}

const TocPanel: React.FC<TocPanelProps> = ({ toc, onTocClick, onClose }) => {
  const { isDark } = useTheme();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end">
      <div 
        className={`fixed inset-0 ${isDark ? 'bg-black/50' : 'bg-white/50'} backdrop-blur-sm`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="toc-panel-title"
        className={`relative w-full rounded-t-2xl border-t max-h-[70vh] overflow-y-auto ${
          isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-[#E8E7E3] border-black/10'
        }`}
      >
        <div
          className={`sticky top-0 flex items-center justify-between p-4 border-b backdrop-blur-sm ${
            isDark ? 'bg-[#0a0a0a]/95 border-white/10' : 'bg-[#E8E7E3]/95 border-black/10'
          }`}
        >
          <h3 id="toc-panel-title" className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>На этой странице</h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
            aria-label="Закрыть оглавление"
          >
            <XIcon />
          </button>
        </div>
        <div className="p-4 space-y-1">
          {toc.map((item) => (
            <button
              key={item.id}
              onClick={() => onTocClick(item.id)}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors text-sm ${
                isDark ? 'text-white/70 hover:bg-white/5 hover:text-white' : 'text-black/70 hover:bg-black/5 hover:text-black'
              }`}
              style={{ paddingLeft: `${12 + (item.level - 2) * 16}px` }}
            >
              {item.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TocPanel;