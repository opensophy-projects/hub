import { useState, useMemo, useCallback } from 'react';
import type { TableControlsState } from '../types/table';
import { filterAndSortRows } from '../utils/tableFiltering';

function stripHtmlTags(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

export function useTableControls(rows: Element[], headers: string[]) {
  const [state, setState] = useState<TableControlsState>({
    searchQuery: '',
    sortColumn: null,
    sortDirection: 'none',
    filters: new Map(),
    visibleColumns: new Set(Array.from({ length: headers.length }, (_, i) => i)),
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showColumns, setShowColumns] = useState(false);

  const getUniqueValuesForColumn = useCallback((colIndex: number): string[] => {
    return Array.from(
      new Set(
        rows.map((row) => {
          const cells = Array.from(row.querySelectorAll('td'));
          const cellHTML = cells[colIndex]?.innerHTML || '';
          return stripHtmlTags(cellHTML).trim();
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
      const newVisible = new Set(prev.visibleColumns);
      if (newVisible.has(colIndex)) {
        newVisible.delete(colIndex);
      } else {
        newVisible.add(colIndex);
      }
      return { ...prev, visibleColumns: newVisible };
    });
  }, []);

  const toggleFilter = useCallback((colIndex: number, value: string) => {
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
  }, []);

  const handleSort = useCallback((colIndex: number) => {
    setState((prev) => {
      if (prev.sortColumn === colIndex) {
        const directions: ('asc' | 'desc' | 'none')[] = ['asc', 'desc', 'none'];
        const currentIndex = directions.indexOf(prev.sortDirection);
        const nextDir = directions[(currentIndex + 1) % directions.length];
        return { ...prev, sortDirection: nextDir };
      }
      return { ...prev, sortColumn: colIndex, sortDirection: 'asc' };
    });
  }, []);

  const resetFilters = useCallback(() => {
    setState((prev) => ({
      ...prev,
      searchQuery: '',
      sortColumn: null,
      sortDirection: 'none',
      filters: new Map(),
    }));
  }, []);

  const activeFilterCount = Array.from(state.filters.values()).filter(
    (set) => set.size > 0
  ).length;

  return {
    state,
    setState,
    showFilters,
    setShowFilters,
    showColumns,
    setShowColumns,
    filteredAndSortedRows,
    getUniqueValuesForColumn,
    toggleColumnVisibility,
    toggleFilter,
    handleSort,
    resetFilters,
    activeFilterCount,
  };
}
