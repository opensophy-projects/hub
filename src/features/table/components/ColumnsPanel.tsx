import React from 'react';

interface ColumnsPanelProps {
  isDark: boolean;
  headers: string[];
  visibleColumns: Set<number>;
  onToggleColumn: (colIndex: number) => void;
}

export const ColumnsPanel: React.FC<ColumnsPanelProps> = ({
  isDark, headers, visibleColumns, onToggleColumn,
}) => {
  const panelBg  = isDark ? '#111113'                : '#d0cfc9';
  const border   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const labelClr = isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.35)';
  const tagBg    = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const tagBdr   = isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.1)';
  const tagClr   = isDark ? 'rgba(255,255,255,0.5)'  : 'rgba(0,0,0,0.5)';
  const actBg    = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)';
  const actBdr   = isDark ? 'rgba(255,255,255,0.24)' : 'rgba(0,0,0,0.22)';
  const actClr   = isDark ? 'rgba(255,255,255,0.9)'  : 'rgba(0,0,0,0.85)';
  const dot      = isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)';
  const dotOff   = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.2)';

  return (
    <div style={{
      background: panelBg,
      padding: '8px 14px',
      display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
    }}>
      <span style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.07em', color: labelClr, flexShrink: 0,
      }}>
        Колонки
      </span>
      {headers.map((header, i) => {
        const vis = visibleColumns.has(i);
        return (
          <button key={header} onClick={() => onToggleColumn(i)} style={{
            padding: '3px 9px', borderRadius: 6,
            border: `1px solid ${vis ? actBdr : tagBdr}`,
            background: vis ? actBg : tagBg,
            color: vis ? actClr : tagClr,
            fontSize: 12, cursor: 'pointer', fontWeight: vis ? 500 : 400,
            transition: 'all 0.12s',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
              background: vis ? dot : dotOff, transition: 'background 0.12s',
            }} />
            {header}
          </button>
        );
      })}
    </div>
  );
};