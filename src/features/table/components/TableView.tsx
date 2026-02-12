import React, { useMemo } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import type { ParsedRow } from '../types/table';
import { SortIcon } from './SortIcons';

interface TableViewProps {
  isDark: boolean;
  headers: string[];
  rows: ParsedRow[];
  visibleColumns: Set<number>;
  searchQuery: string;
  sortColumn: number | null;
  sortDirection: 'asc' | 'desc' | 'none';
  onSort: (colIndex: number) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  isDark,
  headers,
  rows,
  visibleColumns,
  searchQuery,
  sortColumn,
  sortDirection,
  onSort,
}) => {
  const styles = useMemo(() => getTableStyles(isDark), [isDark]);

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', height: '100%', minHeight: '200px' }}>
      <table className="border-collapse text-sm" style={{ width: 'auto', minWidth: '100%' }}>
        <TableHead
          isDark={isDark}
          headers={headers}
          visibleColumns={visibleColumns}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={onSort}
        />
        <tbody>
          {rows.map((row, rowIndex) => (
            <TableRow
              key={`row-${rowIndex}-${row.cells.join('-')}`}
              isDark={isDark}
              row={row}
              rowIndex={rowIndex}
              visibleColumns={visibleColumns}
              searchQuery={searchQuery}
            />
          ))}
        </tbody>
      </table>

      {rows.length === 0 && (
        <div className={`p-6 text-center ${isDark ? 'text-white/50' : 'text-black/50'}`}>
          Нет результатов
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
};

interface TableHeadProps {
  isDark: boolean;
  headers: string[];
  visibleColumns: Set<number>;
  sortColumn: number | null;
  sortDirection: 'asc' | 'desc' | 'none';
  onSort: (colIndex: number) => void;
}

const TableHead: React.FC<TableHeadProps> = ({
  isDark,
  headers,
  visibleColumns,
  sortColumn,
  sortDirection,
  onSort,
}) => {
  return (
    <thead className="sticky top-0 z-20">
      <tr className={`${isDark ? 'border-white/10' : 'border-black/10'} border-b`}>
        {headers.map((header, colIndex) =>
          visibleColumns.has(colIndex) ? (
            <th
              key={header}
              className={`px-4 py-3 text-left font-semibold cursor-pointer transition-colors select-none ${
                isDark
                  ? 'text-white hover:bg-white/20'
                  : 'text-black hover:bg-[#ddd8cd]'
              }`}
              onClick={() => onSort(colIndex)}
              style={{
                backgroundColor: isDark ? '#1a1a1a' : '#E8E7E3',
                whiteSpace: 'nowrap'
              }}
              title="Нажмите для сортировки"
            >
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span>{header}</span>
                <SortIcon
                  direction={sortColumn === colIndex ? sortDirection : 'none'}
                  isDark={isDark}
                />
              </div>
            </th>
          ) : null
        )}
      </tr>
    </thead>
  );
};

interface TableRowProps {
  isDark: boolean;
  row: ParsedRow;
  rowIndex: number;
  visibleColumns: Set<number>;
  searchQuery: string;
}

const getRowBackgroundClass = (isEvenRow: boolean, isDark: boolean): string => {
  if (isDark) {
    return '';
  }
  
  if (isEvenRow) {
    return 'bg-[#E8E7E3]';
  }
  
  return 'bg-[#f1f0ec]';
};

// Компонент для рендеринга содержимого ячейки с подсветкой поиска
const CellContent: React.FC<{ html: string; searchQuery: string }> = ({ html, searchQuery }) => {
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!contentRef.current) return;

    // Санитизация входного HTML
    const sanitizedHtml = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['strong', 'em', 'code', 'a', 'br'],
      ALLOWED_ATTR: ['href', 'target', 'rel']
    });

    // Безопасная установка санитизированного HTML через DOMParser
    const parser = new DOMParser();
    const doc = parser.parseFromString(sanitizedHtml, 'text/html');

    // Очищаем контейнер
    contentRef.current.innerHTML = '';

    // Переносим содержимое в контейнер
    while (doc.body.firstChild) {
      contentRef.current.appendChild(doc.body.firstChild);
    }

    // Применяем подсветку поиска, если есть запрос
    if (searchQuery && contentRef.current) {
      highlightInElement(contentRef.current, searchQuery);
    }
  }, [html, searchQuery]);

  return <div ref={contentRef} />;
};

// Функция для подсветки текста в элементе
const highlightInElement = (element: HTMLElement, query: string) => {
  const lowerQuery = query.toLowerCase();

  const highlightTextNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      const lowerText = text.toLowerCase();

      if (lowerText.includes(lowerQuery)) {
        const parts: string[] = [];
        let currentIndex = 0;
        let searchIndex = lowerText.indexOf(lowerQuery);

        while (searchIndex !== -1) {
          if (searchIndex > currentIndex) {
            parts.push(text.substring(currentIndex, searchIndex));
            parts.push('');
          }

          parts.push(text.substring(searchIndex, searchIndex + query.length));
          parts.push('match');

          currentIndex = searchIndex + query.length;
          searchIndex = lowerText.indexOf(lowerQuery, currentIndex);
        }

        if (currentIndex < text.length) {
          parts.push(text.substring(currentIndex));
          parts.push('');
        }

        const fragment = document.createDocumentFragment();

        for (let i = 0; i < parts.length; i += 2) {
          const part = parts[i];
          const marker = parts[i + 1];

          if (part) {
            if (marker === 'match') {
              const mark = document.createElement('mark');
              mark.textContent = part;
              mark.style.cssText = 'background-color: rgb(59, 130, 246); color: white; padding: 2px 4px; border-radius: 2px; font-weight: 600;';
              fragment.appendChild(mark);
            } else {
              fragment.appendChild(document.createTextNode(part));
            }
          }
        }

        node.parentNode?.replaceChild(fragment, node);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'MARK') {
      Array.from(node.childNodes).forEach(highlightTextNode);
    }
  };

  Array.from(element.childNodes).forEach(highlightTextNode);
};

const TableRow: React.FC<TableRowProps> = ({
  isDark,
  row,
  rowIndex,
  visibleColumns,
  searchQuery,
}) => {
  const isEvenRow = rowIndex % 2 === 0;
  const backgroundClass = getRowBackgroundClass(isEvenRow, isDark);

  return (
    <tr
      className={`border-b transition-colors ${
        isDark
          ? 'border-white/10 hover:bg-white/5'
          : 'border-black/10 hover:bg-[#ddd8cd]'
      } ${backgroundClass}`}
    >
      {row.cells.map((cell, colIndex) =>
        visibleColumns.has(colIndex) ? (
          <td
            key={`cell-${rowIndex}-${colIndex}`}
            className={`px-4 py-3 ${isDark ? 'text-white/90' : 'text-black'}`}
            style={{
              whiteSpace: 'nowrap'
            }}
          >
            <CellContent html={cell} searchQuery={searchQuery} />
          </td>
        ) : null
      )}
    </tr>
  );
};

function getTableStyles(isDark: boolean): string {
  return `
    table {
      border-collapse: collapse;
      width: auto;
      min-width: 100%;
    }
    th, td {
      border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)'};
      padding: 0.75rem 1rem;
      text-align: left;
      color: ${isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgb(0, 0, 0)'};
      white-space: nowrap;
    }
    th {
      font-weight: 600;
      position: sticky;
      top: 0;
      z-index: 10;
      background-color: ${isDark ? '#1a1a1a' : '#E8E7E3'};
    }
    td code {
      background-color: ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.85em;
      font-family: ui-monospace, monospace;
      white-space: pre-wrap;
      word-break: break-word;
      border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
    }
    td strong {
      font-weight: 600;
    }
    td em {
      font-style: italic;
    }
    td a {
      color: rgb(59 130 246);
      text-decoration: underline;
    }
    td a:hover {
      color: rgb(37 99 235);
    }
    tbody tr:nth-child(even) {
      background-color: ${isDark ? 'rgba(255, 255, 255, 0.03)' : '#f1f0ec'};
    }
  `;
}