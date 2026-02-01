import React, { useEffect, useRef, ReactNode } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { XIcon } from './icons';

interface BottomSheetProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ title, onClose, children }) => {
  const { isDark } = useTheme();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Открываем dialog при монтировании
    dialog.showModal();

    const handleEscape = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    // Нативный dialog уже обрабатывает ESC, но мы добавляем custom логику
    dialog.addEventListener('cancel', handleEscape);

    return () => {
      dialog.removeEventListener('cancel', handleEscape);
      if (dialog.open) {
        dialog.close();
      }
    };
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Проверяем клик по backdrop (вне контента)
    const rect = dialog.getBoundingClientRect();
    const isInDialog =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width;

    if (!isInDialog) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className={`fixed inset-0 z-[60] w-full max-w-none p-0 m-0 backdrop:bg-transparent ${
        isDark ? 'bg-transparent' : 'bg-transparent'
      }`}
      style={{
        bottom: 0,
        top: 'auto',
        display: 'flex',
        alignItems: 'flex-end',
      }}
    >
      <div className="fixed inset-0 -z-10">
        <div 
          className={`absolute inset-0 ${isDark ? 'bg-black/50' : 'bg-white/50'} backdrop-blur-sm`}
          aria-hidden="true"
        />
      </div>

      <div
        className={`relative w-full rounded-t-2xl border-t max-h-[70vh] overflow-y-auto ${
          isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-[#E8E7E3] border-black/10'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`sticky top-0 flex items-center justify-between p-4 border-b backdrop-blur-sm ${
            isDark ? 'bg-[#0a0a0a]/95 border-white/10' : 'bg-[#E8E7E3]/95 border-black/10'
          }`}
        >
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
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
        <div>
          {children}
        </div>
      </div>
    </dialog>
  );
};

export default BottomSheet;
