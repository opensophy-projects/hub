import React from 'react';

interface FiltersPanelProps {
  isDark: boolean;
  headers: string[];
  filters: Map<number, Set<string>>;
  onToggleFilter: (colIndex: number, value: string) => void;
  getUniqueValuesForColumn: (colIndex: number) => string[];
}

export const FiltersPanel: React.FC<FiltersPanelProps> = ({
  isDark, headers, filters, onToggleFilter, getUniqueValuesForColumn,
}) => {
  const bg     = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,15,20,0.02)';
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,15,20,0.07)';

  return (
    <div style={{
      background: bg,
      borderBottom: `1px solid ${border}`,
      padding: '12px 14px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: 20,
    }}>
      {headers.map((header, colIndex) => {
        const values    = getUniqueValuesForColumn(colIndex);
        const activeSet = filters.get(colIndex) || new Set<string>();
        if (!values.length) return null;

        return (
          <FilterColumn
            key={header}
            header={header}
            colIndex={colIndex}
            isDark={isDark}
            values={values}
            activeFilters={activeSet}
            onToggleFilter={onToggleFilter}
          />
        );
      })}
    </div>
  );
};

const FilterColumn: React.FC<{
  header: string; colIndex: number; isDark: boolean;
  values: string[]; activeFilters: Set<string>;
  onToggleFilter: (colIndex: number, value: string) => void;
}> = ({ header, colIndex, isDark, values, activeFilters, onToggleFilter }) => {
  const labelClr = isDark ? 'rgba(255,255,255,0.3)'  : 'rgba(15,15,20,0.35)';
  const tagBg    = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,15,20,0.05)';
  const tagBdr   = isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(15,15,20,0.1)';
  const tagClr   = isDark ? 'rgba(255,255,255,0.65)' : 'rgba(15,15,20,0.65)';
  const actBg    = isDark ? 'rgba(255,255,255,0.13)' : 'rgba(15,15,20,0.1)';
  const actBdr   = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(15,15,20,0.2)';
  const actClr   = isDark ? '#ffffff'                : '#0f0f14';

  return (
    <div>
      <div style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.06em', color: labelClr, marginBottom: 7,
      }}>
        {header}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {values.map(val => {
          const active = activeFilters.has(val);
          return (
            <button
              key={val}
              onClick={() => onToggleFilter(colIndex, val)}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                border: `1px solid ${active ? actBdr : tagBdr}`,
                background: active ? actBg : tagBg,
                color: active ? actClr : tagClr,
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: active ? 600 : 400,
                transition: 'all 0.13s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.background = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(15,15,20,0.08)';
              }}
              onMouseLeave={e => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.background = tagBg;
              }}
            >
              {val}
            </button>
          );
        })}
      </div>
    </div>
  );
};