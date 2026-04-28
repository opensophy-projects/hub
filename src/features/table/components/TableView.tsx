import React, { useMemo, useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import type { ParsedRow } from '../types/table';
import { SortIcon } from './SortIcons';
import { useDragScroll } from '../hooks/useDragScroll';
import { getTableStyles } from './tableStyles';
import { makeTokens } from '@/shared/tokens/theme';

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

type Tok = {
  thBg: string; thColor: string; thBorder: string; thActColor: string;
  rowEven: string; rowOdd: string; rowHover: string; cellBorder: string; cellColor: string;
  fadeTo: string; thumb: string; thumbHov: string; track: string;
};

function tok(isDark: boolean): Tok {
  const t = makeTokens(isDark);
  return isDark ? {
    thBg: t.surface, thColor: 'rgba(255,255,255,0.35)', thBorder: 'rgba(255,255,255,0.07)', thActColor: 'rgba(255,255,255,0.82)',
    rowEven: t.bg, rowOdd: t.surface, rowHover: t.surfaceHov, cellBorder: 'rgba(255,255,255,0.05)', cellColor: 'rgba(255,255,255,0.82)',
    fadeTo: t.bg, thumb: t.thumb, thumbHov: t.thumbHov, track: t.track,
  } : {
    thBg: t.surface, thColor: 'rgba(0,0,0,0.38)', thBorder: 'rgba(0,0,0,0.08)', thActColor: 'rgba(0,0,0,0.85)',
    rowEven: t.bg, rowOdd: t.surface, rowHover: '#cccbc6', cellBorder: 'rgba(0,0,0,0.06)', cellColor: 'rgba(0,0,0,0.85)',
    fadeTo: t.bg, thumb: t.thumb, thumbHov: t.thumbHov, track: t.track,
  };
}

// Переводит выравнивание колонки в justify-content для flex-контейнера заголовка
function alignToJustify(align: ColumnAlignment): string {
  if (align === 'center') return 'center';
  if (align === 'right')  return 'flex-end';
  return 'flex-start';
}

// Определяет фоновый цвет строки по состоянию hover и чётности
function rowBg(t: Tok, hov: boolean, even: boolean): string {
  if (hov)  return t.rowHover;
  if (even) return t.rowEven;
  return t.rowOdd;
}

export const TableView: React.FC<TableViewProps> = ({
  isDark, headers, rows, visibleColumns, searchQuery,
  sortColumn, sortDirection, onSort, headerAlignments = [], fullscreen = false,
}) => {
  const t = useMemo(() => tok(isDark), [isDark]);
  const { scrollRef, dragStyle, dragHandlers } = useDragScroll();

  return (
    <>
      <style>{getTableStyles(isDark)}</style>
      <style>{`
        .tb-scroll {
          overflow-x: auto;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: ${t.thumb} ${t.track};
          width: 100%;
          display: block;
          touch-action: pan-x pan-y;
        }
        .tb-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .tb-scroll::-webkit-scrollbar-track { background: ${t.track}; }
        .tb-scroll::-webkit-scrollbar-thumb { background: ${t.thumb}; border-radius: 99px; }
        .tb-scroll::-webkit-scrollbar-thumb:hover { background: ${t.thumbHov}; }
        .tb-scroll::-webkit-scrollbar-corner { background: transparent; }

        .tb-scroll-wrap { position: relative; width: 100%; min-width: 0; }
        .tb-scroll-wrap::after {
          content: '';
          position: absolute;
          top: 0; right: 0; bottom: 0;
          width: 20px;
          background: linear-gradient(to right, transparent, ${t.fadeTo});
          pointer-events: none;
          opacity: 0.8;
          z-index: 1;
        }
        .tb-scroll-wrap::before {
          content: '';
          position: absolute;
          top: 0; left: 0; bottom: 0;
          width: 20px;
          background: linear-gradient(to left, transparent, ${t.fadeTo});
          pointer-events: none;
          opacity: 0.8;
          z-index: 1;
        }
      `}</style>

      <div
        className="tb-scroll-wrap"
        style={{
          flex:          fullscreen ? 1         : undefined,
          display:       fullscreen ? 'flex'    : undefined,
          flexDirection: fullscreen ? 'column'  : undefined,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <div
          ref={scrollRef}
          className="tb-scroll"
          style={{
            maxHeight: fullscreen ? undefined : 480,
            height:    fullscreen ? '100%'    : undefined,
            flex:      fullscreen ? 1         : undefined,
            ...dragStyle,
          }}
          {...dragHandlers}
        >
          <table style={{
            borderCollapse: 'separate',
            borderSpacing: 0,
            width: '100%',
            minWidth: 'max-content',
            tableLayout: 'auto',
          }}>
            <TableHead
              t={t} isDark={isDark}
              headers={headers}
              visibleColumns={visibleColumns}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={onSort}
              headerAlignments={headerAlignments}
            />
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={headers.filter((_, i) => visibleColumns.has(i)).length}
                    style={{ textAlign: 'center', padding: '2.5rem 1rem', color: t.thColor, fontSize: 13, fontStyle: 'italic', background: t.rowEven }}
                  >
                    Нет результатов
                  </td>
                </tr>
              ) : rows.map((row, idx) => (
                <TableRow
                  key={`r${idx}-${row.cells[0]?.slice(0, 20)}`}
                  t={t} row={row} rowIndex={idx}
                  headers={headers}
                  visibleColumns={visibleColumns}
                  searchQuery={searchQuery}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

// ─── TableHead ────────────────────────────────────────────────────────────────

const TableHead: React.FC<{
  t: Tok; isDark: boolean;
  headers: string[]; visibleColumns: Set<number>;
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
          cursor: 'pointer', userSelect: 'none',
          position: 'sticky', top: 0, zIndex: 20,
          borderBottom: `1px solid ${t.thBorder}`,
          borderTop: 'none', borderLeft: 'none', borderRight: 'none',
          boxShadow: 'none',
          whiteSpace: 'nowrap',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            justifyContent: alignToJustify(headerAlignments[i] ?? null),
          }}>
            <span>{header}</span>
            <SortIcon direction={sortColumn === i ? sortDirection : 'none'} isDark={isDark} />
          </div>
        </th>
      ) : null)}
    </tr>
  </thead>
);

// ─── Search highlight ─────────────────────────────────────────────────────────

const splitByQ = (text: string, q: string) => {
  const low = text.toLowerCase();
  const parts: { text: string; match: boolean }[] = [];
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
    if (match) {
      const m = document.createElement('mark');
      m.textContent = t;
      m.style.cssText = 'background:#f59e0b;color:#000;padding:1px 3px;border-radius:3px;font-weight:600;';
      frag.appendChild(m);
    } else {
      frag.appendChild(document.createTextNode(t));
    }
  }
  node.parentNode?.replaceChild(frag, node);
};

const highlightIn = (el: HTMLElement, q: string) => {
  const walk = (n: Node) => {
    if (n.nodeType === Node.TEXT_NODE) { highlightNode(n, q); return; }
    if (n.nodeType === Node.ELEMENT_NODE && n.nodeName !== 'MARK')
      Array.from(n.childNodes).forEach(walk);
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

// ─── TableRow ─────────────────────────────────────────────────────────────────

const TableRow: React.FC<{
  t: Tok; row: ParsedRow; rowIndex: number;
  headers: string[];
  visibleColumns: Set<number>; searchQuery: string;
}> = ({ t, row, rowIndex, headers, visibleColumns, searchQuery }) => {
  const [hov, setHov] = useState(false);
  const even = rowIndex % 2 === 0;
  const bg   = rowBg(t, hov, even);

  return (
    <tr
      style={{ background: bg }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {row.cells.map((cell, i) => visibleColumns.has(i) ? (
        <td key={headers[i] ?? i} style={{
          padding: '0.65rem 1rem',
          textAlign: row.alignments[i] || 'left',
          borderBottom: `1px solid ${t.cellBorder}`,
          borderTop: 'none', borderLeft: 'none', borderRight: 'none',
          color: t.cellColor, fontSize: 13.5,
          background: bg,
        }}>
          <CellContent html={cell} searchQuery={searchQuery} />
        </td>
      ) : null)}
    </tr>
  );
};
