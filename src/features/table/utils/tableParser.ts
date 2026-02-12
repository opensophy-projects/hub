import type { ParsedTable } from '../types/table';

export function parseTableHtml(tableHtml: string): ParsedTable {
  const parser = new DOMParser();
  const doc = parser.parseFromString(tableHtml, 'text/html');
  const table = doc.querySelector('table');

  if (!table) {
    return { headers: [], rows: [] };
  }

  const headers = Array.from(table.querySelectorAll('thead th')).map(
    (th) => th.textContent || ''
  );
  
  const rows = Array.from(table.querySelectorAll('tbody tr'));

  return { headers, rows };
}