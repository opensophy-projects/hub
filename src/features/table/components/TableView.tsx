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
  fullscreen?: boolean;
}

// ─── Design tokens ────────────────────────────────────────────────────────────

function tokens(isDark: boolean) {
  return {
    // Table surface
    thBg:         isDark ? '#161618'                   : '#f5f4f0',
    thColor:      isDark ? 'rgba(255,255,255,0.45)'    : 'rgba(15,15,20,0.45)',
    thBorder:     isDark ? 'rgba(255,255,255,0.07)'    : 'rgba(15,15,20,0.07)',
    // Left accent on header
    accentLine:   isDark ? 'rgba(255,255,255,0.15)'    : 'rgba(15,15,20,0.12)',
    // Rows
    rowEven:      isDark ? '#0e0e10'                   : '#ffffff',
    rowOdd:       isDark ? '#111113'                   : '#f9f9f7',
    rowHover:     isDark ? '#1a1a1d'                   : '#f1f0eb',
    // Cell border
    cellBorder:   isDark ? 'rgba(255,255,255,0.05)'    : 'rgba(15,15,20,0.06)',
    // Scrollbar
    thumb:        isDark ? 'rgba(255,255,255,0.15)'    : 'rgba(15,15,20,0.15)',
    thumbHov:     isDark ? 'rgba(255,255,255,0.28)'    : 'rgba(15,15,20,0.28)',
    track:        isDark ? 'rgba(255,255,255,0.04)'    : 'rgba(15,15,20,0.04)',
  };
}

// ─── TableView ────────────────────────────────────────────────────────────────

export const TableView: React.FC<TableViewProps> = ({
  isDark, headers, rows, visibleColumns, searchQuery,
  sortColumn, sortDirection, onSort, headerAlignments = [], fullscreen = false,
}) => {
  const tk = useMemo(() => tokens(isDark), [isDark]);
  const { scrollRef, dragStyle, dragHandlers } = useDragScroll();

  return (
    <>
      {/* Scroll wrapper with fade edges on mobile */}
      <div style={{ position: 'relative' }}>
        <div
          ref={scrollRef}
          className="tb-scroll"
          style={{
            overflowX: 'auto',
            overflowY: 'auto',
            maxHeight:  fullscreen ? undefined : 480,
            height:     fullscreen ? '100%'    : undefined,
            position: 'relative',
            ...dragStyle,
          }}
          {...dragHandlers}
        >
          <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: 'auto', minWidth: '100%' }}>
            <TableHead
              isDark={isDark} tk={tk}
              headers={headers} visibleColumns={visibleColumns}
              sortColumn={sortColumn} sortDirection={sortDirection}
              onSort={onSort} headerAlignments={headerAlignments}
            />
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={headers.filter((_, i) => visibleColumns.has(i)).length}
                    style={{
                      textAlign: 'center', padding: '2.5rem 1rem',
                      color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(15,15,20,0.3)',
                      fontSize: 13, fontStyle: 'italic',
                      background: tk.rowEven,
                    }}
                  >
                    Нет результатов
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <TableRow
                    key={`r${idx}-${row.cells.slice(0,2).join('')}`}
                    isDark={isDark} tk={tk}
                    row={row} rowIndex={idx}
                    visibleColumns={visibleColumns} searchQuery={searchQuery}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Right fade mask — hint for horizontal scroll */}
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: 32,
          background: `linear-gradient(to right, transparent, ${isDark ? '#0e0e10' : '#ffffff'})`,
          pointerEvents: 'none',
          opacity: 0.7,
        }} />
      </div>

      <style>{getTableStyles(isDark)}</style>
      <style>{`
        .tb-scroll { scrollbar-width: thin; scrollbar-color: ${tk.thumb} ${tk.track}; }
        .tb-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .tb-scroll::-webkit-scrollbar-track { background: ${tk.track}; }
        .tb-scroll::-webkit-scrollbar-thumb { background: ${tk.thumb}; border-radius: 99px; }
        .tb-scroll::-webkit-scrollbar-thumb:hover { background: ${tk.thumbHov}; }
        .tb-scroll::-webkit-scrollbar-corner { background: transparent; }
      `}</style>
    </>
  );
};

// ─── TableHead ────────────────────────────────────────────────────────────────

interface Tk { thBg: string; thColor: string; thBorder: string; accentLine: string; [k: string]: string; }

const TableHead: React.FC<{
  isDark: boolean; tk: Tk;
  headers: string[]; visibleColumns: Set<number>;
  sortColumn: number | null; sortDirection: SortDirection;
  onSort: (i: number) => void; headerAlignments: ColumnAlignment[];
}> = ({ isDark, tk, headers, visibleColumns, sortColumn, sortDirection, onSort, headerAlignments }) => (
  <thead style={{ position: 'sticky', top: 0, zIndex: 20 }}>
    <tr>
      {headers.map((header, i) =>
        visibleColumns.has(i) ? (
          <th
            key={header}
            onClick={() => onSort(i)}
            style={{
              padding: '0.7rem 1rem',
              textAlign: headerAlignments[i] || 'left',
              background: tk.thBg,
              color: sortColumn === i ? (isDark ? 'rgba(255,255,255,0.85)' : 'rgba(15,15,20,0.85)') : tk.thColor,
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              userSelect: 'none',
              position: 'sticky',
              top: 0,
              zIndex: 20,
              // Bottom border only
              borderBottom: `1px solid ${tk.thBorder}`,
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              // Subtle left accent on active sort
              boxShadow: sortColumn === i
                ? `inset 3px 0 0 ${isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,15,20,0.35)'}`
                : 'none',
              transition: 'color 0.15s, box-shadow 0.15s',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              justifyContent: headerAlignments[i] === 'center' ? 'center'
                : headerAlignments[i] === 'right'  ? 'flex-end' : 'flex-start',
            }}>
              <span>{header}</span>
              <SortIcon direction={sortColumn === i ? sortDirection : 'none'} isDark={isDark} />
            </div>
          </th>
        ) : null
      )}
    </tr>
  </thead>
);

// ─── TableRow / CellContent ───────────────────────────────────────────────────

interface TkFull {
  rowEven: string; rowOdd: string; rowHover: string;
  cellBorder: string; [k: string]: string;
}

const ALLOWED_TAGS = ['strong','b','em','i','code','a','br','u','del','s','strike','sub','sup','mark','span','div','p'];
const ALLOWED_ATTR = ['href','target','rel','class','style'];

// Search highlight
interface TextPart { text: string; isMatch: boolean; }

const splitByQuery = (text: string, q: string): TextPart[] => {
  const low = text.toLowerCase(), parts: TextPart[] = [];
  let cur = 0, idx = low.indexOf(q);
  while (idx !== -1) {
    if (idx > cur) parts.push({ text: text.slice(cur, idx), isMatch: false });
    parts.push({ text: text.slice(idx, idx + q.length), isMatch: true });
    cur = idx + q.length;
    idx = low.indexOf(q, cur);
  }
  if (cur < text.length) parts.push({ text: text.slice(cur), isMatch: false });
  return parts;
};

const highlightNode = (node: Node, q: string): void => {
  const text = node.textContent || '';
  if (!text.toLowerCase().includes(q)) return;
  const frag = document.createDocumentFragment();
  for (const { text: t, isMatch } of splitByQuery(text, q)) {
    if (!t) continue;
    if (isMatch) {
      const mark = document.createElement('mark');
      mark.textContent = t;
      mark.style.cssText = 'background:#3b82f6;color:#fff;padding:1px 3px;border-radius:3px;font-weight:600;';
      frag.appendChild(mark);
    } else {
      frag.appendChild(document.createTextNode(t));
    }
  }
  node.parentNode?.replaceChild(frag, node);
};

const highlightIn = (el: HTMLElement, q: string): void => {
  const walk = (n: Node) => {
    if (n.nodeType === Node.TEXT_NODE) { highlightNode(n, q); return; }
    if (n.nodeType === Node.ELEMENT_NODE && n.nodeName !== 'MARK')
      Array.from(n.childNodes).forEach(walk);
  };
  Array.from(el.childNodes).forEach(walk);
};

const CellContent: React.FC<{ html: string; searchQuery: string }> = ({ html, searchQuery }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!ref.current) return;
    const safe = DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR, ALLOW_DATA_ATTR: false });
    const doc  = new DOMParser().parseFromString(safe, 'text/html');
    ref.current.innerHTML = '';
    while (doc.body.firstChild) ref.current.appendChild(doc.body.firstChild);
    if (searchQuery) highlightIn(ref.current, searchQuery.toLowerCase());
  }, [html, searchQuery]);
  return <div ref={ref} />;
};

const TableRow: React.FC<{
  isDark: boolean; tk: TkFull;
  row: ParsedRow; rowIndex: number;
  visibleColumns: Set<number>; searchQuery: string;
}> = ({ isDark, tk, row, rowIndex, visibleColumns, searchQuery }) => {
  const [hov, setHov] = useState(false);
  const isEven = rowIndex % 2 === 0;
  const bg = hov ? tk.rowHover : isEven ? tk.rowEven : tk.rowOdd;

  return (
    <tr
      style={{ background: bg, transition: 'background 0.12s ease' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {row.cells.map((cell, i) =>
        visibleColumns.has(i) ? (
          <td
            key={i}
            style={{
              padding: '0.65rem 1rem',
              textAlign: row.alignments[i] || 'left',
              borderBottom: `1px solid ${tk.cellBorder}`,
              borderTop: 'none', borderLeft: 'none', borderRight: 'none',
              whiteSpace: 'nowrap',
              color: isDark ? 'rgba(255,255,255,0.82)' : 'rgba(15,15,20,0.88)',
              fontSize: 13.5,
              background: bg,
              transition: 'background 0.12s ease',
            }}
          >
            <CellContent html={cell} searchQuery={searchQuery} />
          </td>
        ) : null
      )}
    </tr>
  );
};