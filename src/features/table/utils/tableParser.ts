import type { ParsedTable } from '../types/table';

function getAlignment(element: Element): 'left' | 'center' | 'right' | null {
  // Проверяем атрибут align
  const alignAttr = element.getAttribute('align');
  if (alignAttr === 'left' || alignAttr === 'center' || alignAttr === 'right') {
    return alignAttr;
  }

  // Проверяем style text-align
  const style = element.getAttribute('style');
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
}

export function parseTableHtml(tableHtml: string): ParsedTable {
  const parser = new DOMParser();
  const doc = parser.parseFromString(tableHtml, 'text/html');
  const table = doc.querySelector('table');

  if (!table) {
    return { headers: [], rows: [], headerAlignments: [] };
  }

  const headerElements = Array.from(table.querySelectorAll('thead th'));
  // ИСПРАВЛЕНО: используем innerHTML вместо textContent для сохранения форматирования
  const headers = headerElements.map((th) => th.innerHTML || '');
  const headerAlignments = headerElements.map(getAlignment);
  
  const rows = Array.from(table.querySelectorAll('tbody tr'));

  return { headers, rows, headerAlignments };
}
