export interface ParsedTable {
  headers: Array<{ text: string; colIndex: number }>;
  rows: Array<Record<string, string>>;
}

export function parseTableFromHTML(html: string): ParsedTable {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const table = doc.querySelector('table');

  if (!table) {
    return { headers: [], rows: [] };
  }

  const headers = Array.from(table.querySelectorAll('thead th')).map((th, colIndex) => ({
    text: th.textContent?.trim() || '',
    colIndex,
  }));

  const rows = Array.from(table.querySelectorAll('tbody tr')).map((tr) => {
    const record: Record<string, string> = {};
    Array.from(tr.querySelectorAll('td')).forEach((td, index) => {
      const header = headers[index];
      if (header) {
        // ИСПРАВЛЕНО: используем innerHTML вместо textContent для сохранения форматирования
        record[header.text] = td.innerHTML?.trim() || '';
      }
    });
    return record;
  });

  return { headers, rows };
}

export function getUniqueValuesForColumn(rows: Array<Record<string, string>>, columnName: string): string[] {
  const values = rows.map((row) => {
    // ИСПРАВЛЕНО: убираем HTML теги для получения текстового значения при фильтрации
    const html = row[columnName] || '';
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }).filter(Boolean);
  return Array.from(new Set(values)).sort();
}

export function filterRows(
  rows: Array<Record<string, string>>,
  searchQuery: string,
  activeFilters: Map<string, Set<string>>,
  visibleColumns: Set<string>,
): Array<Record<string, string>> {
  return rows.filter((row) => {
    // ИСПРАВЛЕНО: для поиска убираем HTML теги
    const matchesSearch =
      searchQuery === '' ||
      Array.from(visibleColumns).some((col) => {
        const html = row[col] || '';
        const div = document.createElement('div');
        div.innerHTML = html;
        const text = div.textContent || div.innerText || '';
        return text.toLowerCase().includes(searchQuery.toLowerCase());
      });

    const matchesFilters = Array.from(activeFilters.entries()).every(([col, values]) => {
      if (values.size === 0) return true;
      // ИСПРАВЛЕНО: для фильтров также убираем HTML теги
      const html = row[col] || '';
      const div = document.createElement('div');
      div.innerHTML = html;
      const text = div.textContent || div.innerText || '';
      return values.has(text);
    });

    return matchesSearch && matchesFilters;
  });
}
