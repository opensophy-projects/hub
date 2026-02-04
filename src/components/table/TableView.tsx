import React, { useMemo } from 'react';
import { ParsedRow } from '../../types/table';
import { HighlightText } from '../HighlightText';

interface TableViewProps {
  isDark: boolean;
  headers: string[];
  rows: ParsedRow[];
  visibleColumns: Set<number>;
  searchQuery: string;
  sortColumn: number | null;
  sortDirection: 'asc' | 'desc' | 'none';
  onSort: (colIndex: number) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  isDark,
  headers,
  rows,
  visibleColumns,
  searchQuery,
  sortColumn,
  sortDirection,
  onSort,
}) => {
  return (
    <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
      <table className="w-full text-sm" style={{ borderCollapse: 'collapse', borderSpacing: 0 }}>
        <TableHead
          isDark={isDark}
          headers={headers}
          visibleColumns={visibleColumns}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={onSort}
        />
        <tbody>
          {rows.map((row, rowIndex) => (
            <TableRow
              key={`row-${rowIndex}-${row.cells.join('-')}`}
              isDark={isDark}
              row={row}
              rowIndex={rowIndex}
              visibleColumns={visibleColumns}
              searchQuery={searchQuery}
            />
          ))}
        </tbody>
      </table>

      {rows.length === 0 && (
        <div className={`p-6 text-center ${isDark ? 'text-white/50' : 'text-black/50'}`}>
          Нет результатов
        </div>
      )}
    </div>
  );
};

interface TableHeadProps {
  isDark: boolean;
  headers: string[];
  visibleColumns: Set<number>;
  sortColumn: number | null;
  sortDirection: 'asc' | 'desc' | 'none';
  onSort: (colIndex: number) => void;
}

const TableHead: React.FC<TableHeadProps> = ({
  isDark,
  headers,
  visibleColumns,
  sortColumn,
  sortDirection,
  onSort,
}) => {
  return (
    <thead className="sticky top-0 z-20">
      <tr 
        className={`${isDark ? 'border-white/20' : 'border-black/20'}`}
        style={{ 
          borderBottom: `2px solid ${isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'}` 
        }}
      >
        {headers.map((header, colIndex) =>
          visibleColumns.has(colIndex) ? (
            <th
              key={header}
              className={`px-4 py-3 text-left font-semibold cursor-pointer transition-colors ${
                isDark
                  ? 'text-white hover:bg-white/10'
                  : 'text-black hover:bg-black/5'
              }`}
              onClick={() => onSort(colIndex)}
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}`,
                verticalAlign: 'top',
              }}
            >
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span>{header}</span>
                {sortColumn === colIndex && sortDirection !== 'none' && (
                  <span className="text-xs">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </th>
          ) : null
        )}
      </tr>
    </thead>
  );
};

interface TableRowProps {
  isDark: boolean;
  row: ParsedRow;
  rowIndex: number;
  visibleColumns: Set<number>;
  searchQuery: string;
}

const getRowBackgroundClass = (isEvenRow: boolean, isDark: boolean): string => {
  if (isDark) {
    return isEvenRow ? '' : 'bg-white/[0.02]';
  }
  return isEvenRow ? 'bg-transparent' : 'bg-black/[0.02]';
};

const TableRow: React.FC<TableRowProps> = ({
  isDark,
  row,
  rowIndex,
  visibleColumns,
  searchQuery,
}) => {
  const isEvenRow = rowIndex % 2 === 0;
  const backgroundClass = getRowBackgroundClass(isEvenRow, isDark);

  return (
    <tr
      className={`transition-colors ${
        isDark
          ? 'hover:bg-white/5'
          : 'hover:bg-black/5'
      } ${backgroundClass}`}
      style={{
        borderBottom: rowIndex === row.cells.length - 1 ? 'none' : `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
      }}
    >
      {row.cells.map((cell, colIndex) =>
        visibleColumns.has(colIndex) ? (
          <td
            key={`cell-${rowIndex}-${colIndex}`}
            className={`px-4 py-3 ${isDark ? 'text-white/90' : 'text-black'}`}
            style={{
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'}`,
              verticalAlign: 'top',
            }}
          >
            <HighlightText text={cell} query={searchQuery} />
          </td>
        ) : null
      )}
    </tr>
  );
};
