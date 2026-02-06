import { TableControlsState, ParsedRow } from '../types/table';

export function filterAndSortRows(
  rows: Element[],
  state: TableControlsState
): ParsedRow[] {
  let result = rows.map((row) => ({
    element: row,
    cells: Array.from(row.querySelectorAll('td')).map(
      (td) => td.innerHTML || '' // Используем innerHTML вместо textContent
    ),
  }));

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
      // Для фильтрации используем текстовое содержимое
      const cellText = stripHtmlTags(row.cells[colIndex]);
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
    row.cells.some((cell) => {
      const cellText = stripHtmlTags(cell);
      return cellText.toLowerCase().includes(query);
    })
  );
}

function applySort(
  rows: ParsedRow[],
  sortColumn: number | null,
  sortDirection: 'asc' | 'desc' | 'none'
): ParsedRow[] {
  if (sortColumn === null || sortDirection === 'none') return rows;

  return [...rows].sort((a, b) => {
    const aVal = stripHtmlTags(a.cells[sortColumn] || '');
    const bVal = stripHtmlTags(b.cells[sortColumn] || '');
    const cmp = aVal.localeCompare(bVal, 'ru');
    return sortDirection === 'asc' ? cmp : -cmp;
  });
}

// Утилита для удаления HTML тегов для сравнения
function stripHtmlTags(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}
