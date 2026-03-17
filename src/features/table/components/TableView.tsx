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

// ─── Design tokens — exact app palette ───────────────────────────────────────

function tok(isDark: boolean) {
  return {
    // Exact app bg colors
    surface:    isDark ? '#0a0a0a' : '#E8E7E3',
    // Header — slightly lifted
    thBg:       isDark ? '#111113' : '#dddcd8',
    thColor:    isDark ? 'rgba(255,255,255,0.38)' : 'rgba(15,15,20,0.4)',
    thBorder:   isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,15,20,0.08)',
    // Row alternation on top of surface
    rowEven:    isDark ? '#0a0a0a' : '#E8E7E3',
    rowOdd:     isDark ? '#0f0f11' : '#e0dfda',
    rowHover:   isDark ? '#161618' : '#d7d6d1',
    // Cell border
    cellBorder: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,15,20,0.07)',
    // Text
    cellColor:  isDark ? 'rgba(255,255,255,0.82)' : 'rgba(15,15,20,0.87)',
    // Scrollbar
    thumb:      isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,15,20,0.16)',
    thumbHov:   isDark ? 'rgba(255,255,255,0.26)' : 'rgba(15,15,20,0.28)',
    track:      isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,15,20,0.04)',
    // Fade mask color
    fadeTo:     isDark ? '#0a0a0a' : '#E8E7E3',
  };
}

// ─── TableView ────────────────────────────────────────────────────────────────

export const TableView: React.FC<TableViewProps> = ({
  isDark, headers, rows, visibleColumns, searchQuery,
  sortColumn, sortDirection, onSort, headerAlignments = [], fullscreen = false,
}) => {
  const t = useMemo(() => tok(isDark), [isDark]);
  const { scrollRef, dragStyle, dragHandlers } = useDragScroll();

  return (
    <>
      <div style={{ position: 'relative' }}>
        <div
          ref={scrollRef}
          className="tb-scroll"
          style={{
            overflowX: 'auto', overflowY: 'auto',
            maxHeight: fullscreen ? undefined : 480,
            height:    fullscreen ? '100%'    : undefined,
            ...dragStyle,
          }}
          {...dragHandlers}
        >
          <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: 'auto', minWidth: '100%' }}>
            <TableHead
              t={t} isDark={isDark}
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
                      color: t.thColor, fontSize: 13, fontStyle: 'italic',
                      background: t.rowEven,
                    }}
                  >
                    Нет результатов
                  </td>
                </tr>
              ) : rows.map((row, idx) => (
                <TableRow
                  key={`r${idx}-${row.cells.slice(0,2).join('').slice(0,40)}`}
                  t={t} isDark={isDark}
                  row={row} rowIndex={idx}
                  visibleColumns={visibleColumns} searchQuery={searchQuery}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Right fade — scroll hint */}
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: 28, pointerEvents: 'none',
          background: `linear-gradient(to right, transparent, ${t.fadeTo})`,
          opacity: 0.75,
        }} />
      </div>

      <style>{getTableStyles(isDark)}</style>
      <style>{`
        .tb-scroll { scrollbar-width: thin; scrollbar-color: ${t.thumb} ${t.track}; }
        .tb-scroll::-webkit-scrollbar       { width: 6px; height: 6px; }
        .tb-scroll::-webkit-scrollbar-track { background: ${t.track}; }
        .tb-scroll::-webkit-scrollbar-thumb { background: ${t.thumb}; border-radius: 99px; }
        .tb-scroll::-webkit-scrollbar-thumb:hover { background: ${t.thumbHov}; }
        .tb-scroll::-webkit-scrollbar-corner { background: transparent; }
      `}</style>
    </>
  );
};

// ─── TableHead ────────────────────────────────────────────────────────────────

type Tok = ReturnType<typeof tok>;

const TableHead: React.FC<{
  t: Tok; isDark: boolean;
  headers: string[]; visibleColumns: Set<number>;
  sortColumn: number | null; sortDirection: SortDirection;
  onSort: (i: number) => void; headerAlignments: ColumnAlignment[];
}> = ({ t, isDark, headers, visibleColumns, sortColumn, sortDirection, onSort, headerAlignments }) => (
  <thead style={{ position: 'sticky', top: 0, zIndex: 20 }}>
    <tr>
      {headers.map((header, i) =>
        visibleColumns.has(i) ? (
          <th key={header} onClick={() => onSort(i)} style={{
            padding: '0.65rem 1rem',
            textAlign: headerAlignments[i] || 'left',
            background: t.thBg,
            color: sortColumn === i
              ? (isDark ? 'rgba(255,255,255,0.82)' : 'rgba(15,15,20,0.85)')
              : t.thColor,
            fontSize: '0.69rem', fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none',
            position: 'sticky', top: 0, zIndex: 20,
            borderBottom: `1px solid ${t.thBorder}`,
            borderTop: 'none', borderLeft: 'none', borderRight: 'none',
            boxShadow: sortColumn === i
              ? `inset 3px 0 0 ${isDark ? 'rgba(255,255,255,0.35)' : 'rgba(15,15,20,0.3)'}`
              : 'none',
            transition: 'color 0.14s, box-shadow 0.14s',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              justifyContent: headerAlignments[i] === 'center' ? 'center'
                : headerAlignments[i] === 'right' ? 'flex-end' : 'flex-start',
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

const ALLOWED_TAGS = ['strong','b','em','i','code','a','br','u','del','s','strike','sub','sup','mark','span','div','p'];
const ALLOWED_ATTR = ['href','target','rel','class','style'];

interface TextPart { text: string; isMatch: boolean; }

const splitByQuery = (text: string, q: string): TextPart[] => {
  const low = text.toLowerCase(); const parts: TextPart[] = [];
  let cur = 0, idx = low.indexOf(q);
  while (idx !== -1) {
    if (idx > cur) parts.push({ text: text.slice(cur, idx), isMatch: false });
    parts.push({ text: text.slice(idx, idx + q.length), isMatch: true });
    cur = idx + q.length; idx = low.indexOf(q, cur);
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
    } else { frag.appendChild(document.createTextNode(t)); }
  }
  node.parentNode?.replaceChild(frag, node);
};

const highlightIn = (el: HTMLElement, q: string): void => {
  const walk = (n: Node) => {
    if (n.nodeType === Node.TEXT_NODE) { highlightNode(n, q); return; }
    if (n.nodeType === Node.ELEMENT_NODE && n.nodeName !== 'MARK') Array.from(n.childNodes).forEach(walk);
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
  t: Tok; isDark: boolean;
  row: ParsedRow; rowIndex: number;
  visibleColumns: Set<number>; searchQuery: string;
}> = ({ t, isDark, row, rowIndex, visibleColumns, searchQuery }) => {
  const [hov, setHov] = useState(false);
  const isEven = rowIndex % 2 === 0;
  const bg = hov ? t.rowHover : isEven ? t.rowEven : t.rowOdd;

  return (
    <tr
      style={{ background: bg, transition: 'background 0.1s ease' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {row.cells.map((cell, i) =>
        visibleColumns.has(i) ? (
          <td key={i} style={{
            padding: '0.65rem 1rem',
            textAlign: row.alignments[i] || 'left',
            borderBottom: `1px solid ${t.cellBorder}`,
            borderTop: 'none', borderLeft: 'none', borderRight: 'none',
            whiteSpace: 'nowrap',
            color: t.cellColor, fontSize: 13.5,
            background: bg, transition: 'background 0.1s ease',
          }}>
            <CellContent html={cell} searchQuery={searchQuery} />
          </td>
        ) : null
      )}
    </tr>
  );
};