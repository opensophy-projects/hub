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

function pluralRow(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'строка';
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'строки';
  return 'строк';
}

const TableWithControls: React.FC<TableWithControlsProps> = ({ tableHtml, isDark, onFullscreen }) => {
  const { headers, rows, headerAlignments } = parseTableHtml(tableHtml);
  const {
    state, setState,
    showFilters, setShowFilters,
    filteredAndSortedRows,
    getUniqueValuesForColumn,
    toggleColumnVisibility,
    toggleFilter,
    handleSort,
    resetFilters,
    activeFilterCount,
  } = useTableControls(rows, headers);

  if (!headers.length) return null;

  const outerBg     = isDark ? '#0a0a0a' : '#E8E7E3';
  const outerBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)';
  const outerShadow = isDark
    ? '0 2px 12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)'
    : '0 1px 6px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.07)';
  const footerBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  const footerClr    = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.32)';
  const radius = 12;

  return (
    <div className="not-prose" style={{ margin: '1.25rem 0', width: '100%', minWidth: 0 }}>
      <div style={{
        borderRadius: radius,
        border: `1px solid ${outerBorder}`,
        background: outerBg,
        boxShadow: outerShadow,
        // FIX: overflow:clip clips visually but doesn't block child touch-scroll
        overflow: 'clip',
        display: 'flex',
        flexDirection: 'column',
        // FIX: force full width — was missing boxSizing which caused width calc issues
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box' as const,
      }}>
        <TableControlsBar
          isDark={isDark}
          searchQuery={state.searchQuery}
          onSearchChange={q => setState(p => ({ ...p, searchQuery: q }))}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(v => !v)}
          activeFilterCount={activeFilterCount}
          onResetFilters={resetFilters}
          onFullscreen={() => onFullscreen(tableHtml)}
          tableHtml={tableHtml}
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

        <div style={{
          padding: '6px 12px',
          borderTop: `1px solid ${footerBorder}`,
          fontSize: 11, color: footerClr,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          userSelect: 'none', background: outerBg,
        }}>
          <span>
            {filteredAndSortedRows.length === rows.length
              ? `${rows.length} ${pluralRow(rows.length)}`
              : `${filteredAndSortedRows.length} из ${rows.length} ${pluralRow(rows.length)}`}
          </span>
          {activeFilterCount > 0 && (
            <span>{activeFilterCount} {activeFilterCount === 1 ? 'фильтр' : 'фильтра'} активно</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TableWithControls;