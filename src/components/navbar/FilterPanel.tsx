import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

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

interface FilterPanelProps {
  isOpen: boolean;
  types: Array<{ id: string; name: string }>;
  selectedType: string;
  onTypeSelect: (typeId: string) => void;
  onClose: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  types,
  selectedType,
  onTypeSelect,
  onClose,
}) => {
  const { isDark } = useTheme();

  const getButtonClassName = (isSelected: boolean): string => {
    if (isSelected) {
      return isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-black';
    }
    return isDark ? 'text-white/70 hover:bg-white/5' : 'text-black/70 hover:bg-black/5';
  };

  return (
    <button
      className="fixed inset-0 z-[60] flex items-end bg-transparent border-0 p-0 cursor-default"
      onClick={onClose}
      aria-label="Закрыть фильтры"
    >
      <div className={`fixed inset-0 ${isDark ? 'bg-black/50' : 'bg-white/50'} backdrop-blur-sm pointer-events-none`} />
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full rounded-t-2xl border-t max-h-[70vh] overflow-y-auto ${
          isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-[#E8E7E3] border-black/10'
        }`}
      >
        <div
          className={`sticky top-0 flex items-center justify-between p-4 border-b backdrop-blur-sm ${
            isDark ? 'bg-[#0a0a0a]/95 border-white/10' : 'bg-[#E8E7E3]/95 border-black/10'
          }`}
        >
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>Фильтр по типам</h3>
          <button onClick={onClose} className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'}`}>
            <XIcon />
          </button>
        </div>
        <div className="p-4 space-y-2">
          {types.map((type) => (
            <button
              key={type.id}
              onClick={() => onTypeSelect(type.id)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-lg transition-colors text-left ${getButtonClassName(selectedType === type.id)}`}
            >
              <span className="text-base font-medium">{type.name}</span>
            </button>
          ))}
        </div>
      </div>
    </button>
  );
};

export default FilterPanel;
