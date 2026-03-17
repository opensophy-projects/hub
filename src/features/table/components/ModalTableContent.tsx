import React, { useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { useDragScroll } from '../hooks/useDragScroll';

interface ModalTableContentProps {
  isDark: boolean;
  headers: Array<{ text: string; colIndex: number }>;
  filteredRows: Array<Record<string, string>>;
  visibleColumns: Set<string>;
}

function tok(isDark: boolean) {
  return isDark ? {
    thBg:       '#111111',   // pure neutral
    thColor:    'rgba(255,255,255,0.35)',
    thBorder:   'rgba(255,255,255,0.07)',
    rowEven:    '#0a0a0a',   // exact app color
    rowOdd:     '#111111',   // exact zebra
    rowHover:   '#1a1a1a',
    cellBorder: 'rgba(255,255,255,0.05)',
    cellColor:  'rgba(255,255,255,0.82)',
    thumb:      'rgba(255,255,255,0.14)',
    thumbHov:   'rgba(255,255,255,0.26)',
    track:      'rgba(255,255,255,0.04)',
  } : {
    thBg:       '#d8d7d3',
    thColor:    'rgba(0,0,0,0.38)',
    thBorder:   'rgba(0,0,0,0.08)',
    rowEven:    '#E8E7E3',   // exact app color
    rowOdd:     '#d8d7d3',   // exact zebra
    rowHover:   '#cccbc6',
    cellBorder: 'rgba(0,0,0,0.06)',
    cellColor:  'rgba(0,0,0,0.85)',
    thumb:      'rgba(0,0,0,0.16)',
    thumbHov:   'rgba(0,0,0,0.28)',
    track:      'rgba(0,0,0,0.04)',
  };
}

const TAGS = ['strong','b','em','i','code','a','br','u','del','s','strike','sub','sup','mark','span','div','p'];
const ATTR = ['href','target','rel','class','style'];

const CellContent: React.FC<{ html: string }> = ({ html }) => {
  const ref = React.useRef<HTMLTableCellElement>(null);
  React.useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = DOMPurify.sanitize(html, { ALLOWED_TAGS: TAGS, ALLOWED_ATTR: ATTR, ALLOW_DATA_ATTR: false });
  }, [html]);
  return <td ref={ref} style={{ padding: '0.65rem 1rem', fontSize: 13.5, whiteSpace: 'nowrap' }} />;
};

const ModalRow: React.FC<{
  row: Record<string, string>; idx: number;
  visibleHeaders: Array<{ text: string; colIndex: number }>;
  t: ReturnType<typeof tok>;
}> = ({ row, idx, visibleHeaders, t }) => {
  const [hov, setHov] = useState(false);
  const bg = hov ? t.rowHover : idx % 2 === 0 ? t.rowEven : t.rowOdd;
  return (
    <tr style={{ background: bg, transition: 'background 0.1s ease', color: t.cellColor }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
    >
      {visibleHeaders.map(h => <CellContent key={h.colIndex} html={row[h.text] || '—'} />)}
    </tr>
  );
};

export const ModalTableContent: React.FC<ModalTableContentProps> = ({ isDark, headers, filteredRows, visibleColumns }) => {
  const visible = headers.filter(h => visibleColumns.has(h.text));
  const { scrollRef, dragStyle, dragHandlers } = useDragScroll();
  const t = tok(isDark);

  return (
    <div ref={scrollRef} className="modal-tb-scroll"
      style={{ overflowX: 'auto', overflowY: 'auto', flex: 1, scrollbarWidth: 'thin', scrollbarColor: `${t.thumb} ${t.track}`, ...dragStyle }}
      {...dragHandlers}
    >
      <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: 'auto', minWidth: '100%', color: t.cellColor }}>
        <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
          <tr>
            {visible.map(h => (
              <th key={h.colIndex} style={{
                padding: '0.65rem 1rem', background: t.thBg, color: t.thColor,
                fontSize: '0.69rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                whiteSpace: 'nowrap', textAlign: 'left',
                borderBottom: `1px solid ${t.thBorder}`,
                borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                position: 'sticky', top: 0, zIndex: 10,
              }}>
                {h.text}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredRows.length === 0 ? (
            <tr>
              <td colSpan={visible.length} style={{ textAlign: 'center', padding: '2.5rem', color: t.thColor, fontSize: 13, fontStyle: 'italic', background: t.rowEven }}>
                Нет результатов
              </td>
            </tr>
          ) : filteredRows.map((row, i) => (
            <ModalRow key={i} row={row} idx={i} visibleHeaders={visible} t={t} />
          ))}
        </tbody>
      </table>
      <style>{`
        .modal-tb-scroll::-webkit-scrollbar{width:6px;height:6px}
        .modal-tb-scroll::-webkit-scrollbar-track{background:${t.track}}
        .modal-tb-scroll::-webkit-scrollbar-thumb{background:${t.thumb};border-radius:99px}
        .modal-tb-scroll::-webkit-scrollbar-thumb:hover{background:${t.thumbHov}}
        .modal-tb-scroll::-webkit-scrollbar-corner{background:transparent}
      `}</style>
    </div>
  );
};