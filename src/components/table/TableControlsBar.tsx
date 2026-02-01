import React from 'react';
import { EyeIcon, ExpandIcon } from '../../icons';

interface TableControlsBarProps {
  isDark: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  showColumns: boolean;
  onToggleColumns: () => void;
  activeFilterCount: number;
  onResetFilters: () => void;
  onFullscreen: () => void;
}

export const TableControlsBar: React.FC<TableControlsBarProps> = ({
  isDark,
  searchQuery,
  onSearchChange,
  showFilters,
  onToggleFilters,
  showColumns,
  onToggleColumns,
  activeFilterCount,
  onResetFilters,
  onFullscreen,
}) => {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 p-3 border-b ${
        isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-[#f1f0ec]'
      }`}
    >
      <input
        type="text"
        placeholder="Поиск в таблице..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className={`flex-1 min-w-[200px] px-3 py-2 rounded-lg text-sm transition-colors ${
          isDark
            ? 'bg-white/10 border border-white/20 text-white placeholder-white/50 focus:bg-white/15 focus:border-white/40'
            : 'bg-white border border-black/20 text-black placeholder-black/50 focus:bg-white focus:border-black/40'
        } focus:outline-none`}
      />

      <button
        onClick={onToggleFilters}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isDark
            ? 'bg-white/10 hover:bg-white/20 text-white'
            : 'bg-white hover:bg-[#ddd8cd] text-black border border-black/20'
        }`}
        title="Фильтрация"
      >
        Фильтр {activeFilterCount > 0 && `(${activeFilterCount})`}
      </button>

      <button
        onClick={onToggleColumns}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
          isDark
            ? 'bg-white/10 hover:bg-white/20 text-white'
            : 'bg-white hover:bg-[#ddd8cd] text-black border border-black/20'
        }`}
        title="Видимость колонок"
      >
        <EyeIcon />
        Колонки
      </button>

      {activeFilterCount > 0 && (
        <button
          onClick={onResetFilters}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isDark
              ? 'bg-white/10 hover:bg-white/20 text-white'
              : 'bg-white hover:bg-[#ddd8cd] text-black border border-black/20'
          }`}
        >
          Сбросить
        </button>
      )}

      <button
        onClick={onFullscreen}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
          isDark
            ? 'bg-white/10 hover:bg-white/20 text-white'
            : 'bg-white hover:bg-[#ddd8cd] text-black border border-black/20'
        }`}
        title="Открыть в полном размере"
      >
        <ExpandIcon />
      </button>
    </div>
  );
};
