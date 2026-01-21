import React, { useState, useMemo, useCallback } from 'react';

interface TableControlsState {
  searchQuery: string;
  sortColumn: number | null;
  sortDirection: 'asc' | 'desc' | 'none';
  filters: Map<number, Set<string>>;
  visibleColumns: Set<number>;
}

interface TableWithControlsProps {
  tableHtml: string;
  isDark: boolean;
  onFullscreen: (html: string) => void;
}

const EyeIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ExpandIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
);

const TableWithControls: React.FC<TableWithControlsProps> = ({ tableHtml, isDark, onFullscreen }) => {
  const [state, setState] = useState<TableControlsState>({
    searchQuery: '',
    sortColumn: null,
    sortDirection: 'none',
    filters: new Map(),
    visibleColumns: new Set(),
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showColumns, setShowColumns] = useState(false);

  const parser = new DOMParser();
  const doc = parser.parseFromString(tableHtml, 'text/html');
  const table = doc.querySelector('table');

  if (!table) return null;

  const headers = Array.from(table.querySelectorAll('thead th')).map((th) => th.textContent || '');
  const rows = Array.from(table.querySelectorAll('tbody tr'));

  if (state.visibleColumns.size === 0) {
    const newVisibleColumns = new Set(Array.from({ length: headers.length }, (_, i) => i));
    setState((prev) => ({ ...prev, visibleColumns: newVisibleColumns }));
  }

  const getUniqueValuesForColumn = useCallback((colIndex: number): string[] => {
    return Array.from(
      new Set(
        rows.map((row) => {
          const cells = Array.from(row.querySelectorAll('td'));
          return cells[colIndex]?.textContent?.trim() || '';
        })
      )
    ).filter(Boolean).sort();
  }, [rows]);

  const filteredAndSortedRows = useMemo(() => {
    let result = rows.map((row) => ({
      element: row,
      cells: Array.from(row.querySelectorAll('td')).map((td) => td.textContent?.trim() || ''),
    }));

    state.filters.forEach((values, colIndex) => {
      if (values.size > 0) {
        result = result.filter((row) => values.has(row.cells[colIndex]));
      }
    });

    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      result = result.filter((row) =>
        row.cells.some((cell) => cell.toLowerCase().includes(query))
      );
    }

    if (state.sortColumn !== null && state.sortDirection !== 'none') {
      result.sort((a, b) => {
        const aVal = a.cells[state.sortColumn] || '';
        const bVal = b.cells[state.sortColumn] || '';
        const cmp = aVal.localeCompare(bVal, 'ru');
        return state.sortDirection === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [rows, state.filters, state.searchQuery, state.sortColumn, state.sortDirection]);

  const activeFilterCount = Array.from(state.filters.values()).filter((set) => set.size > 0).length;

  const toggleColumnVisibility = (colIndex: number) => {
    setState((prev) => {
      const newVisible = new Set(prev.visibleColumns);
      if (newVisible.has(colIndex)) {
        newVisible.delete(colIndex);
      } else {
        newVisible.add(colIndex);
      }
      return { ...prev, visibleColumns: newVisible };
    });
  };

  const toggleFilter = (colIndex: number, value: string) => {
    setState((prev) => {
      const newFilters = new Map(prev.filters);
      const colFilters = new Set(newFilters.get(colIndex) || []);
      if (colFilters.has(value)) {
        colFilters.delete(value);
      } else {
        colFilters.add(value);
      }
      if (colFilters.size === 0) {
        newFilters.delete(colIndex);
      } else {
        newFilters.set(colIndex, colFilters);
      }
      return { ...prev, filters: newFilters };
    });
  };

  const handleSort = (colIndex: number) => {
    setState((prev) => {
      if (prev.sortColumn === colIndex) {
        const nextDir = prev.sortDirection === 'asc' ? 'desc' : prev.sortDirection === 'desc' ? 'none' : 'asc';
        return { ...prev, sortDirection: nextDir as 'asc' | 'desc' | 'none' };
      }
      return { ...prev, sortColumn: colIndex, sortDirection: 'asc' };
    });
  };

  const resetFilters = () => {
    setState((prev) => ({
      ...prev,
      searchQuery: '',
      sortColumn: null,
      sortDirection: 'none',
      filters: new Map(),
    }));
  };

  return (
    <div className="my-4">
      <div className={`rounded-lg border ${isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-gray-200 bg-gray-50'}`}>
        <div
          className={`flex flex-wrap items-center gap-2 p-3 border-b ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`}
        >
          <input
            type="text"
            placeholder="Поиск в таблице..."
            value={state.searchQuery}
            onChange={(e) => setState((prev) => ({ ...prev, searchQuery: e.target.value }))}
            className={`flex-1 min-w-[200px] px-3 py-2 rounded-lg text-sm transition-colors ${
              isDark
                ? 'bg-white/10 border border-white/20 text-white placeholder-white/50 focus:bg-white/15 focus:border-white/40'
                : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-gray-50 focus:border-gray-400'
            } focus:outline-none`}
          />

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDark
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-300'
            }`}
            title="Фильтрация"
          >
            Фильтр {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>

          <button
            onClick={() => setShowColumns(!showColumns)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              isDark
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-300'
            }`}
            title="Видимость колонок"
          >
            <EyeIcon />
            Колонки
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDark
                  ? 'bg-white/10 hover:bg-white/20 text-white'
                  : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-300'
              }`}
            >
              Сбросить
            </button>
          )}

          <button
            onClick={() => onFullscreen(tableHtml)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              isDark
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-300'
            }`}
            title="Открыть в полном размере"
          >
            <ExpandIcon />
          </button>
        </div>

        {showFilters && (
          <div
            className={`border-b p-4 grid gap-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`}
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}
          >
            {headers.map((header, colIndex) => {
              const values = getUniqueValuesForColumn(colIndex);
              const activeFilters = state.filters.get(colIndex) || new Set();
              return (
                <div key={colIndex} className="space-y-2">
                  <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{header}</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {values.map((value) => (
                      <label key={value} className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={activeFilters.has(value)}
                          onChange={() => toggleFilter(colIndex, value)}
                          className="rounded"
                        />
                        <span className={isDark ? 'text-white/70' : 'text-gray-700'}>{value}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showColumns && (
          <div
            className={`border-b p-4 space-y-2 ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-white'}`}
          >
            <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Видимость колонок</h4>
            <div className="space-y-2">
              {headers.map((header, colIndex) => (
                <label key={colIndex} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={state.visibleColumns.has(colIndex)}
                    onChange={() => toggleColumnVisibility(colIndex)}
                    className="rounded"
                  />
                  <span className={isDark ? 'text-white/70' : 'text-gray-700'}>{header}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="relative w-full overflow-x-auto overflow-y-auto max-h-96">
          <table className={`w-full border-collapse text-sm ${isDark ? 'prose-invert' : ''}`}>
            <thead>
              <tr
                className={`${
                  isDark ? 'border-white/10' : 'border-gray-200'
                } border-b`}
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 20
                }}
              >
                {headers.map((header, colIndex) => (
                  state.visibleColumns.has(colIndex) && (
                    <th
                      key={colIndex}
                      className={`px-4 py-3 text-left font-semibold cursor-pointer transition-colors ${
                        isDark ? 'hover:bg-white/25 text-white' : 'hover:bg-[#ddd8cd] text-gray-900'
                      }`}
                      onClick={() => handleSort(colIndex)}
                      style={{
                        backgroundColor: isDark ? '#1a1a1a' : '#E8E7E3'
                      }}
                    >
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <span>{header}</span>
                        {state.sortColumn === colIndex && state.sortDirection !== 'none' && (
                          <span className="text-xs">{state.sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                  )
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedRows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`border-b transition-colors ${
                    isDark
                      ? 'border-white/10 hover:bg-white/5'
                      : 'border-gray-200 hover:bg-gray-100'
                  } ${rowIndex % 2 === 0 ? (isDark ? '' : 'bg-white') : (isDark ? '' : 'bg-[#E8E7E3]')}`}
                >
                  {row.cells.map((cell, colIndex) => {
                    if (!state.visibleColumns.has(colIndex)) return null;

                    let displayCell = cell;
                    if (state.searchQuery && cell.toLowerCase().includes(state.searchQuery.toLowerCase())) {
                      const regex = new RegExp(`(${state.searchQuery})`, 'gi');
                      displayCell = cell.replace(regex, '<mark style="background-color: rgb(59, 130, 246); color: white; padding: 2px 4px; border-radius: 2px; font-weight: 600;">$1</mark>');
                    }

                    return (
                      <td
                        key={colIndex}
                        className={`px-4 py-3 ${isDark ? 'text-white/90' : 'text-gray-900'}`}
                        dangerouslySetInnerHTML={{ __html: displayCell }}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {filteredAndSortedRows.length === 0 && (
            <div className={`p-6 text-center ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
              Нет результатов
            </div>
          )}
        </div>
      </div>

      <style>{`
        table {
          font-size: inherit;
        }
        th, td {
          word-break: break-word;
          overflow-wrap: break-word;
          white-space: normal;
          hyphens: auto;
          min-width: 120px;
        }
      `}</style>
    </div>
  );
};

export default TableWithControls;
