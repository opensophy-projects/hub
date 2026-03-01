import React, { useMemo, useRef, useEffect } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import type { ParsedRow } from '../types/table';
import { SortIcon } from './SortIcons';

// Type alias — fixes S4323 "Replace this union type with a type alias"
export type ColumnAlignment = 'left' | 'center' | 'right' | null;

type SortDirection = 'asc' | 'desc' | 'none';

interface TableViewProps {
  isDark: boolean;
  headers: string[];
  rows: ParsedRow[];
  visibleColumns: Set<number>;
  searchQuery: string;
  sortColumn: number | null;
  sortDirection: SortDirection;
  onSort: (colIndex: number) => void;
  headerAlignments?: ColumnAlignment[];
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
  headerAlignments = [],
}) => {
  const styles = useMemo(() => getTableStyles(isDark), [isDark]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drag-scroll functionality
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isDown = false;
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let scrollTop = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isDown = true;
      container.style.cursor = 'grabbing';
      container.style.userSelect = 'none';
      startX = e.pageX - container.offsetLeft;
      startY = e.pageY - container.offsetTop;
      scrollLeft = container.scrollLeft;
      scrollTop = container.scrollTop;
    };

    const handleMouseLeave = () => {
      isDown = false;
      container.style.cursor = 'grab';
      container.style.userSelect = 'auto';
    };

    const handleMouseUp = () => {
      isDown = false;
      container.style.cursor = 'grab';
      container.style.userSelect = 'auto';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const y = e.pageY - container.offsetTop;
      const walkX = (x - startX) * 1.5;
      const walkY = (y - startY) * 1.5;
      container.scrollLeft = scrollLeft - walkX;
      container.scrollTop = scrollTop - walkY;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Горизонтальная прокрутка через Shift + колесо или через deltaX
      if (e.shiftKey || Math.abs(e.deltaX) > 0) {
        container.scrollLeft += e.deltaX || e.deltaY;
      } else {
        // Вертикальная прокрутка
        container.scrollTop += e.deltaY;
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('wheel', handleWheel, { passive: false });

    container.style.cursor = 'grab';

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      style={{ 
        overflowX: 'auto', 
        overflowY: 'auto', 
        height: '100%', 
        minHeight: '200px',
        position: 'relative'
      }}
    >
      <table className="border-collapse text-sm table-with-sticky-first-col" style={{ width: 'auto', minWidth: '100%' }}>
        <TableHead
          isDark={isDark}
          headers={headers}
          visibleColumns={visibleColumns}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={onSort}
          headerAlignments={headerAlignments}
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
  sortDirection: SortDirection;
  onSort: (colIndex: number) => void;
  headerAlignments: ColumnAlignment[];
}

function getJustifyContent(alignment: ColumnAlignment): string {
  if (alignment === 'center') return 'center';
  if (alignment === 'right') return 'flex-end';
  return 'flex-start';
}

const TableHead: React.FC<TableHeadProps> = ({
  isDark,
  headers,
  visibleColumns,
  sortColumn,
  sortDirection,
  onSort,
  headerAlignments,
}) => {
  const visibleHeaderIndices = Array.from(visibleColumns).sort((a, b) => a - b);
  
  return (
    <thead className="sticky top-0 z-20">
      <tr className={`${isDark ? 'border-white/10' : 'border-black/10'} border-b`}>
        {headers.map((header, colIndex) =>
          visibleColumns.has(colIndex) ? (
            <th
              key={header}
              className={`px-4 py-3 text-left font-semibold cursor-pointer transition-colors select-none ${
                isDark ? 'text-white hover:bg-white/20' : 'text-black hover:bg-[#ddd8cd]'
              } ${visibleHeaderIndices[0] === colIndex ? 'sticky-first-col-header' : ''}`}
              onClick={() => onSort(colIndex)}
              style={{
                backgroundColor: isDark ? '#1a1a1a' : '#E8E7E3',
                whiteSpace: 'nowrap',
                textAlign: headerAlignments[colIndex] || 'left',
              }}
              title="Нажмите для сортировки"
            >
              <div
                className="flex items-center gap-2 whitespace-nowrap"
                style={{ justifyContent: getJustifyContent(headerAlignments[colIndex]) }}
              >
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
    return isEvenRow ? '' : 'bg-white/3';
  }
  return isEvenRow ? 'bg-[#E8E7E3]' : 'bg-[#f1f0ec]';
};

interface TextPart {
  text: string;
  isMatch: boolean;
}

const splitTextByQuery = (text: string, lowerQuery: string): TextPart[] => {
  const lowerText = text.toLowerCase();
  const queryLen = lowerQuery.length;
  const parts: TextPart[] = [];
  let currentIndex = 0;
  let searchIndex = lowerText.indexOf(lowerQuery);

  while (searchIndex !== -1) {
    if (searchIndex > currentIndex) {
      parts.push({ text: text.substring(currentIndex, searchIndex), isMatch: false });
    }
    parts.push({ text: text.substring(searchIndex, searchIndex + queryLen), isMatch: true });
    currentIndex = searchIndex + queryLen;
    searchIndex = lowerText.indexOf(lowerQuery, currentIndex);
  }

  if (currentIndex < text.length) {
    parts.push({ text: text.substring(currentIndex), isMatch: false });
  }

  return parts;
};

const buildHighlightFragment = (parts: TextPart[]): DocumentFragment => {
  const fragment = document.createDocumentFragment();

  for (const { text, isMatch } of parts) {
    if (!text) continue;
    if (isMatch) {
      const mark = document.createElement('mark');
      mark.textContent = text;
      mark.style.cssText =
        'background-color: rgb(59, 130, 246); color: white; padding: 2px 4px; border-radius: 2px; font-weight: 600;';
      fragment.appendChild(mark);
    } else {
      fragment.appendChild(document.createTextNode(text));
    }
  }

  return fragment;
};

const highlightTextNode = (node: Node, lowerQuery: string): void => {
  const text = node.textContent || '';
  if (!text.toLowerCase().includes(lowerQuery)) return;

  const parts = splitTextByQuery(text, lowerQuery);
  const fragment = buildHighlightFragment(parts);
  node.parentNode?.replaceChild(fragment, node);
};

const highlightInElement = (element: HTMLElement, query: string): void => {
  const lowerQuery = query.toLowerCase();

  const walk = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      highlightTextNode(node, lowerQuery);
      return;
    }
    if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'MARK') {
      Array.from(node.childNodes).forEach(walk);
    }
  };

  Array.from(element.childNodes).forEach(walk);
};

const ALLOWED_TAGS = [
  'strong', 'b', 'em', 'i', 'code', 'a', 'br',
  'u', 'del', 's', 'strike', 'sub', 'sup', 'mark',
  'span', 'div', 'p',
];

const ALLOWED_ATTR = ['href', 'target', 'rel', 'class', 'style'];

const CellContent: React.FC<{ html: string; searchQuery: string }> = ({ html, searchQuery }) => {
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!contentRef.current) return;

    const sanitizedHtml = DOMPurify.sanitize(html, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      ALLOW_DATA_ATTR: false,
    });

    const parser = new DOMParser();
    const doc = parser.parseFromString(sanitizedHtml, 'text/html');

    contentRef.current.innerHTML = '';
    while (doc.body.firstChild) {
      contentRef.current.appendChild(doc.body.firstChild);
    }

    if (searchQuery && contentRef.current) {
      highlightInElement(contentRef.current, searchQuery);
    }
  }, [html, searchQuery]);

  return <div ref={contentRef} />;
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
  const visibleColumnIndices = Array.from(visibleColumns).sort((a, b) => a - b);

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
            className={`px-4 py-3 ${isDark ? 'text-white/90' : 'text-black'} ${
              visibleColumnIndices[0] === colIndex ? 'sticky-first-col' : ''
            }`}
            style={{
              whiteSpace: 'nowrap',
              textAlign: row.alignments[colIndex] || 'left',
            }}
          >
            <CellContent html={cell} searchQuery={searchQuery} />
          </td>
        ) : null
      )}
    </tr>
  );
};

// Exported so ModalTableContent can import and reuse — fixes Duplicate Code issue
export function getTableStyles(isDark: boolean): string {
  const border = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)';
  const color = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgb(0, 0, 0)';
  const codeBg = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const codeBorder = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
  const strongColor = isDark ? 'rgba(255, 255, 255, 1)' : 'rgb(0, 0, 0)';
  const thBg = isDark ? '#1a1a1a' : '#E8E7E3';
  const markBg = isDark ? 'rgb(202, 138, 4)' : 'rgb(253, 224, 71)';
  const markColor = isDark ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)';
  const evenRowBg = isDark ? 'rgba(255, 255, 255, 0.03)' : '#f1f0ec';
  const oddRowBg = isDark ? 'transparent' : '#E8E7E3';
  const firstColBg = isDark ? '#1a1a1a' : '#E8E7E3';

  return `
    table { border-collapse: collapse; width: auto; min-width: 100%; }
    th, td {
      border: 1px solid ${border};
      padding: 0.75rem 1rem;
      color: ${color};
      white-space: nowrap;
    }
    th {
      font-weight: 600;
      position: sticky;
      top: 0;
      z-index: 10;
      background-color: ${thBg};
    }
    
    /* Sticky first column styles */
    .sticky-first-col-header {
      position: sticky;
      left: 0;
      z-index: 30 !important;
      background-color: ${thBg} !important;
    }
    
    .sticky-first-col {
      position: sticky;
      left: 0;
      z-index: 5;
      background-color: ${firstColBg};
    }
    
    /* Добавляем зебра-полосы в темной теме для неполноэкранных таблиц */
    ${isDark ? `
    .table-with-sticky-first-col tbody tr:nth-child(even) .sticky-first-col {
      background-color: ${evenRowBg};
    }
    .table-with-sticky-first-col tbody tr:nth-child(odd) .sticky-first-col {
      background-color: ${oddRowBg};
    }
    ` : ''}
    
    td code {
      background-color: ${codeBg};
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.85em;
      font-family: ui-monospace, monospace;
      white-space: pre-wrap;
      word-break: break-word;
      border: 1px solid ${codeBorder};
    }
    td strong, td b { font-weight: 700; color: ${strongColor}; }
    td em, td i { font-style: italic; }
    td u { text-decoration: underline; text-underline-offset: 2px; }
    td del, td s, td strike { text-decoration: line-through; opacity: 0.7; }
    td sub { vertical-align: sub; font-size: 0.75em; }
    td sup { vertical-align: super; font-size: 0.75em; }
    td mark {
      background-color: ${markBg};
      color: ${markColor};
      padding: 2px 4px;
      border-radius: 2px;
    }
    td a { color: rgb(59 130 246); text-decoration: underline; word-break: break-word; }
    td a:hover { color: rgb(37 99 235); }
    tbody tr:nth-child(even) { background-color: ${evenRowBg}; }
    tbody tr:nth-child(odd) { background-color: ${oddRowBg}; }
  `;
}
