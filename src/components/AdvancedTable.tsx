import React, { useState, useMemo } from 'react';
import { Search, Maximize2, X, Filter, SortAsc, SortDesc, Eye, EyeOff } from 'lucide-react';

interface AdvancedTableProps {
  htmlContent: string;
  isDark: boolean;
  onFullscreen: (html: string) => void;
}

interface TableData {
  headers: string[];
  rows: string[][];
}

const AdvancedTable: React.FC<AdvancedTableProps> = ({ htmlContent, isDark, onFullscreen }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterColumn, setFilterColumn] = useState<number | null>(null);
  const [filterValues, setFilterValues] = useState<Set<string>>(new Set());
  const [hiddenColumns, setHiddenColumns] = useState<Set<number>>(new Set());
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const tableData = useMemo(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const table = doc.querySelector('table');
    
    if (!table) return null;

    const headers: string[] = [];
    const rows: string[][] = [];

    const thead = table.querySelector('thead');
    if (thead) {
      const headerRow = thead.querySelector('tr');
      if (headerRow) {
        headerRow.querySelectorAll('th').forEach(th => {
          headers.push(th.textContent?.trim() || '');
        });
      }
    }

    const tbody = table.querySelector('tbody') || table;
    tbody.querySelectorAll('tr').forEach((tr, idx) => {
      if (thead && idx === 0 && tr.parentElement?.tagName !== 'TBODY') return;
      
      const row: string[] = [];
      tr.querySelectorAll('td, th').forEach(cell => {
        row.push(cell.textContent?.trim() || '');
      });
      if (row.length > 0) rows.push(row);
    });

    return { headers, rows };
  }, [htmlContent]);

  const filteredAndSortedData = useMemo(() => {
    if (!tableData) return null;

    let processedRows = [...tableData.rows];

    // Фильтрация по поиску
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      processedRows = processedRows.filter(row =>
        row.some(cell => cell.toLowerCase().includes(query))
      );
    }

    // Фильтрация по значениям колонки
    if (filterColumn !== null && filterValues.size > 0) {
      processedRows = processedRows.filter(row =>
        filterValues.has(row[filterColumn] || '')
      );
    }

    // Сортировка
    if (sortColumn !== null) {
      processedRows.sort((a, b) => {
        const aVal = a[sortColumn] || '';
        const bVal = b[sortColumn] || '';
        
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }
        
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      });
    }

    return processedRows;
  }, [tableData, searchQuery, sortColumn, sortDirection, filterColumn, filterValues]);

  const uniqueValuesForColumn = useMemo(() => {
    if (!tableData || filterColumn === null) return [];
    return Array.from(new Set(tableData.rows.map(row => row[filterColumn] || '')));
  }, [tableData, filterColumn]);

  if (!tableData) return null;

  const handleSort = (columnIndex: number) => {
    if (sortColumn === columnIndex) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnIndex);
      setSortDirection('asc');
    }
  };

  const toggleColumnVisibility = (columnIndex: number) => {
    setHiddenColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnIndex)) {
        newSet.delete(columnIndex);
      } else {
        newSet.add(columnIndex);
      }
      return newSet;
    });
  };

  const visibleHeaders = tableData.headers.filter((_, idx) => !hiddenColumns.has(idx));
  const visibleColumnIndices = tableData.headers.map((_, idx) => idx).filter(idx => !hiddenColumns.has(idx));

  return (
    <div className={`relative rounded-lg border ${isDark ? 'border-white/10' : 'border-black/10'}`}>
      {/* Панель инструментов */}
      <div className={`flex items-center gap-2 p-3 border-b ${isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-black/10 bg-[#E8E7E3]'}`}>
        {/* Поиск */}
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-white/40' : 'text-black/40'}`} />
          <input
            type="text"
            placeholder="Поиск по таблице..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm ${
              isDark 
                ? 'bg-white/5 border-white/10 text-white placeholder-white/40' 
                : 'bg-black/5 border-black/10 text-black placeholder-black/40'
            }`}
          />
        </div>

        {/* Кнопка меню колонок */}
        <div className="relative">
          <button
            onClick={() => setShowColumnMenu(!showColumnMenu)}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/10 text-black'
            }`}
            title="Управление колонками"
          >
            <Eye className="w-4 h-4" />
          </button>
          
          {showColumnMenu && (
            <div className={`absolute right-0 top-full mt-2 w-48 rounded-lg border shadow-lg z-10 ${
              isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-black/10'
            }`}>
              <div className="p-2 space-y-1">
                {tableData.headers.map((header, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleColumnVisibility(idx)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                      isDark ? 'hover:bg-white/5 text-white' : 'hover:bg-black/5 text-black'
                    }`}
                  >
                    {hiddenColumns.has(idx) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span className={hiddenColumns.has(idx) ? 'opacity-50' : ''}>{header}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Фильтр */}
        <button
          className={`p-2 rounded-lg transition-colors ${
            isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/10 text-black'
          }`}
          title="Фильтр"
        >
          <Filter className="w-4 h-4" />
        </button>

        {/* Полноэкранный режим */}
        <button
          onClick={() => onFullscreen(htmlContent)}
          className={`p-2 rounded-lg transition-colors ${
            isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/10 text-black'
          }`}
          title="Открыть на весь экран"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Таблица */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`sticky top-0 z-10 ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#E8E7E3]'}`}>
            <tr>
              {visibleColumnIndices.map((originalIdx) => (
                <th
                  key={originalIdx}
                  className={`px-4 py-3 text-left text-sm font-semibold border-b cursor-pointer transition-colors ${
                    isDark 
                      ? 'border-white/10 hover:bg-white/5' 
                      : 'border-black/10 hover:bg-black/5'
                  }`}
                  onClick={() => handleSort(originalIdx)}
                >
                  <div className="flex items-center gap-2">
                    <span>{tableData.headers[originalIdx]}</span>
                    {sortColumn === originalIdx && (
                      sortDirection === 'asc' 
                        ? <SortAsc className="w-4 h-4" />
                        : <SortDesc className="w-4 h-4" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedData?.map((row, rowIdx) => (
              <tr 
                key={rowIdx}
                className={`border-b ${
                  isDark 
                    ? 'border-white/10 hover:bg-white/5' 
                    : 'border-black/10 hover:bg-black/5'
                }`}
              >
                {visibleColumnIndices.map((originalIdx) => (
                  <td 
                    key={originalIdx}
                    className={`px-4 py-3 text-sm ${isDark ? 'text-white/80' : 'text-black/80'}`}
                  >
                    {row[originalIdx]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Результаты */}
      <div className={`px-4 py-2 border-t text-xs ${
        isDark ? 'border-white/10 text-white/60' : 'border-black/10 text-black/60'
      }`}>
        Показано записей: {filteredAndSortedData?.length || 0} из {tableData.rows.length}
      </div>
    </div>
  );
};

export default AdvancedTable;
