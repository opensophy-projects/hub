import { useState, useMemo, useCallback } from 'react';
import type { TableControlsState } from '../types/table';
import { filterAndSortRows, stripHtmlNormalize } from '../utils/tableFiltering';

export function useTableControls(rows: Element[], headers: string[]) {
  const [state, setState] = useState<TableControlsState>({
    searchQuery:    '',
    sortColumn:     null,
    sortDirection:  'none',
    filters:        new Map(),
    visibleColumns: new Set(Array.from({ length: headers.length }, (_, i) => i)),
  });

  const [showFilters, setShowFilters] = useState(false);

  const getUniqueValuesForColumn = useCallback((colIndex: number): string[] => {
    return Array.from(
      new Set(
        rows.map((row) => {
          const cells   = Array.from(row.querySelectorAll('td'));
          const cellHtml = cells[colIndex]?.innerHTML || '';
          return stripHtmlNormalize(cellHtml);
        })
      )
    )
      .filter(Boolean)
      .sort();
  }, [rows]);

  const filteredAndSortedRows = useMemo(
    () => filterAndSortRows(rows, state),
    [rows, state]
  );

  const toggleColumnVisibility = useCallback((colIndex: number) => {
    setState((prev) => {
      const next = new Set(prev.visibleColumns);
      next.has(colIndex) ? next.delete(colIndex) : next.add(colIndex);
      return { ...prev, visibleColumns: next };
    });
  }, []);

  const toggleFilter = useCallback((colIndex: number, value: string) => {
    setState((prev) => {
      const newFilters = new Map(prev.filters);
      const colFilters = new Set(newFilters.get(colIndex) ?? []);
      colFilters.has(value) ? colFilters.delete(value) : colFilters.add(value);
      if (colFilters.size === 0) newFilters.delete(colIndex);
      else newFilters.set(colIndex, colFilters);
      return { ...prev, filters: newFilters };
    });
  }, []);

  const handleSort = useCallback((colIndex: number) => {
    setState((prev) => {
      if (prev.sortColumn === colIndex) {
        const dirs = ['asc', 'desc', 'none'] as const;
        const next = dirs[(dirs.indexOf(prev.sortDirection) + 1) % dirs.length];
        return { ...prev, sortDirection: next };
      }
      return { ...prev, sortColumn: colIndex, sortDirection: 'asc' };
    });
  }, []);

  const resetFilters = useCallback(() => {
    setState((prev) => ({
      ...prev,
      searchQuery:   '',
      sortColumn:    null,
      sortDirection: 'none',
      filters:       new Map(),
    }));
  }, []);

  const activeFilterCount = Array.from(state.filters.values()).filter((s) => s.size > 0).length;

  return {
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
  };
}