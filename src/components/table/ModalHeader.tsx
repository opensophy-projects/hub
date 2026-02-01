import React, { useRef, useEffect } from 'react';

interface ModalHeaderProps {
  isDark: boolean;
  onClose: () => void;
  isOpen: boolean;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ isDark, onClose, isOpen }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.showModal();
    } else if (!isOpen && dialogRef.current?.open) {
      dialogRef.current.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = () => {
      onClose();
    };

    const handleBackdropClick = (e: MouseEvent) => {
      if (e.target === dialog) {
        onClose();
      }
    };

    dialog.addEventListener('cancel', handleCancel);
    dialog.addEventListener('click', handleBackdropClick);

    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.removeEventListener('click', handleBackdropClick);
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      className={`rounded-lg shadow-2xl [&::backdrop]:${isDark ? 'bg-black/80' : 'bg-white/80'}`}
    >
      <div
        className={`relative w-full max-w-[95vw] max-h-[95vh] flex flex-col ${isDark ? 'bg-[#1a1a1a]' : 'bg-[#E8E7E3]'}`}
      >
        <div
          className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-white/10 bg-[#252525]' : 'border-black/10 bg-white'}`}
        >
          <h3
            className={`font-bold text-lg ${isDark ? 'text-white' : 'text-black'}`}
          >
            Таблица в полном размере
          </h3>
          <form method="dialog">
            <button
              aria-label="Закрыть модальное окно"
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/10 text-black'}`}
            >
              ✕
            </button>
          </form>
        </div>
      </div>
    </dialog>
  );
};
