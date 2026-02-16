import React from 'react';

interface FiltersPanelProps {
  isDark: boolean;
  headers: string[];
  filters: Map<number, Set<string>>;
  onToggleFilter: (colIndex: number, value: string) => void;
  getUniqueValuesForColumn: (colIndex: number) => string[];
}

export const FiltersPanel: React.FC<FiltersPanelProps> = ({
  isDark,
  headers,
  filters,
  onToggleFilter,
  getUniqueValuesForColumn,
}) => {
  return (
    <div
      className={`border-b p-4 grid gap-3 ${
        isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-[#f1f0ec]'
      }`}
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}
    >
      {headers.map((header, colIndex) => (
        <FilterColumn
          key={header}
          header={header}
          colIndex={colIndex}
          isDark={isDark}
          values={getUniqueValuesForColumn(colIndex)}
          activeFilters={filters.get(colIndex) || new Set()}
          onToggleFilter={onToggleFilter}
        />
      ))}
    </div>
  );
};

interface FilterColumnProps {
  header: string;
  colIndex: number;
  isDark: boolean;
  values: string[];
  activeFilters: Set<string>;
  onToggleFilter: (colIndex: number, value: string) => void;
}

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

const getFilterTextClassName = (isChecked: boolean, isDark: boolean): string => {
  if (isChecked) {
    return isDark ? 'text-white font-semibold' : 'text-blue-900 font-semibold';
  }
  return isDark ? 'text-white/80' : 'text-black/80';
};

const FilterColumn: React.FC<FilterColumnProps> = ({
  header,
  colIndex,
  isDark,
  values,
  activeFilters,
  onToggleFilter,
}) => {
  return (
    <div className="space-y-2">
      <h4 className={`font-semibold text-sm ${isDark ? 'text-white/70' : 'text-black/70'} mb-2`}>
        {header}
      </h4>
      <div className="space-y-2">
        {values.map((value) => {
          const isChecked = activeFilters.has(value);
          const checkboxClassName = getFilterCheckboxClassName(isChecked, isDark);
          const textClassName = getFilterTextClassName(isChecked, isDark);

          return (
            <label 
              key={`${header}-${value}`} 
              className={`flex items-center gap-2 text-sm px-2 py-1 rounded transition-colors cursor-pointer ${checkboxClassName}`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggleFilter(colIndex, value)}
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
};
