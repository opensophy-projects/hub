export interface ParsedTable {
  headers: Array<{ text: string; colIndex: number }>;
  rows: Array<Record<string, string>>;
}

function stripHtmlNormalize(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || div.innerText || '')
    .split(/\s+/)
    .filter(Boolean)
    .join(' ');
}

export function parseTableFromHTML(html: string): ParsedTable {
  const doc   = new DOMParser().parseFromString(html, 'text/html');
  const table = doc.querySelector('table');
  if (!table) return { headers: [], rows: [] };

  const headers = Array.from(table.querySelectorAll('thead th')).map((th, colIndex) => ({
    text: th.textContent?.trim() || '',
    colIndex,
  }));

  const rows = Array.from(table.querySelectorAll('tbody tr')).map((tr) => {
    const record: Record<string, string> = {};
    Array.from(tr.querySelectorAll('td')).forEach((td, index) => {
      const header = headers[index];
      if (header) record[header.text] = td.innerHTML?.trim() || '';
    });
    return record;
  });

  return { headers, rows };
}

export function getUniqueValuesForColumn(
  rows: Array<Record<string, string>>,
  columnName: string,
): string[] {
  return Array.from(
    new Set(rows.map((row) => stripHtmlNormalize(row[columnName] || '')).filter(Boolean))
  ).sort();
}

export function filterRows(
  rows: Array<Record<string, string>>,
  searchQuery: string,
  activeFilters: Map<string, Set<string>>,
  visibleColumns: Set<string>,
): Array<Record<string, string>> {
  return rows.filter((row) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const found = Array.from(visibleColumns).some((col) =>
        stripHtmlNormalize(row[col] || '').toLowerCase().includes(q)
      );
      if (!found) return false;
    }

    for (const [col, values] of activeFilters) {
      if (values.size === 0) continue;
      const cellText = stripHtmlNormalize(row[col] || '');
      if (!values.has(cellText)) return false;
    }

    return true;
  });
}