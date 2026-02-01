import React, { useEffect, ReactNode } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { XIcon } from './icons';

interface BottomSheetProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ title, onClose, children }) => {
  const { isDark } = useTheme();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    globalThis.document.addEventListener('keydown', handleEscape);
    return () => {
      globalThis.document.removeEventListener('keydown', handleEscape);
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
        aria-labelledby="bottom-sheet-title"
        aria-describedby="bottom-sheet-content"
        tabIndex={-1}
        className={`relative w-full rounded-t-2xl border-t max-h-[70vh] overflow-y-auto ${
          isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-[#E8E7E3] border-black/10'
        }`}
      >
        <div
          className={`sticky top-0 flex items-center justify-between p-4 border-b backdrop-blur-sm ${
            isDark ? 'bg-[#0a0a0a]/95 border-white/10' : 'bg-[#E8E7E3]/95 border-black/10'
          }`}
        >
          <h3 id="bottom-sheet-title" className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}
            aria-label={`Закрыть ${title.toLowerCase()}`}
          >
            <XIcon />
          </button>
        </div>
        <div id="bottom-sheet-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default BottomSheet;
