import React from 'react';

interface ColumnsPanelProps {
  isDark: boolean;
  headers: string[];
  visibleColumns: Set<number>;
  onToggleColumn: (colIndex: number) => void;
}

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

const getColumnTextClassName = (isVisible: boolean, isDark: boolean): string => {
  if (isVisible) {
    return isDark ? 'text-white font-semibold' : 'text-blue-900 font-semibold';
  }
  return isDark ? 'text-white/80' : 'text-black/80';
};

export const ColumnsPanel: React.FC<ColumnsPanelProps> = ({
  isDark,
  headers,
  visibleColumns,
  onToggleColumn,
}) => {
  return (
    <div
      className={`border-b p-4 ${
        isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-[#f1f0ec]'
      }`}
    >
      <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-black'} mb-3`}>
        Видимость колонок
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {headers.map((header, colIndex) => {
          const isVisible = visibleColumns.has(colIndex);
          const checkboxClassName = getColumnCheckboxClassName(isVisible, isDark);
          const textClassName = getColumnTextClassName(isVisible, isDark);

          return (
            <label
              key={header}
              className={`flex items-center gap-2 cursor-pointer px-2 py-1 rounded transition-colors ${checkboxClassName}`}
            >
              <input
                type="checkbox"
                checked={isVisible}
                onChange={() => onToggleColumn(colIndex)}
                className="cursor-pointer"
              />
              <span className={`text-sm ${textClassName}`}>
                {header}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};
