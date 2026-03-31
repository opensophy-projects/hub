import type { TableControlsState, ParsedRow } from '../types/table';

// Извлекает чистый текст из HTML-строки, нормализуя пробелы
export function stripHtmlNormalize(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return (doc.body.textContent || '').split(/\s+/).join(' ').trim();
}

// Парсит строки таблицы и применяет фильтрацию, поиск и сортировку
export function filterAndSortRows(
  rows: Element[],
  state: TableControlsState,
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
        if (s.includes('text-align: left') || s.includes('text-align:left')) return 'left';
        if (s.includes('text-align: center') || s.includes('text-align:center')) return 'center';
        if (s.includes('text-align: right') || s.includes('text-align:right')) return 'right';
        return null;
      }),
    };
  });

  let filtered = applyFilters(result, state.filters);
  filtered = applySearch(filtered, state.searchQuery);
  filtered = applySort(filtered, state.sortColumn, state.sortDirection);
  return filtered;
}

// Фильтрует строки по выбранным значениям колонок (AND между колонками, OR внутри колонки)
function applyFilters(rows: ParsedRow[], filters: Map<number, Set<string>>): ParsedRow[] {
  if (filters.size === 0) return rows;

  return rows.filter((row) => {
    for (const [colIndex, selectedValues] of filters) {
      if (selectedValues.size === 0) continue;

      const cellText = stripHtmlNormalize(row.cells[colIndex] ?? '');
      const matched = [...selectedValues].some(
        (sel) => cellText === sel || cellText.includes(sel) || sel.includes(cellText),
      );

      if (!matched) return false;
    }
    return true;
  });
}

// Фильтрует строки по поисковому запросу (по всем колонкам)
function applySearch(rows: ParsedRow[], searchQuery: string): ParsedRow[] {
  const q = searchQuery.toLowerCase().trim();
  if (!q) return rows;

  return rows.filter((row) =>
    row.cells.some((html) => stripHtmlNormalize(html).toLowerCase().includes(q)),
  );
}

// Сортирует строки по заданной колонке и направлению
function applySort(
  rows: ParsedRow[],
  sortColumn: number | null,
  sortDirection: 'asc' | 'desc' | 'none',
): ParsedRow[] {
  if (sortColumn === null || sortDirection === 'none') return rows;

  return [...rows].sort((a, b) => {
    const av = stripHtmlNormalize(a.cells[sortColumn] ?? '');
    const bv = stripHtmlNormalize(b.cells[sortColumn] ?? '');
    const c = av.localeCompare(bv, 'ru');
    return sortDirection === 'asc' ? c : -c;
  });
}