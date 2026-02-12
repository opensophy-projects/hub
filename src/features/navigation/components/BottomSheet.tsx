import React, { useEffect, useRef, ReactNode } from 'react';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { XIcon } from './icons';

interface BottomSheetProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ title, onClose, children }) => {
  const { isDark } = useTheme();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.showModal();

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Обработка клика по backdrop через событие click на dialog
    const handleClick = (e: MouseEvent) => {
      const content = contentRef.current;
      if (content && !content.contains(e.target as Node)) {
        onClose();
      }
    };

    dialog.addEventListener('click', handleClick);
    globalThis.document.addEventListener('keydown', handleEscape);

    return () => {
      dialog.removeEventListener('click', handleClick);
      globalThis.document.removeEventListener('keydown', handleEscape);
      dialog.close();
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-[60] w-full h-full max-w-none max-h-none p-0 m-0 border-0 bg-transparent flex items-end"
      aria-labelledby="bottom-sheet-title"
      aria-describedby="bottom-sheet-content"
    >
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 ${isDark ? 'bg-black/50' : 'bg-white/50'} backdrop-blur-sm`}
        aria-hidden="true"
      />
      
      {/* Content wrapper */}
      <div
        ref={contentRef}
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
    </dialog>
  );
};

export default BottomSheet;