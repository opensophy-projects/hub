import React from 'react';

interface ColumnsSectionProps {
  isDark: boolean;
  showColumns: boolean;
  headers: Array<{ text: string; colIndex: number }>;
  visibleColumns: Set<string>;
  onColumnToggle: (columnName: string) => void;
}

export const ColumnsSection: React.FC<ColumnsSectionProps> = ({
  isDark,
  showColumns,
  headers,
  visibleColumns,
  onColumnToggle,
}) => {
  if (!showColumns) return null;

  return (
    <div
      className={`border-p-4 space-y-2 p-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}
    >
      <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-black'}`}>
        Видимость колонок
      </h4>
      {headers.map((header) => (
        <label key={header.colIndex} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={visibleColumns.has(header.text)}
            onChange={() => onColumnToggle(header.text)}
          />
          <span className={`text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}>
            {header.text}
          </span>
        </label>
      ))}
    </div>
  );
};
