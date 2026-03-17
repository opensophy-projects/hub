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

  // Design tokens
  const outerBorder  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,15,20,0.09)';
  const outerBg      = isDark ? '#0e0e10'                : '#ffffff';
  const outerShadow  = isDark
    ? '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)'
    : '0 1px 4px rgba(15,15,20,0.08), 0 0 0 1px rgba(15,15,20,0.06)';

  return (
    <div className="not-prose" style={{ margin: '1.5rem 0' }}>
      <div style={{
        borderRadius: 12,
        border: `1px solid ${outerBorder}`,
        background: outerBg,
        boxShadow: outerShadow,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
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

        {/* Row count footer */}
        <div style={{
          padding: '7px 12px',
          borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,15,20,0.06)'}`,
          fontSize: 11,
          color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(15,15,20,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          userSelect: 'none',
        }}>
          <span>
            {filteredAndSortedRows.length === rows.length
              ? `${rows.length} ${pluralRow(rows.length)}`
              : `${filteredAndSortedRows.length} из ${rows.length} ${pluralRow(rows.length)}`
            }
          </span>
          {activeFilterCount > 0 && (
            <span style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(15,15,20,0.4)' }}>
              {activeFilterCount} {activeFilterCount === 1 ? 'фильтр' : 'фильтра'} активно
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

function pluralRow(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'строка';
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'строки';
  return 'строк';
}

export default TableWithControls;