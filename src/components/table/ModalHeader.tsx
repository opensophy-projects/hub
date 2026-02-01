import React from 'react';

interface ModalHeaderProps {
  isDark: boolean;
  onClose: () => void;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ isDark, onClose }) => {
  const handleBackdropKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center ${isDark ? 'bg-black/80' : 'bg-white/80'}`}
      onClick={handleBackdropClick}
      onKeyDown={handleBackdropKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Модальное окно таблицы"
      tabIndex={-1}
    >
      <div
        className={`relative w-full max-w-[95vw] max-h-[95vh] rounded-lg shadow-2xl flex flex-col ${isDark ? 'bg-[#1a1a1a]' : 'bg-[#E8E7E3]'}`}
      >
        <div
          className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-white/10 bg-[#252525]' : 'border-black/10 bg-white'}`}
        >
          <h3
            className={`font-bold text-lg ${isDark ? 'text-white' : 'text-black'}`}
          >
            Таблица в полном размере
          </h3>
          <button
            onClick={onClose}
            aria-label="Закрыть модальное окно"
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/10 text-black'}`}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};
