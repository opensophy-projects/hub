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

function tok(isDark: boolean) {
  return isDark ? {
    thBg:       '#111111',
    thColor:    'rgba(255,255,255,0.35)',
    thBorder:   'rgba(255,255,255,0.07)',
    thActColor: 'rgba(255,255,255,0.82)',
    rowEven:    '#0a0a0a',
    rowOdd:     '#111111',
    rowHover:   '#1a1a1a',
    cellBorder: 'rgba(255,255,255,0.05)',
    cellColor:  'rgba(255,255,255,0.82)',
    fadeTo:     '#0a0a0a',
    thumb:      'rgba(255,255,255,0.14)',
    thumbHov:   'rgba(255,255,255,0.26)',
    track:      'rgba(255,255,255,0.04)',
  } : {
    thBg:       '#d8d7d3',
    thColor:    'rgba(0,0,0,0.38)',
    thBorder:   'rgba(0,0,0,0.08)',
    thActColor: 'rgba(0,0,0,0.85)',
    rowEven:    '#E8E7E3',
    rowOdd:     '#d8d7d3',
    rowHover:   '#cccbc6',
    cellBorder: 'rgba(0,0,0,0.06)',
    cellColor:  'rgba(0,0,0,0.85)',
    fadeTo:     '#E8E7E3',
    thumb:      'rgba(0,0,0,0.16)',
    thumbHov:   'rgba(0,0,0,0.28)',
    track:      'rgba(0,0,0,0.04)',
  };
}

type Tok = ReturnType<typeof tok>;

export const TableView: React.FC<TableViewProps> = ({
  isDark, headers, rows, visibleColumns, searchQuery,
  sortColumn, sortDirection, onSort, headerAlignments = [], fullscreen = false,
}) => {
  const t = useMemo(() => tok(isDark), [isDark]);
  const { scrollRef, dragStyle, dragHandlers } = useDragScroll();

  return (
    <>
      {/* Wrapper with both left and right fade masks */}
      <div style={{ position: 'relative' }}>
        <div ref={scrollRef} className="tb-scroll"
          style={{
            overflowX: 'auto',
            overflowY: 'auto',
            maxHeight: fullscreen ? undefined : 480,
            height:    fullscreen ? '100%'    : undefined,
            // Crucial for mobile: don't constrain width
            width: '100%',
            ...dragStyle,
          }}
          {...dragHandlers}
        >
          <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: 'auto', minWidth: '100%' }}>
            <TableHead t={t} isDark={isDark} headers={headers} visibleColumns={visibleColumns}
              sortColumn={sortColumn} sortDirection={sortDirection}
              onSort={onSort} headerAlignments={headerAlignments}
            />
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={headers.filter((_, i) => visibleColumns.has(i)).length}
                    style={{ textAlign: 'center', padding: '2.5rem 1rem', color: t.thColor, fontSize: 13, fontStyle: 'italic', background: t.rowEven }}>
                    Нет результатов
                  </td>
                </tr>
              ) : rows.map((row, idx) => (
                <TableRow key={`r${idx}-${row.cells[0]?.slice(0, 20)}`}
                  t={t} row={row} rowIndex={idx} visibleColumns={visibleColumns} searchQuery={searchQuery} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Left fade — scroll hint */}
        <div className="tb-fade-left" style={{
          position: 'absolute', top: 0, left: 0, bottom: 0, width: 20,
          background: `linear-gradient(to left, transparent, ${t.fadeTo})`,
          pointerEvents: 'none', opacity: 0.8,
          // Only show when scrolled — JS adds class, but CSS default visible is fine as hint
        }} />
        {/* Right fade — scroll hint */}
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: 20,
          background: `linear-gradient(to right, transparent, ${t.fadeTo})`,
          pointerEvents: 'none', opacity: 0.8,
        }} />
      </div>

      <style>{getTableStyles(isDark)}</style>
      <style>{`
        .tb-scroll{scrollbar-width:thin;scrollbar-color:${t.thumb} ${t.track};-webkit-overflow-scrolling:touch}
        .tb-scroll::-webkit-scrollbar{width:6px;height:6px}
        .tb-scroll::-webkit-scrollbar-track{background:${t.track}}
        .tb-scroll::-webkit-scrollbar-thumb{background:${t.thumb};border-radius:99px}
        .tb-scroll::-webkit-scrollbar-thumb:hover{background:${t.thumbHov}}
        .tb-scroll::-webkit-scrollbar-corner{background:transparent}
      `}</style>
    </>
  );
};

const TableHead: React.FC<{
  t: Tok; isDark: boolean; headers: string[]; visibleColumns: Set<number>;
  sortColumn: number | null; sortDirection: SortDirection;
  onSort: (i: number) => void; headerAlignments: ColumnAlignment[];
}> = ({ t, isDark, headers, visibleColumns, sortColumn, sortDirection, onSort, headerAlignments }) => (
  <thead style={{ position: 'sticky', top: 0, zIndex: 20 }}>
    <tr>
      {headers.map((header, i) => visibleColumns.has(i) ? (
        <th key={header} onClick={() => onSort(i)} style={{
          padding: '0.65rem 1rem',
          textAlign: headerAlignments[i] || 'left',
          background: t.thBg,
          color: sortColumn === i ? t.thActColor : t.thColor,
          fontSize: '0.69rem', fontWeight: 700,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none',
          position: 'sticky', top: 0, zIndex: 20,
          borderBottom: `1px solid ${t.thBorder}`,
          borderTop: 'none', borderLeft: 'none', borderRight: 'none',
          boxShadow: 'none',
          transition: 'color 0.14s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: headerAlignments[i] === 'center' ? 'center' : headerAlignments[i] === 'right' ? 'flex-end' : 'flex-start' }}>
            <span>{header}</span>
            <SortIcon direction={sortColumn === i ? sortDirection : 'none'} isDark={isDark} />
          </div>
        </th>
      ) : null)}
    </tr>
  </thead>
);

const splitByQ = (text: string, q: string) => {
  const low = text.toLowerCase(); const parts: { text: string; match: boolean }[] = [];
  let cur = 0, idx = low.indexOf(q);
  while (idx !== -1) {
    if (idx > cur) parts.push({ text: text.slice(cur, idx), match: false });
    parts.push({ text: text.slice(idx, idx + q.length), match: true });
    cur = idx + q.length; idx = low.indexOf(q, cur);
  }
  if (cur < text.length) parts.push({ text: text.slice(cur), match: false });
  return parts;
};

const highlightNode = (node: Node, q: string) => {
  const text = node.textContent || '';
  if (!text.toLowerCase().includes(q)) return;
  const frag = document.createDocumentFragment();
  for (const { text: t, match } of splitByQ(text, q)) {
    if (!t) continue;
    if (match) { const m = document.createElement('mark'); m.textContent = t; m.style.cssText = 'background:#f59e0b;color:#000;padding:1px 3px;border-radius:3px;font-weight:600;'; frag.appendChild(m); }
    else frag.appendChild(document.createTextNode(t));
  }
  node.parentNode?.replaceChild(frag, node);
};

const highlightIn = (el: HTMLElement, q: string) => {
  const walk = (n: Node) => {
    if (n.nodeType === Node.TEXT_NODE) { highlightNode(n, q); return; }
    if (n.nodeType === Node.ELEMENT_NODE && n.nodeName !== 'MARK') Array.from(n.childNodes).forEach(walk);
  };
  Array.from(el.childNodes).forEach(walk);
};

const TAGS = ['strong','b','em','i','code','a','br','u','del','s','strike','sub','sup','mark','span','div','p'];
const ATTR = ['href','target','rel','class','style'];

const CellContent: React.FC<{ html: string; searchQuery: string }> = ({ html, searchQuery }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!ref.current) return;
    const safe = DOMPurify.sanitize(html, { ALLOWED_TAGS: TAGS, ALLOWED_ATTR: ATTR, ALLOW_DATA_ATTR: false });
    const doc  = new DOMParser().parseFromString(safe, 'text/html');
    ref.current.innerHTML = '';
    while (doc.body.firstChild) ref.current.appendChild(doc.body.firstChild);
    if (searchQuery) highlightIn(ref.current, searchQuery.toLowerCase());
  }, [html, searchQuery]);
  return <div ref={ref} />;
};

const TableRow: React.FC<{
  t: Tok; row: ParsedRow; rowIndex: number;
  visibleColumns: Set<number>; searchQuery: string;
}> = ({ t, row, rowIndex, visibleColumns, searchQuery }) => {
  const [hov, setHov] = useState(false);
  const even = rowIndex % 2 === 0;
  const bg   = hov ? t.rowHover : even ? t.rowEven : t.rowOdd;

  return (
    <tr style={{ background: bg, transition: 'background 0.1s ease' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
    >
      {row.cells.map((cell, i) => visibleColumns.has(i) ? (
        <td key={i} style={{
          padding: '0.65rem 1rem',
          textAlign: row.alignments[i] || 'left',
          borderBottom: `1px solid ${t.cellBorder}`,
          borderTop: 'none', borderLeft: 'none', borderRight: 'none',
          whiteSpace: 'nowrap', color: t.cellColor, fontSize: 13.5,
          background: bg, transition: 'background 0.1s ease',
        }}>
          <CellContent html={cell} searchQuery={searchQuery} />
        </td>
      ) : null)}
    </tr>
  );
};