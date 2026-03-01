import React from 'react';
import { useTableControls } from '../hooks/useTableControls';
import { parseTableHtml } from '../utils/tableParser';
import { TableControlsBar } from './TableControlsBar';
import { FiltersPanel } from './FiltersPanel';
import { ColumnsPanel } from './ColumnsPanel';
import { TableView } from './TableView';

interface TableWithControlsProps {
  tableHtml: string;
  isDark: boolean;
  onFullscreen: (html: string) => void;
}

const TableWithControls: React.FC<TableWithControlsProps> = ({ tableHtml, isDark, onFullscreen }) => {
  const { headers, rows, headerAlignments } = parseTableHtml(tableHtml);
  const {
    state,
    setState,
    showFilters,
    setShowFilters,
    filteredAndSortedRows,
    getUniqueValuesForColumn,
    toggleColumnVisibility,
    toggleFilter,
    handleSort,
    resetFilters,
    activeFilterCount,
  } = useTableControls(rows, headers);

  if (!headers.length) return null;

  return (
    <div className="not-prose">
      <div
        className={`rounded-lg border overflow-hidden flex flex-col ${
          isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-black/10 bg-[#E8E7E3]'
        }`}
      >
        <TableControlsBar
          isDark={isDark}
          searchQuery={state.searchQuery}
          onSearchChange={(query) => setState((prev) => ({ ...prev, searchQuery: query }))}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          activeFilterCount={activeFilterCount}
          onResetFilters={resetFilters}
          onFullscreen={() => onFullscreen(tableHtml)}
        />

        {showFilters && (
          <>
            <FiltersPanel
              isDark={isDark}
              headers={headers}
              filters={state.filters}
              onToggleFilter={toggleFilter}
              getUniqueValuesForColumn={getUniqueValuesForColumn}
            />
            <ColumnsPanel
              isDark={isDark}
              headers={headers}
              visibleColumns={state.visibleColumns}
              onToggleColumn={toggleColumnVisibility}
            />
          </>
        )}

        {/*
          Без фиксированной высоты — контейнер адаптируется под контент.
          maxHeight внутри TableView ограничивает рост при большом числе строк
          и включает внутренний скролл + sticky thead.
        */}
        <TableView
          isDark={isDark}
          headers={headers}
          rows={filteredAndSortedRows}
          visibleColumns={state.visibleColumns}
          searchQuery={state.searchQuery}
          sortColumn={state.sortColumn}
          sortDirection={state.sortDirection}
          onSort={handleSort}
          headerAlignments={headerAlignments}
        />
      </div>
    </div>
  );
};

export default TableWithControls;