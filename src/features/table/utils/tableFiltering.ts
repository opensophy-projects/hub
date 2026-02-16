import type { TableControlsState, ParsedRow } from '../types/table';

export function filterAndSortRows(
  rows: Element[],
  state: TableControlsState
): ParsedRow[] {
  let result = rows.map((row) => {
    const cellElements = Array.from(row.querySelectorAll('td'));
    return {
      element: row,
      cells: cellElements.map((td) => td.textContent?.trim() || ''),
      alignments: cellElements.map((td) => {
        const alignAttr = td.getAttribute('align');
        if (alignAttr === 'left' || alignAttr === 'center' || alignAttr === 'right') {
          return alignAttr;
        }
        const style = td.getAttribute('style');
        if (style) {
          if (style.includes('text-align: left') || style.includes('text-align:left')) {
            return 'left';
          }
          if (style.includes('text-align: center') || style.includes('text-align:center')) {
            return 'center';
          }
          if (style.includes('text-align: right') || style.includes('text-align:right')) {
            return 'right';
          }
        }
        return null;
      }),
    };
  });

  result = applyFilters(result, state.filters);
  result = applySearch(result, state.searchQuery);
  result = applySort(result, state.sortColumn, state.sortDirection);

  return result;
}

function applyFilters(
  rows: ParsedRow[],
  filters: Map<number, Set<string>>
): ParsedRow[] {
  if (filters.size === 0) return rows;

  return rows.filter((row) => {
    for (const [colIndex, values] of filters) {
      const cellText = row.cells[colIndex] ?? '';
      if (values.size > 0 && !values.has(cellText)) {
        return false;
      }
    }
    return true;
  });
}

function applySearch(rows: ParsedRow[], searchQuery: string): ParsedRow[] {
  if (!searchQuery) return rows;
  const query = searchQuery.toLowerCase();
  return rows.filter((row) =>
    row.cells.some((cell) => cell.toLowerCase().includes(query))
  );
}

function applySort(
  rows: ParsedRow[],
  sortColumn: number | null,
  sortDirection: 'asc' | 'desc' | 'none'
): ParsedRow[] {
  if (sortColumn === null || sortDirection === 'none') return rows;

  return [...rows].sort((a, b) => {
    const aVal = a.cells[sortColumn] ?? '';
    const bVal = b.cells[sortColumn] ?? '';
    const cmp = aVal.localeCompare(bVal, 'ru');
    return sortDirection === 'asc' ? cmp : -cmp;
  });
}
