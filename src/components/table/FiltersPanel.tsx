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
      <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-black'}`}>
        {header}
      </h4>
      <div className="space-y-1">
        {values.map((value) => (
          <label
            key={`${header}-${value}`}
            className="flex items-center gap-2 cursor-pointer text-sm"
          >
            <input
              type="checkbox"
              checked={activeFilters.has(value)}
              onChange={() => onToggleFilter(colIndex, value)}
              className="rounded"
            />
            <span className={isDark ? 'text-white/70' : 'text-black/70'}>
              {value}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};
