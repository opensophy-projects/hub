import type { TableControlsState, ParsedRow } from '../types/table';

export function stripHtmlNormalize(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || div.innerText || '')
    .split(/\s+/)
    .filter(Boolean)
    .join(' ');
}

export function filterAndSortRows(
  rows: Element[],
  state: TableControlsState
): ParsedRow[] {
  let result: ParsedRow[] = rows.map((row) => {
    const cellElements = Array.from(row.querySelectorAll('td'));
    return {
      element: row,
      cells: cellElements.map((td) => td.innerHTML?.trim() || ''),
      alignments: cellElements.map((td) => {
        const a = td.getAttribute('align');
        if (a === 'left' || a === 'center' || a === 'right') return a;
        const s = td.getAttribute('style') || '';
        if (s.includes('text-align: left')   || s.includes('text-align:left'))   return 'left';
        if (s.includes('text-align: center') || s.includes('text-align:center')) return 'center';
        if (s.includes('text-align: right')  || s.includes('text-align:right'))  return 'right';
        return null;
      }),
    };
  });

  result = applyFilters(result, state.filters);
  result = applySearch(result, state.searchQuery);
  result = applySort(result, state.sortColumn, state.sortDirection);
  return result;
}

function applyFilters(rows: ParsedRow[], filters: Map<number, Set<string>>): ParsedRow[] {
  if (filters.size === 0) return rows;
  return rows.filter((row) => {
    for (const [colIndex, values] of filters) {
      if (values.size === 0) continue;
      const cellText = stripHtmlNormalize(row.cells[colIndex] ?? '');
      if (!values.has(cellText)) return false;
    }
    return true;
  });
}

function applySearch(rows: ParsedRow[], searchQuery: string): ParsedRow[] {
  if (!searchQuery) return rows;
  const q = searchQuery.toLowerCase();
  return rows.filter((row) =>
    row.cells.some((html) => stripHtmlNormalize(html).toLowerCase().includes(q))
  );
}

function applySort(
  rows: ParsedRow[],
  sortColumn: number | null,
  sortDirection: 'asc' | 'desc' | 'none'
): ParsedRow[] {
  if (sortColumn === null || sortDirection === 'none') return rows;
  return [...rows].sort((a, b) => {
    const av = stripHtmlNormalize(a.cells[sortColumn] ?? '');
    const bv = stripHtmlNormalize(b.cells[sortColumn] ?? '');
    const c = av.localeCompare(bv, 'ru');
    return sortDirection === 'asc' ? c : -c;
  });
}