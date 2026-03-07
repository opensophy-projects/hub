import React, { useMemo, useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import type { ParsedRow } from '../types/table';
import { SortIcon } from './SortIcons';
import { useDragScroll } from '../hooks/useDragScroll';
import { getTableStyles } from './tableStyles';

export { getTableStyles } from './tableStyles';

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
  const styles          = useMemo(() => getTableStyles(isDark), [isDark]);
  const scrollbarStyles = useMemo(() => getScrollbarStyles(isDark), [isDark]);
  const { scrollRef, dragStyle, dragHandlers } = useDragScroll();

  return (
    <>
      <div
        ref={scrollRef}
        className="table-scroll-container"
        style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '480px', position: 'relative', ...dragStyle }}
        {...dragHandlers}
      >
        <table className="border-collapse text-sm" style={{ width: 'auto', minWidth: '100%' }}>
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
      </div>

      <style>{styles}</style>
      <style>{scrollbarStyles}</style>
    </>
  );
};

// ─── TableHead ────────────────────────────────────────────────────────────────

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
  if (alignment === 'right')  return 'flex-end';
  return 'flex-start';
}

const TableHead: React.FC<TableHeadProps> = ({
  isDark, headers, visibleColumns, sortColumn, sortDirection, onSort, headerAlignments,
}) => (
  <thead style={{ position: 'sticky', top: 0, zIndex: 20 }}>
    <tr className={`${isDark ? 'border-white/10' : 'border-black/10'} border-b`}>
      {headers.map((header, colIndex) =>
        visibleColumns.has(colIndex) ? (
          <th
            key={header}
            className={`px-4 py-3 text-left font-semibold cursor-pointer transition-colors select-none ${
              isDark ? 'text-white hover:bg-white/20' : 'text-black hover:bg-[#ddd8cd]'
            }`}
            onClick={() => onSort(colIndex)}
            style={{
              backgroundColor: isDark ? '#1a1a1a' : '#E8E7E3',
              whiteSpace: 'nowrap',
              textAlign: headerAlignments[colIndex] || 'left',
              position: 'sticky',
              top: 0,
              zIndex: 20,
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
        ) : null,
      )}
    </tr>
  </thead>
);

// ─── TableRow / CellContent ───────────────────────────────────────────────────

interface TableRowProps {
  isDark: boolean;
  row: ParsedRow;
  rowIndex: number;
  visibleColumns: Set<number>;
  searchQuery: string;
}

const getRowBgColor = (isEvenRow: boolean, isDark: boolean): string => {
  if (isDark) return isEvenRow ? '#1e1e1e' : '#141414';
  return isEvenRow ? '#E8E7E3' : '#f1f0ec';
};

const getRowHoverBgColor = (isEvenRow: boolean, isDark: boolean): string => {
  if (isDark) return isEvenRow ? '#2a2a2a' : '#202020';
  return '#ddd8cd';
};

interface TextPart { text: string; isMatch: boolean; }

const splitTextByQuery = (text: string, lowerQuery: string): TextPart[] => {
  const lowerText  = text.toLowerCase();
  const queryLen   = lowerQuery.length;
  const parts: TextPart[] = [];
  let currentIndex = 0;
  let searchIndex  = lowerText.indexOf(lowerQuery);

  while (searchIndex !== -1) {
    if (searchIndex > currentIndex) {
      parts.push({ text: text.substring(currentIndex, searchIndex), isMatch: false });
    }
    parts.push({ text: text.substring(searchIndex, searchIndex + queryLen), isMatch: true });
    currentIndex = searchIndex + queryLen;
    searchIndex  = lowerText.indexOf(lowerQuery, currentIndex);
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
  node.parentNode?.replaceChild(buildHighlightFragment(splitTextByQuery(text, lowerQuery)), node);
};

const highlightInElement = (element: HTMLElement, query: string): void => {
  const lowerQuery = query.toLowerCase();

  const walk = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) { highlightTextNode(node, lowerQuery); return; }
    if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'MARK') {
      Array.from(node.childNodes).forEach(walk);
    }
  };

  Array.from(element.childNodes).forEach(walk);
};

const CELL_ALLOWED_TAGS = [
  'strong', 'b', 'em', 'i', 'code', 'a', 'br',
  'u', 'del', 's', 'strike', 'sub', 'sup', 'mark',
  'span', 'div', 'p',
];
const CELL_ALLOWED_ATTR = ['href', 'target', 'rel', 'class', 'style'];

const CellContent: React.FC<{ html: string; searchQuery: string }> = ({ html, searchQuery }) => {
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!contentRef.current) return;

    const sanitizedHtml = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: CELL_ALLOWED_TAGS,
      ALLOWED_ATTR: CELL_ALLOWED_ATTR,
      ALLOW_DATA_ATTR: false,
    });

    const doc = new DOMParser().parseFromString(sanitizedHtml, 'text/html');
    contentRef.current.innerHTML = '';
    while (doc.body.firstChild) contentRef.current.appendChild(doc.body.firstChild);

    if (searchQuery) highlightInElement(contentRef.current, searchQuery);
  }, [html, searchQuery]);

  return <div ref={contentRef} />;
};

const TableRow: React.FC<TableRowProps> = ({ isDark, row, rowIndex, visibleColumns, searchQuery }) => {
  const isEvenRow   = rowIndex % 2 === 0;
  const [isHovered, setIsHovered] = useState(false);
  const bgColor     = isHovered
    ? getRowHoverBgColor(isEvenRow, isDark)
    : getRowBgColor(isEvenRow, isDark);

  return (
    <tr
      className={`border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}
      style={{ backgroundColor: bgColor, transition: 'background-color 0.12s ease' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {row.cells.map((cell, colIndex) =>
        visibleColumns.has(colIndex) ? (
          <td
            key={`cell-${rowIndex}-${colIndex}`}
            className={`px-4 py-3 ${isDark ? 'text-white/90' : 'text-black'}`}
            style={{
              whiteSpace: 'nowrap',
              textAlign: row.alignments[colIndex] || 'left',
              backgroundColor: bgColor,
              transition: 'background-color 0.12s ease',
            }}
          >
            <CellContent html={cell} searchQuery={searchQuery} />
          </td>
        ) : null,
      )}
    </tr>
  );
};

// ─── Scrollbar styles (internal only) ────────────────────────────────────────

function getScrollbarStyles(isDark: boolean): string {
  const thumb      = isDark ? 'rgba(150, 150, 150, 0.6)'  : 'rgba(0, 0, 0, 0.2)';
  const thumbHover = isDark ? 'rgba(190, 190, 190, 0.85)' : 'rgba(0, 0, 0, 0.35)';
  const track      = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';

  return `
    .table-scroll-container::-webkit-scrollbar       { width: 8px; height: 8px; }
    .table-scroll-container::-webkit-scrollbar-track  { background: ${track}; border-radius: 4px; }
    .table-scroll-container::-webkit-scrollbar-thumb  { background: ${thumb}; border-radius: 4px; }
    .table-scroll-container::-webkit-scrollbar-thumb:hover { background: ${thumbHover}; }
    .table-scroll-container::-webkit-scrollbar-corner { background: transparent; }
    .table-scroll-container {
      scrollbar-color: ${thumb} ${track};
      scrollbar-width: thin;
    }
  `;
}