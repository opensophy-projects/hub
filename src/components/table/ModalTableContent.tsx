import React from 'react';

interface ModalTableContentProps {
  isDark: boolean;
  headers: Array<{ text: string; colIndex: number }>;
  filteredRows: Array<Record<string, string>>;
  visibleColumns: Set<string>;
}

const getRowClassName = (rowIndex: number, isDark: boolean): string => {
  const isEvenRow = rowIndex % 2 === 0;
  const baseClass = 'border-t';
  
  if (isEvenRow) {
    return `${baseClass} ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`;
  }
  
  return `${baseClass} ${isDark ? 'bg-[#252525]' : 'bg-gray-50'}`;
};

const generateRowKey = (row: Record<string, string>, index: number, headers: Array<{ text: string; colIndex: number }>): string => {
  const rowContent = headers.map(h => row[h.text] || '').join('|');
  return `row-${index}-${rowContent.substring(0, 50)}`;
};

export const ModalTableContent: React.FC<ModalTableContentProps> = ({
  isDark,
  headers,
  filteredRows,
  visibleColumns,
}) => {
  const visibleHeaders = headers.filter((h) => visibleColumns.has(h.text));

  return (
    <div className="overflow-x-auto overflow-y-auto flex-1">
      <table className={`w-full border-collapse text-sm ${isDark ? 'text-white' : 'text-black'}`}>
        <thead className={`sticky top-0 z-10 ${isDark ? 'bg-[#252525]' : 'bg-white'}`}>
          <tr>
            {visibleHeaders.map((header) => (
              <th
                key={header.colIndex}
                className={`border p-2 font-semibold text-left ${isDark ? 'border-white/10' : 'border-black/10'}`}
              >
                {header.text}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredRows.length === 0 ? (
            <tr>
              <td colSpan={visibleHeaders.length} className="text-center p-4 italic">
                Нет результатов
              </td>
            </tr>
          ) : (
            filteredRows.map((row, idx) => (
              <tr 
                key={generateRowKey(row, idx, visibleHeaders)} 
                className={getRowClassName(idx, isDark)}
              >
                {visibleHeaders.map((header) => (
                  <td
                    key={`cell-${idx}-${header.colIndex}`}
                    className={`border p-2 ${isDark ? 'border-white/10' : 'border-black/10'}`}
                  >
                    {row[header.text] || '-'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};