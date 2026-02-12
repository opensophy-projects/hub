import React, { useState } from 'react';

interface FilterSectionProps {
  isDark: boolean;
  showFilters: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  headers: Array<{ text: string; colIndex: number }>;
  activeFilters: Map<string, Set<string>>;
  uniqueValues: Map<string, string[]>;
  onFilterChange: (column: string, value: string, checked: boolean) => void;
  onResetFilters: () => void;
  isFullscreen?: boolean;
  onClose?: () => void;
  showColumns?: boolean;
  onToggleColumns?: () => void;
  visibleColumns?: Set<string>;
  onColumnToggle?: (columnName: string) => void;
}

export const FilterSection: React.FC<FilterSectionProps> = ({
  isDark,
  showFilters,
  searchQuery,
  onSearchChange,
  headers,
  activeFilters,
  uniqueValues,
  onFilterChange,
  onResetFilters,
  isFullscreen = false,
  onClose,
  showColumns = false,
  onToggleColumns,
  visibleColumns,
  onColumnToggle,
}) => {
  const [localShowFilters, setLocalShowFilters] = useState(false);
  const activeFiltCount = Array.from(activeFilters.values()).reduce((sum, set) => sum + set.size, 0);

  const toggleFilters = () => {
    setLocalShowFilters(!localShowFilters);
  };

  // Вспомогательная функция для определения className чекбокса фильтра
  const getFilterCheckboxClassName = (isChecked: boolean, isDark: boolean): string => {
    if (isChecked) {
      return isDark
        ? 'bg-white/20 border border-white/40'
        : 'bg-blue-100 border border-blue-300';
    }
    return isDark
      ? 'bg-white/5 border border-white/10 hover:bg-white/10'
      : 'bg-white/50 border border-black/10 hover:bg-white/70';
  };

  // Вспомогательная функция для определения className текста в чекбоксе фильтра
  const getFilterTextClassName = (isChecked: boolean, isDark: boolean): string => {
    if (isChecked) {
      return isDark ? 'text-white font-semibold' : 'text-blue-900 font-semibold';
    }
    return isDark ? 'text-white/80' : 'text-black/80';
  };

  // Вспомогательная функция для определения className чекбокса колонок
  const getColumnCheckboxClassName = (isVisible: boolean, isDark: boolean): string => {
    if (isVisible) {
      return isDark
        ? 'bg-white/20 border border-white/40'
        : 'bg-blue-100 border border-blue-300';
    }
    return isDark
      ? 'bg-white/5 border border-white/10 hover:bg-white/10'
      : 'bg-white/50 border border-black/10 hover:bg-white/70';
  };

  // Вспомогательная функция для определения className текста в чекбоксе колонок
  const getColumnTextClassName = (isVisible: boolean, isDark: boolean): string => {
    if (isVisible) {
      return isDark ? 'text-white font-semibold' : 'text-blue-900 font-semibold';
    }
    return isDark ? 'text-white/80' : 'text-black/80';
  };

  return (
    <>
      <div
        className={`flex flex-wrap items-center gap-2 p-3 border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}
      >
        <input
          type="text"
          placeholder="Поиск в таблице..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`flex-1 min-w-[200px] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-white/10 border border-white/20 text-white placeholder-white/50 focus:bg-white/15 focus:border-white/40' : 'bg-white border border-black/20 text-black placeholder-black/50 focus:bg-white border-black/40'}`}
        />
        <button
          onClick={toggleFilters}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/10 hover:bg-black/20 text-black'}`}
        >
          Фильтрация{activeFiltCount > 0 && ` (${activeFiltCount})`}
        </button>
        {activeFiltCount > 0 && (
          <button
            onClick={onResetFilters}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/10 hover:bg-black/20 text-black'}`}
          >
            Сбросить
          </button>
        )}
        {isFullscreen && onClose && (
          <button
            onClick={onClose}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/10 hover:bg-black/20 text-black'}`}
            aria-label="Закрыть полноэкранный режим"
          >
            ✕
          </button>
        )}
      </div>

      {localShowFilters && (
        <div
          className={`w-full p-3 border-b rounded-b-lg overflow-y-auto max-h-60 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}
        >
          <div className="grid grid-cols-2 gap-3 mb-4">
            {headers.map((header) => {
              const values = uniqueValues.get(header.text) || [];
              const activeFilters_ = activeFilters.get(header.text) || new Set();

              return (
                <div key={header.colIndex}>
                  <label className={`block text-xs font-semibold ${isDark ? 'text-white/70' : 'text-black/70'} mb-2`}>
                    {header.text}
                  </label>
                  <div className="space-y-1">
                    {values.map((value) => {
                      const isChecked = activeFilters_.has(value);
                      const checkboxClassName = getFilterCheckboxClassName(isChecked, isDark);
                      const textClassName = getFilterTextClassName(isChecked, isDark);

                      return (
                        <label 
                          key={value} 
                          className={`flex items-center gap-2 text-sm px-2 py-1 rounded transition-colors cursor-pointer ${checkboxClassName}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => onFilterChange(header.text, value, e.target.checked)}
                            className="cursor-pointer"
                          />
                          <span className={textClassName}>
                            {value}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {isFullscreen && onToggleColumns && visibleColumns && onColumnToggle && (
            <>
              <div className={`border-t pt-3 mb-2 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                <h4 className={`font-semibold text-sm mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                  Видимость колонок
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {headers.map((header) => {
                  const isVisible = visibleColumns.has(header.text);
                  const checkboxClassName = getColumnCheckboxClassName(isVisible, isDark);
                  const textClassName = getColumnTextClassName(isVisible, isDark);

                  return (
                    <label 
                      key={header.colIndex} 
                      className={`flex items-center gap-2 cursor-pointer px-2 py-1 rounded transition-colors ${checkboxClassName}`}
                    >
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => onColumnToggle(header.text)}
                        className="cursor-pointer"
                      />
                      <span className={`text-sm ${textClassName}`}>
                        {header.text}
                      </span>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};