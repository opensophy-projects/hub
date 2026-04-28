import React, { useState, useMemo } from 'react';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';
import { makeTokens } from '@/shared/tokens/theme';

interface FiltersPanelProps {
  isDark: boolean;
  headers: string[];
  filters: Map<number, Set<string>>;
  onToggleFilter: (colIndex: number, value: string) => void;
  getUniqueValuesForColumn: (colIndex: number) => string[];
}

// Статические наборы токенов для тёмной и светлой темы
const DARK_TOKENS = {
  bg:       '#0a0a0a',
  panelBg:  '#111111',
  border:   'rgba(255,255,255,0.07)',
  rowBg:    '#161616',
  rowBdr:   'rgba(255,255,255,0.07)',
  headClr:  'rgba(255,255,255,0.7)',
  headActC: '#ffffff',
  subClr:   'rgba(255,255,255,0.28)',
  tagBg:    'rgba(255,255,255,0.07)',
  tagBdr:   'rgba(255,255,255,0.1)',
  tagClr:   'rgba(255,255,255,0.6)',
  actBg:    'rgba(255,255,255,0.16)',
  actBdr:   'rgba(255,255,255,0.3)',
  actClr:   '#ffffff',
  inpBg:    'rgba(255,255,255,0.06)',
  inpBdr:   'rgba(255,255,255,0.1)',
  inpClr:   'rgba(255,255,255,0.8)',
  plhClr:   'rgba(255,255,255,0.25)',
};

const LIGHT_TOKENS = {
  bg:       '#E8E7E3',
  panelBg:  '#d8d7d3',
  border:   'rgba(0,0,0,0.08)',
  rowBg:    '#cbcac6',
  rowBdr:   'rgba(0,0,0,0.08)',
  headClr:  'rgba(0,0,0,0.7)',
  headActC: '#000000',
  subClr:   'rgba(0,0,0,0.32)',
  tagBg:    'rgba(0,0,0,0.06)',
  tagBdr:   'rgba(0,0,0,0.1)',
  tagClr:   'rgba(0,0,0,0.6)',
  actBg:    'rgba(0,0,0,0.13)',
  actBdr:   'rgba(0,0,0,0.25)',
  actClr:   '#000000',
  inpBg:    'rgba(0,0,0,0.06)',
  inpBdr:   'rgba(0,0,0,0.1)',
  inpClr:   'rgba(0,0,0,0.8)',
  plhClr:   'rgba(0,0,0,0.3)',
};

// Возвращает токены для текущей темы
function useThemeTokens(isDark: boolean) {
  const t = makeTokens(isDark);
  return isDark
    ? { ...DARK_TOKENS, bg: t.bg, panelBg: t.surface, border: t.border, inpBg: t.inpBg, inpBdr: t.inpBdr, inpClr: t.inpClr, plhClr: t.plhClr }
    : { ...LIGHT_TOKENS, bg: t.bg, panelBg: t.surface, border: t.border, inpBg: t.inpBg, inpBdr: t.inpBdr, inpClr: t.inpClr, plhClr: t.plhClr };
}

// ─── Подкомпоненты ────────────────────────────────────────────────────────────

interface ActiveTagsProps {
  activeFilters: Set<string>;
  actBg: string; actBdr: string; actClr: string; subClr: string;
}
const ActiveTags: React.FC<ActiveTagsProps> = ({ activeFilters, actBg, actBdr, actClr, subClr }) => (
  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 2, justifyContent: 'flex-end' }}>
    {Array.from(activeFilters).slice(0, 3).map(v => (
      <span key={v} style={{ fontSize: 10, padding: '1px 7px', borderRadius: 4, background: actBg, border: `1px solid ${actBdr}`, color: actClr, fontWeight: 600, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {v}
      </span>
    ))}
    {activeFilters.size > 3 && <span style={{ fontSize: 10, color: subClr }}>+{activeFilters.size - 3}</span>}
  </div>
);

interface SearchInputProps {
  header: string; search: string;
  onSearch: (v: string) => void; onClear: () => void;
  inpBg: string; inpBdr: string; inpClr: string; plhClr: string;
}
const SearchInput: React.FC<SearchInputProps> = ({ header, search, onSearch, onClear, inpBg, inpBdr, inpClr, plhClr }) => (
  <div style={{ position: 'relative' }}>
    <Search size={11} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: plhClr, pointerEvents: 'none' }} />
    <input
      type="text"
      placeholder={`Найти в "${header}"...`}
      value={search}
      onChange={e => onSearch(e.target.value)}
      style={{ width: '100%', padding: '5px 8px 5px 26px', borderRadius: 6, border: `1px solid ${inpBdr}`, background: inpBg, color: inpClr, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
    />
    {search && (
      <button onClick={onClear} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: plhClr, display: 'flex' }}>
        <X size={11} />
      </button>
    )}
  </div>
);

interface FilterTagsProps {
  filtered: string[];
  activeFilters: Set<string>;
  colIndex: number;
  onToggleFilter: (c: number, v: string) => void;
  tagBg: string; tagBdr: string; tagClr: string;
  actBg: string; actBdr: string; actClr: string;
  plhClr: string;
}
const FilterTags: React.FC<FilterTagsProps> = ({ filtered, activeFilters, colIndex, onToggleFilter, tagBg, tagBdr, tagClr, actBg, actBdr, actClr, plhClr }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, maxHeight: 160, overflowY: 'auto' }}>
    {filtered.length === 0
      ? <span style={{ fontSize: 12, color: plhClr, fontStyle: 'italic' }}>Нет совпадений</span>
      : filtered.map(val => {
          const active = activeFilters.has(val);
          return (
            <button
              key={val}
              onClick={() => onToggleFilter(colIndex, val)}
              title={val}
              style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${active ? actBdr : tagBdr}`, background: active ? actBg : tagBg, color: active ? actClr : tagClr, fontSize: 12, cursor: 'pointer', fontWeight: active ? 600 : 400, transition: 'all 0.12s', whiteSpace: 'nowrap', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {val}
            </button>
          );
        })}
  </div>
);

// ─── FiltersPanel ─────────────────────────────────────────────────────────────

export const FiltersPanel: React.FC<FiltersPanelProps> = ({
  isDark, headers, filters, onToggleFilter, getUniqueValuesForColumn,
}) => {
  const { panelBg, border, bg } = useThemeTokens(isDark);

  const columns = useMemo(() =>
    headers.map((header, colIndex) => ({
      header, colIndex,
      values: getUniqueValuesForColumn(colIndex),
    })).filter(c => c.values.length > 0),
  [headers, getUniqueValuesForColumn]);

  let totalActive = 0;
  for (const set of filters.values()) totalActive += set.size;
  const activeLabel: string = totalActive === 0 ? '' : ('· ' + totalActive.toString() + ' активно');

  return (
    <div style={{ background: panelBg, borderBottom: `1px solid ${border}`, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.32)' }}>
        {`Фильтры по колонкам ${activeLabel}`.trimEnd()}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {columns.map(({ header, colIndex, values }) => (
          <FilterAccordion
            key={colIndex}
            header={header}
            colIndex={colIndex}
            values={values}
            activeFilters={filters.get(colIndex) ?? new Set()}
            onToggleFilter={onToggleFilter}
            isDark={isDark}
            bg={bg}
          />
        ))}
      </div>
    </div>
  );
};

// ─── FilterAccordion ──────────────────────────────────────────────────────────

const FilterAccordion: React.FC<{
  header: string; colIndex: number; values: string[];
  activeFilters: Set<string>;
  onToggleFilter: (c: number, v: string) => void;
  isDark: boolean; bg: string;
}> = ({ header, colIndex, values, activeFilters, onToggleFilter, isDark, bg }) => {
  const t = useThemeTokens(isDark);
  const hasActive = activeFilters.size > 0;
  const [open, setOpen] = useState(hasActive);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() =>
    search.trim() ? values.filter(v => v.toLowerCase().includes(search.toLowerCase())) : values,
  [values, search]);

  // Выбирает все незадействованные значения из текущего списка
  const handleSelectAll = () =>
    filtered.filter(v => !activeFilters.has(v)).forEach(v => onToggleFilter(colIndex, v));

  // Снимает все активные фильтры колонки
  const handleClearAll = () =>
    Array.from(activeFilters).forEach(v => onToggleFilter(colIndex, v));

  return (
    <div style={{ borderRadius: 8, border: `1px solid ${t.rowBdr}`, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: t.rowBg, border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <span style={{ flex: 1, fontSize: 12, fontWeight: hasActive ? 700 : 500, color: hasActive ? t.headActC : t.headClr }}>
          {header}
        </span>
        {hasActive && (
          <ActiveTags activeFilters={activeFilters} actBg={t.actBg} actBdr={t.actBdr} actClr={t.actClr} subClr={t.subClr} />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {hasActive && (
            <button
              onClick={e => { e.stopPropagation(); handleClearAll(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px 3px', color: t.subClr, display: 'flex', alignItems: 'center' }}
            >
              <X size={12} />
            </button>
          )}
          {open ? <ChevronUp size={13} style={{ color: t.subClr }} /> : <ChevronDown size={13} style={{ color: t.subClr }} />}
        </div>
      </button>

      {open && (
        <div style={{ padding: '10px 12px', borderTop: `1px solid ${t.rowBdr}`, background: bg, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {values.length > 6 && (
            <SearchInput
              header={header}
              search={search}
              onSearch={setSearch}
              onClear={() => setSearch('')}
              inpBg={t.inpBg} inpBdr={t.inpBdr} inpClr={t.inpClr} plhClr={t.plhClr}
            />
          )}
          <FilterTags
            filtered={filtered}
            activeFilters={activeFilters}
            colIndex={colIndex}
            onToggleFilter={onToggleFilter}
            tagBg={t.tagBg} tagBdr={t.tagBdr} tagClr={t.tagClr}
            actBg={t.actBg} actBdr={t.actBdr} actClr={t.actClr}
            plhClr={t.plhClr}
          />
          {filtered.length > 1 && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSelectAll} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 5, border: `1px solid ${t.tagBdr}`, background: 'transparent', cursor: 'pointer', color: t.subClr }}>
                Выбрать все
              </button>
              {hasActive && (
                <button onClick={handleClearAll} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 5, border: `1px solid ${t.tagBdr}`, background: 'transparent', cursor: 'pointer', color: t.subClr }}>
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
