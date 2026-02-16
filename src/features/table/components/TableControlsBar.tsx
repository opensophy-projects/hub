import React from 'react';

const ExpandIcon: React.FC = () => (
  <svg
    className="w-4 h-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
);

interface TableControlsBarProps {
  isDark: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
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
  activeFilterCount,
  onResetFilters,
  onFullscreen,
}) => {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 p-3 border-b ${
        isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
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
            : 'bg-[#E8E7E3] border border-black/20 text-black placeholder-black/50 focus:bg-[#E8E7E3] focus:border-black/40'
        } focus:outline-none`}
      />

      <button
        onClick={onToggleFilters}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isDark
            ? 'bg-white/10 hover:bg-white/20 text-white'
            : 'bg-[#E8E7E3] hover:bg-[#ddd8cd] text-black border border-black/20'
        }`}
        title="Фильтрация и колонки"
      >
        Фильтрация {activeFilterCount > 0 && `(${activeFilterCount})`}
      </button>

      {activeFilterCount > 0 && (
        <button
          onClick={onResetFilters}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isDark
              ? 'bg-white/10 hover:bg-white/20 text-white'
              : 'bg-[#E8E7E3] hover:bg-[#ddd8cd] text-black border border-black/20'
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
            : 'bg-[#E8E7E3] hover:bg-[#ddd8cd] text-black border border-black/20'
        }`}
        title="Открыть в полном размере"
      >
        <ExpandIcon />
      </button>
    </div>
  );
};
