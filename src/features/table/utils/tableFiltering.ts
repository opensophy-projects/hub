import type { TableControlsState, ParsedRow } from '../types/table';

export function stripHtmlNormalize(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || div.innerText || '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function filterAndSortRows(
  rows: Element[],
  state: TableControlsState
): ParsedRow[] {
  const result: ParsedRow[] = rows.map((row) => {
    const cells = Array.from(row.querySelectorAll('td'));
    return {
      element: row,
      cells: cells.map((td) => td.innerHTML?.trim() || ''),
      alignments: cells.map((td) => {
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

  let filtered = applyFilters(result, state.filters);
  filtered = applySearch(filtered, state.searchQuery);
  filtered = applySort(filtered, state.sortColumn, state.sortDirection);
  return filtered;
}

function applyFilters(rows: ParsedRow[], filters: Map<number, Set<string>>): ParsedRow[] {
  if (filters.size === 0) return rows;

  return rows.filter((row) => {
    // AND between columns: every filtered column must match at least one selected value (OR)
    for (const [colIndex, selectedValues] of filters) {
      if (selectedValues.size === 0) continue;

      const rawHtml  = row.cells[colIndex] ?? '';
      const cellText = stripHtmlNormalize(rawHtml);

      // OR: does any selected value match this cell?
      let matched = false;
      for (const sel of selectedValues) {
        // Compare normalized — both stripped the same way
        if (cellText === sel) { matched = true; break; }
        // Fallback: partial match in case of minor whitespace differences
        if (cellText.includes(sel) || sel.includes(cellText)) { matched = true; break; }
      }
      if (!matched) return false;
    }
    return true;
  });
}

function applySearch(rows: ParsedRow[], searchQuery: string): ParsedRow[] {
  if (!searchQuery.trim()) return rows;
  const q = searchQuery.toLowerCase().trim();
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
    const c  = av.localeCompare(bv, 'ru');
    return sortDirection === 'asc' ? c : -c;
  });
}