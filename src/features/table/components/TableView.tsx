import React, { useMemo, useRef, useState, useCallback } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import type { ParsedRow } from '../types/table';
import { SortIcon } from './SortIcons';

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    setIsDragging(true);
    setStartX(e.pageX - el.offsetLeft);
    setStartY(e.pageY - el.offsetTop);
    setScrollLeft(el.scrollLeft);
    setScrollTop(el.scrollTop);
    el.style.cursor = 'grabbing';
    el.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const el = scrollRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const y = e.pageY - el.offsetTop;
    const walkX = (x - startX) * 1.2;
    const walkY = (y - startY) * 1.2;
    el.scrollLeft = scrollLeft - walkX;
    el.scrollTop = scrollTop - walkY;
  }, [isDragging, startX, startY, scrollLeft, scrollTop]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    const el = scrollRef.current;
    if (!el) return;
    el.style.cursor = 'grab';
    el.style.userSelect = '';
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      const el = scrollRef.current;
      if (!el) return;
      el.style.cursor = 'grab';
      el.style.userSelect = '';
    }
  }, [isDragging]);

  return (
    <>
      <div
        ref={scrollRef}
        className="table-scroll-container"
        style={{
          overflowX: 'auto',
          overflowY: 'auto',
          height: '100%',
          minHeight: '200px',
          cursor: 'grab',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
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
      <style>{getScrollbarStyles(isDark)}</style>
    </>
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
  const visibleIndices = headers
    .map((_, i) => i)
    .filter((i) => visibleColumns.has(i));
  const firstVisibleIndex = visibleIndices[0] ?? -1;

  return (
    <thead className="sticky top-0 z-20">
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
                ...(colIndex === firstVisibleIndex
                  ? {
                      position: 'sticky',
                      left: 0,
                      zIndex: 30,
                      boxShadow: isDark
                        ? '2px 0 4px rgba(0,0,0,0.5)'
                        : '2px 0 4px rgba(0,0,0,0.1)',
                    }
                  : {}),
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
  if (isDark) return isEvenRow ? 'row-even-dark' : 'row-odd-dark';
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
  const bgClass = getRowBackgroundClass(isEvenRow, isDark);

  const visibleIndices = Array.from(visibleColumns).sort((a, b) => a - b);
  const firstVisibleIndex = visibleIndices[0] ?? -1;

  const rowBgColor = isDark
    ? isEvenRow
      ? '#1e1e1e'
      : '#161616'
    : undefined;

  return (
    <tr
      className={`border-b transition-colors ${
        isDark
          ? 'border-white/10 hover:bg-white/5'
          : `border-black/10 hover:bg-[#ddd8cd] ${bgClass}`
      }`}
      style={isDark ? { backgroundColor: rowBgColor } : undefined}
    >
      {row.cells.map((cell, colIndex) =>
        visibleColumns.has(colIndex) ? (
          <td
            key={`cell-${rowIndex}-${colIndex}`}
            className={`px-4 py-3 ${isDark ? 'text-white/90' : 'text-black'}`}
            style={{
              whiteSpace: 'nowrap',
              textAlign: row.alignments[colIndex] || 'left',
              ...(colIndex === firstVisibleIndex
                ? {
                    position: 'sticky',
                    left: 0,
                    zIndex: 10,
                    backgroundColor: isDark
                      ? isEvenRow
                        ? '#1e1e1e'
                        : '#161616'
                      : isEvenRow
                      ? '#E8E7E3'
                      : '#f1f0ec',
                    boxShadow: isDark
                      ? '2px 0 4px rgba(0,0,0,0.5)'
                      : '2px 0 4px rgba(0,0,0,0.1)',
                  }
                : {}),
            }}
          >
            <CellContent html={cell} searchQuery={searchQuery} />
          </td>
        ) : null
      )}
    </tr>
  );
};

function getScrollbarStyles(isDark: boolean): string {
  const thumbColor = isDark ? 'rgba(160,160,160,0.5)' : 'rgba(0,0,0,0.2)';
  const thumbHover = isDark ? 'rgba(160,160,160,0.8)' : 'rgba(0,0,0,0.35)';
  const trackColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  return `
    .table-scroll-container::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    .table-scroll-container::-webkit-scrollbar-track {
      background: ${trackColor};
      border-radius: 4px;
    }
    .table-scroll-container::-webkit-scrollbar-thumb {
      background: ${thumbColor};
      border-radius: 4px;
    }
    .table-scroll-container::-webkit-scrollbar-thumb:hover {
      background: ${thumbHover};
    }
    .table-scroll-container::-webkit-scrollbar-corner {
      background: transparent;
    }
  `;
}

export function getTableStyles(isDark: boolean): string {
  const border = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)';
  const color = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgb(0, 0, 0)';
  const codeBg = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const codeBorder = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
  const strongColor = isDark ? 'rgba(255, 255, 255, 1)' : 'rgb(0, 0, 0)';
  const thBg = isDark ? '#1a1a1a' : '#E8E7E3';
  const markBg = isDark ? 'rgb(202, 138, 4)' : 'rgb(253, 224, 71)';
  const markColor = isDark ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)';
  const evenRowBg = isDark ? '#1e1e1e' : '#f1f0ec';
  const oddRowBg = isDark ? '#161616' : '#E8E7E3';

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