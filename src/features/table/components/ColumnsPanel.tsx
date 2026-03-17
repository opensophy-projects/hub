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
  const bg      = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(15,15,20,0.015)';
  const border  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,15,20,0.07)';
  const labelClr = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(15,15,20,0.35)';
  const tagBg    = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,15,20,0.05)';
  const tagBdr   = isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(15,15,20,0.1)';
  const tagClr   = isDark ? 'rgba(255,255,255,0.5)'  : 'rgba(15,15,20,0.5)';
  const actBg    = isDark ? 'rgba(255,255,255,0.11)' : 'rgba(15,15,20,0.08)';
  const actBdr   = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(15,15,20,0.18)';
  const actClr   = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(15,15,20,0.85)';

  return (
    <div style={{
      background: bg,
      borderBottom: `1px solid ${border}`,
      padding: '10px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: labelClr, flexShrink: 0 }}>
        Колонки
      </span>
      {headers.map((header, i) => {
        const vis = visibleColumns.has(i);
        return (
          <button
            key={header}
            onClick={() => onToggleColumn(i)}
            style={{
              padding: '3px 9px',
              borderRadius: 6,
              border: `1px solid ${vis ? actBdr : tagBdr}`,
              background: vis ? actBg : tagBg,
              color: vis ? actClr : tagClr,
              fontSize: 12,
              cursor: 'pointer',
              fontWeight: vis ? 500 : 400,
              transition: 'all 0.13s',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            {/* Dot indicator */}
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: vis
                ? (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(15,15,20,0.6)')
                : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(15,15,20,0.2)'),
              flexShrink: 0,
              transition: 'background 0.13s',
            }} />
            {header}
          </button>
        );
      })}
    </div>
  );
};