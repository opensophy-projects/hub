import React from 'react';
import { getTextClasses } from '@/shared/lib/classUtils';
import { SearchIcon } from '../icons';
import { X } from 'lucide-react';

interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClose: () => void;
  isDark: boolean;
  borderColor: string;
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onClose,
  isDark,
  borderColor
}) => {
  const searchIconClass = `w-5 h-5 flex-shrink-0 ${getTextClasses(isDark, '40')}`;
  const inputClass = `flex-1 bg-transparent outline-none text-base ${
    isDark ? 'text-white placeholder-white/40' : 'text-black placeholder-black/40'
  }`;
  const closeButtonClass = `flex-shrink-0 p-1.5 rounded-lg transition-colors ${
    isDark ? 'text-white hover:bg-white/10' : 'text-black hover:bg-black/10'
  }`;

  return (
    <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor }}>
      <SearchIcon className={searchIconClass} />
      <input
        type="text"
        placeholder="Поиск по заголовку, описанию, тегам..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        autoFocus
        className={inputClass}
      />
      <button onClick={onClose} className={closeButtonClass}>
        <X size={20} />
      </button>
    </div>
  );
};