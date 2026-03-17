import React, { useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { useDragScroll } from '../hooks/useDragScroll';

interface ModalTableContentProps {
  isDark: boolean;
  headers: Array<{ text: string; colIndex: number }>;
  filteredRows: Array<Record<string, string>>;
  visibleColumns: Set<string>;
}

function tokens(isDark: boolean) {
  return {
    thBg:       isDark ? '#161618'                : '#f5f4f0',
    thColor:    isDark ? 'rgba(255,255,255,0.4)'  : 'rgba(15,15,20,0.4)',
    thBorder:   isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,15,20,0.07)',
    rowEven:    isDark ? '#0e0e10'                : '#ffffff',
    rowOdd:     isDark ? '#111113'                : '#f9f9f7',
    rowHover:   isDark ? '#1a1a1d'                : '#f1f0eb',
    cellBorder: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,15,20,0.06)',
    cellColor:  isDark ? 'rgba(255,255,255,0.82)' : 'rgba(15,15,20,0.88)',
    thumb:      isDark ? 'rgba(255,255,255,0.15)' : 'rgba(15,15,20,0.15)',
    thumbHov:   isDark ? 'rgba(255,255,255,0.28)' : 'rgba(15,15,20,0.28)',
    track:      isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,15,20,0.04)',
  };
}

const ALLOWED_TAGS = ['strong','b','em','i','code','a','br','u','del','s','strike','sub','sup','mark','span','div','p'];
const ALLOWED_ATTR = ['href','target','rel','class','style'];

const CellContent: React.FC<{ html: string; isDark: boolean; bg: string }> = ({ html, bg }) => {
  const ref = React.useRef<HTMLTableCellElement>(null);
  React.useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR, ALLOW_DATA_ATTR: false });
  }, [html]);
  return (
    <td
      ref={ref}
      style={{ padding: '0.65rem 1rem', fontSize: 13.5, background: bg, transition: 'background 0.12s ease' }}
    />
  );
};

const ModalRow: React.FC<{
  row: Record<string, string>;
  idx: number;
  visibleHeaders: Array<{ text: string; colIndex: number }>;
  isDark: boolean;
  tk: ReturnType<typeof tokens>;
}> = ({ row, idx, visibleHeaders, isDark, tk }) => {
  const [hov, setHov] = useState(false);
  const bg = hov ? tk.rowHover : idx % 2 === 0 ? tk.rowEven : tk.rowOdd;

  return (
    <tr
      style={{ background: bg, transition: 'background 0.12s ease' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {visibleHeaders.map(h => (
        <CellContent key={h.colIndex} html={row[h.text] || '—'} isDark={isDark} bg={bg} />
      ))}
    </tr>
  );
};

export const ModalTableContent: React.FC<ModalTableContentProps> = ({
  isDark, headers, filteredRows, visibleColumns,
}) => {
  const visibleHeaders = headers.filter(h => visibleColumns.has(h.text));
  const { scrollRef, dragStyle, dragHandlers } = useDragScroll();
  const tk = tokens(isDark);

  return (
    <div
      ref={scrollRef}
      className="modal-tb-scroll"
      style={{
        overflowX: 'auto', overflowY: 'auto', flex: 1,
        scrollbarWidth: 'thin', scrollbarColor: `${tk.thumb} ${tk.track}`,
        ...dragStyle,
      }}
      {...dragHandlers}
    >
      <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: 'auto', minWidth: '100%' }}>
        <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
          <tr>
            {visibleHeaders.map(h => (
              <th
                key={h.colIndex}
                style={{
                  padding: '0.7rem 1rem',
                  background: tk.thBg,
                  color: tk.thColor,
                  fontSize: '0.7rem', fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  whiteSpace: 'nowrap', textAlign: 'left',
                  borderBottom: `1px solid ${tk.thBorder}`,
                  borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                  position: 'sticky', top: 0, zIndex: 10,
                }}
              >
                {h.text}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredRows.length === 0 ? (
            <tr>
              <td
                colSpan={visibleHeaders.length}
                style={{
                  textAlign: 'center', padding: '3rem',
                  color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(15,15,20,0.3)',
                  fontSize: 13, fontStyle: 'italic', background: tk.rowEven,
                }}
              >
                Нет результатов
              </td>
            </tr>
          ) : (
            filteredRows.map((row, i) => (
              <ModalRow key={i} row={row} idx={i} visibleHeaders={visibleHeaders} isDark={isDark} tk={tk} />
            ))
          )}
        </tbody>
      </table>

      <style>{`
        .modal-tb-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .modal-tb-scroll::-webkit-scrollbar-track { background: ${tk.track}; }
        .modal-tb-scroll::-webkit-scrollbar-thumb { background: ${tk.thumb}; border-radius: 99px; }
        .modal-tb-scroll::-webkit-scrollbar-thumb:hover { background: ${tk.thumbHov}; }
        .modal-tb-scroll::-webkit-scrollbar-corner { background: transparent; }
      `}</style>
    </div>
  );
};