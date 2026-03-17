import React, { useState, useMemo } from 'react';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';

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
  // Palette — exact app colors, no blue tints
  const bg      = isDark ? '#0a0a0a'                : '#E8E7E3';
  const panelBg = isDark ? '#111113'                : '#d8d7d3';
  const border  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';

  // Collect all columns that have filterable values
  const columns = useMemo(() =>
    headers.map((header, colIndex) => ({
      header, colIndex,
      values: getUniqueValuesForColumn(colIndex),
    })).filter(c => c.values.length > 0),
  [headers, getUniqueValuesForColumn]);

  const totalActive = Array.from(filters.values()).reduce((s, v) => s + v.size, 0);

  return (
    <div style={{
      background: panelBg,
      borderBottom: `1px solid ${border}`,
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)',
        }}>
          Фильтры по колонкам {totalActive > 0 && `· ${totalActive} активно`}
        </span>
      </div>

      {/* Columns as accordion panels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {columns.map(({ header, colIndex, values }) => (
          <FilterColumnAccordion
            key={colIndex}
            header={header}
            colIndex={colIndex}
            values={values}
            activeFilters={filters.get(colIndex) || new Set()}
            onToggleFilter={onToggleFilter}
            isDark={isDark}
          />
        ))}
      </div>
    </div>
  );
};

// ─── Single column filter accordion ──────────────────────────────────────────

interface FilterColumnAccordionProps {
  header: string;
  colIndex: number;
  values: string[];
  activeFilters: Set<string>;
  onToggleFilter: (colIndex: number, value: string) => void;
  isDark: boolean;
}

const FilterColumnAccordion: React.FC<FilterColumnAccordionProps> = ({
  header, colIndex, values, activeFilters, onToggleFilter, isDark,
}) => {
  const hasActive = activeFilters.size > 0;
  // Auto-open if active
  const [open, setOpen] = useState(hasActive);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() =>
    search.trim()
      ? values.filter(v => v.toLowerCase().includes(search.toLowerCase()))
      : values,
  [values, search]);

  // Colors — pure neutrals, no blue
  const rowBg       = isDark ? '#161618'                : '#cccbc7';
  const rowBdr      = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const headClr     = isDark ? 'rgba(255,255,255,0.7)'  : 'rgba(0,0,0,0.7)';
  const headActClr  = isDark ? '#ffffff'                : '#000000';
  const subClr      = isDark ? 'rgba(255,255,255,0.3)'  : 'rgba(0,0,0,0.35)';

  // Tag colors
  const tagBg       = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const tagBdr      = isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.1)';
  const tagClr      = isDark ? 'rgba(255,255,255,0.6)'  : 'rgba(0,0,0,0.6)';
  const actTagBg    = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.13)';
  const actTagBdr   = isDark ? 'rgba(255,255,255,0.3)'  : 'rgba(0,0,0,0.25)';
  const actTagClr   = isDark ? '#ffffff'                : '#000000';

  // Input
  const inpBg  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const inpBdr = isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.1)';
  const inpClr = isDark ? 'rgba(255,255,255,0.8)'  : 'rgba(0,0,0,0.8)';
  const plhClr = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)';

  return (
    <div style={{ borderRadius: 8, border: `1px solid ${rowBdr}`, overflow: 'hidden' }}>
      {/* Header row */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px',
          background: rowBg,
          border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{
          flex: 1, fontSize: 12, fontWeight: hasActive ? 700 : 500,
          color: hasActive ? headActClr : headClr,
        }}>
          {header}
        </span>

        {/* Active badges */}
        {hasActive && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 2, justifyContent: 'flex-end' }}>
            {Array.from(activeFilters).slice(0, 3).map(v => (
              <span key={v} style={{
                fontSize: 10, padding: '1px 7px', borderRadius: 4,
                background: actTagBg, border: `1px solid ${actTagBdr}`,
                color: actTagClr, fontWeight: 600,
                maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {v}
              </span>
            ))}
            {activeFilters.size > 3 && (
              <span style={{ fontSize: 10, color: subClr }}>+{activeFilters.size - 3}</span>
            )}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {hasActive && (
            <button
              onClick={e => {
                e.stopPropagation();
                Array.from(activeFilters).forEach(v => onToggleFilter(colIndex, v));
              }}
              title="Сбросить фильтр колонки"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '1px 3px',
                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center',
              }}
            >
              <X size={12} />
            </button>
          )}
          {open
            ? <ChevronUp size={13} style={{ color: subClr }} />
            : <ChevronDown size={13} style={{ color: subClr }} />
          }
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div style={{
          padding: '10px 12px',
          borderTop: `1px solid ${rowBdr}`,
          background: isDark ? '#0e0e10' : '#E8E7E3',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {/* Search within values — only show if many options */}
          {values.length > 6 && (
            <div style={{ position: 'relative' }}>
              <Search size={11} style={{
                position: 'absolute', left: 8, top: '50%',
                transform: 'translateY(-50%)',
                color: plhClr, pointerEvents: 'none',
              }} />
              <input
                type="text"
                placeholder={`Найти в "${header}"...`}
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '5px 8px 5px 26px',
                  borderRadius: 6, border: `1px solid ${inpBdr}`,
                  background: inpBg, color: inpClr,
                  fontSize: 12, outline: 'none', boxSizing: 'border-box',
                }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{
                  position: 'absolute', right: 6, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  color: plhClr, display: 'flex',
                }}>
                  <X size={11} />
                </button>
              )}
            </div>
          )}

          {/* Value tags — max height with scroll for huge lists */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 5,
            maxHeight: 160, overflowY: 'auto',
          }}>
            {filtered.length === 0 ? (
              <span style={{ fontSize: 12, color: plhClr, fontStyle: 'italic' }}>Нет совпадений</span>
            ) : filtered.map(val => {
              const active = activeFilters.has(val);
              return (
                <button
                  key={val}
                  onClick={() => onToggleFilter(colIndex, val)}
                  title={val}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: `1px solid ${active ? actTagBdr : tagBdr}`,
                    background: active ? actTagBg : tagBg,
                    color: active ? actTagClr : tagClr,
                    fontSize: 12, cursor: 'pointer',
                    fontWeight: active ? 600 : 400,
                    transition: 'all 0.12s',
                    whiteSpace: 'nowrap',
                    maxWidth: 220,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {val}
                </button>
              );
            })}
          </div>

          {/* Select all / clear shortcuts */}
          {filtered.length > 1 && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => filtered.filter(v => !activeFilters.has(v)).forEach(v => onToggleFilter(colIndex, v))}
                style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 5,
                  border: `1px solid ${tagBdr}`,
                  background: 'transparent', cursor: 'pointer',
                  color: subClr, transition: 'all 0.12s',
                }}
              >
                Выбрать все
              </button>
              {activeFilters.size > 0 && (
                <button
                  onClick={() => Array.from(activeFilters).forEach(v => onToggleFilter(colIndex, v))}
                  style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 5,
                    border: `1px solid ${tagBdr}`,
                    background: 'transparent', cursor: 'pointer',
                    color: subClr, transition: 'all 0.12s',
                  }}
                >
                  Снять все
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};