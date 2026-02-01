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
  const styles = useMemo(() => getTableStyles(isDark), [isDark]);

  return (
    <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
      <table className="w-full border-collapse text-sm">
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

      <style>{styles}</style>
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
      <tr className={`${isDark ? 'border-white/10' : 'border-black/10'} border-b`}>
        {headers.map((header, colIndex) =>
          visibleColumns.has(colIndex) ? (
            <th
              key={header}
              className={`px-4 py-3 text-left font-semibold cursor-pointer transition-colors ${
                isDark
                  ? 'text-white hover:bg-white/20'
                  : 'text-black hover:bg-[#ddd8cd]'
              }`}
              onClick={() => onSort(colIndex)}
              style={{
                backgroundColor: isDark ? '#1a1a1a' : '#E8E7E3',
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

const TableRow: React.FC<TableRowProps> = ({
  isDark,
  row,
  rowIndex,
  visibleColumns,
  searchQuery,
}) => {
  const isEvenRow = rowIndex % 2 === 0;
  
  const backgroundClass = isEvenRow
    ? isDark ? '' : 'bg-[#E8E7E3]'
    : isDark ? '' : 'bg-[#f1f0ec]';

  return (
    <tr
      className={`border-b transition-colors ${
        isDark
          ? 'border-white/10 hover:bg-white/5'
          : 'border-black/10 hover:bg-[#ddd8cd]'
      } ${backgroundClass}`}
    >
      {row.cells.map((cell, colIndex) =>
        visibleColumns.has(colIndex) ? (
          <td
            key={`cell-${rowIndex}-${colIndex}`}
            className={`px-4 py-3 ${isDark ? 'text-white/90' : 'text-black'}`}
          >
            <HighlightText text={cell} query={searchQuery} />
          </td>
        ) : null
      )}
    </tr>
  );
};

function getTableStyles(isDark: boolean): string {
  return `
    table {
      border-collapse: collapse;
      width: 100%;
    }
    th, td {
      border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)'};
      padding: 0.75rem;
      text-align: left;
      color: ${isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgb(0, 0, 0)'};
      word-break: break-word;
      overflow-wrap: break-word;
      white-space: normal;
      hyphens: auto;
      min-width: 120px;
    }
    th {
      background-color: ${isDark ? '#1a1a1a' : '#E8E7E3'};
      font-weight: 600;
      color: ${isDark ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)'};
      position: sticky;
      top: 0;
      z-index: 20;
    }
    tr:nth-child(even) {
      background-color: ${isDark ? 'rgba(255, 255, 255, 0.03)' : '#f1f0ec'};
    }
  `;
}
