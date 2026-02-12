import React from 'react';

interface ColumnsPanelProps {
  isDark: boolean;
  headers: string[];
  visibleColumns: Set<number>;
  onToggleColumn: (colIndex: number) => void;
}

export const ColumnsPanel: React.FC<ColumnsPanelProps> = ({
  isDark,
  headers,
  visibleColumns,
  onToggleColumn,
}) => {
  return (
    <div
      className={`border-b p-4 space-y-2 ${
        isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-[#f1f0ec]'
      }`}
    >
      <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-black'}`}>
        Видимость колонок
      </h4>
      <div className="space-y-2">
        {headers.map((header, colIndex) => (
          <label
            key={header}
            className="flex items-center gap-2 cursor-pointer text-sm"
          >
            <input
              type="checkbox"
              checked={visibleColumns.has(colIndex)}
              onChange={() => onToggleColumn(colIndex)}
              className="rounded"
            />
            <span className={isDark ? 'text-white/70' : 'text-black/70'}>
              {header}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};
