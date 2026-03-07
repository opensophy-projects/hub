import React, { useState } from 'react';
import { Filter, X, RotateCcw } from 'lucide-react';

// ─── Props ────────────────────────────────────────────────────────────────────

interface FilterSectionProps {
  readonly isDark: boolean;
  readonly searchQuery: string;
  readonly onSearchChange: (value: string) => void;
  readonly headers: ReadonlyArray<{ readonly text: string; readonly colIndex: number }>;
  readonly activeFilters: Map<string, Set<string>>;
  readonly uniqueValues: Map<string, string[]>;
  readonly onFilterChange: (column: string, value: string, checked: boolean) => void;
  readonly onResetFilters: () => void;
  readonly isFullscreen?: boolean;
  readonly onClose?: () => void;
  readonly onToggleColumns?: () => void;
  readonly visibleColumns?: Set<string>;
  readonly onColumnToggle?: (columnName: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getCheckboxClassName = (isActive: boolean, isDark: boolean): string => {
  if (isActive) {
    return isDark ? 'bg-white/20 border border-white/40' : 'bg-blue-100 border border-blue-300';
  }
  return isDark
    ? 'bg-white/5 border border-white/10 hover:bg-white/10'
    : 'bg-white/50 border border-black/10 hover:bg-white/70';
};

const getCheckboxTextClassName = (isActive: boolean, isDark: boolean): string => {
  if (isActive) {
    return isDark ? 'text-white font-semibold' : 'text-blue-900 font-semibold';
  }
  return isDark ? 'text-white/80' : 'text-black/80';
};

// ─── ToolbarButton — pill style: icon on top, label below ─────────────────────

interface ToolbarButtonProps {
  readonly onClick: () => void;
  readonly title: string;
  readonly label: string;
  readonly icon: React.ReactNode;
  readonly isDark: boolean;
  readonly active?: boolean;
}


function getToolbarButtonBg(isDark: boolean, active: boolean): string {
  if (active) return isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
  return isDark ? 'rgba(255,255,255,0.07)' : '#E8E7E3';
}

function getToolbarButtonColor(isDark: boolean, active: boolean): string {
  if (active) return isDark ? '#ffffff' : '#000000';
  return isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)';
}

function ToolbarButton({ onClick, title, label, icon, isDark, active = false }: ToolbarButtonProps) {
  const border  = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)';
  const bg      = getToolbarButtonBg(isDark, active);
  const bgHover = isDark ? 'rgba(255,255,255,0.18)' : '#ddd8cd';
  const color   = getToolbarButtonColor(isDark, active);

  return (
    <button
      onClick={onClick}
      title={title}
      style={{ background: bg, color, border: `1px solid ${border}` }}
      className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors flex-shrink-0"
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = bgHover; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = bg; }}
    >
      {icon}
      <span className="leading-none whitespace-nowrap" style={{ fontSize: '10px' }}>
        {label}
      </span>
    </button>
  );
}

// ─── FilterSection ─────────────────────────────────────────────────────────────

export const FilterSection: React.FC<FilterSectionProps> = ({
  isDark,
  searchQuery,
  onSearchChange,
  headers,
  activeFilters,
  uniqueValues,
  onFilterChange,
  onResetFilters,
  isFullscreen = false,
  onClose,
  onToggleColumns,
  visibleColumns,
  onColumnToggle,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const activeFiltCount = Array.from(activeFilters.values()).reduce(
    (sum, set) => sum + set.size,
    0,
  );

  const filterLabel = activeFiltCount > 0 ? `Фильтры (${activeFiltCount})` : 'Фильтры';

  return (
    <>
      {/* ── Toolbar row ─────────────────────────────────────────────────── */}
      <div className={`flex flex-wrap items-center gap-2 p-3 border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        <input
          type="text"
          placeholder="Поиск в таблице..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`flex-1 min-w-[160px] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isDark
              ? 'bg-white/10 border border-white/20 text-white placeholder-white/50 focus:bg-white/15 focus:border-white/40'
              : 'bg-white border border-black/20 text-black placeholder-black/50 focus:border-black/40'
          }`}
        />

        <ToolbarButton
          onClick={() => setShowFilters((v) => !v)}
          title="Фильтрация"
          label={filterLabel}
          icon={<Filter size={14} />}
          isDark={isDark}
          active={showFilters || activeFiltCount > 0}
        />

        {activeFiltCount > 0 && (
          <ToolbarButton
            onClick={onResetFilters}
            title="Сбросить фильтры"
            label="Сбросить"
            icon={<RotateCcw size={14} />}
            isDark={isDark}
          />
        )}

        {isFullscreen && onClose && (
          <ToolbarButton
            onClick={onClose}
            title="Закрыть"
            label="Закрыть"
            icon={<X size={14} />}
            isDark={isDark}
          />
        )}
      </div>

      {/* ── Filter panel ────────────────────────────────────────────────── */}
      {showFilters && (
        <div className={`w-full p-3 border-b rounded-b-lg overflow-y-auto max-h-60 ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {headers.map((header) => {
              const values    = uniqueValues.get(header.text) ?? [];
              const activeSet = activeFilters.get(header.text) ?? new Set<string>();

              return (
                <div key={header.colIndex}>
                  <label className={`block text-xs font-semibold mb-2 ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                    {header.text}
                  </label>
                  <div className="space-y-1">
                    {values.map((value) => {
                      const isChecked = activeSet.has(value);
                      return (
                        <label
                          key={value}
                          className={`flex items-center gap-2 text-sm px-2 py-1 rounded transition-colors cursor-pointer ${getCheckboxClassName(isChecked, isDark)}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => onFilterChange(header.text, value, e.target.checked)}
                            className="cursor-pointer"
                          />
                          <span className={getCheckboxTextClassName(isChecked, isDark)}>
                            {value}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Column visibility — only in fullscreen when all callbacks are provided */}
          {isFullscreen && onToggleColumns && visibleColumns && onColumnToggle && (
            <>
              <div className={`border-t pt-3 mb-2 ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                <h4 className={`font-semibold text-sm mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                  Видимость колонок
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {headers.map((header) => {
                  const isVisible = visibleColumns.has(header.text);
                  return (
                    <label
                      key={header.colIndex}
                      className={`flex items-center gap-2 cursor-pointer px-2 py-1 rounded transition-colors ${getCheckboxClassName(isVisible, isDark)}`}
                    >
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => onColumnToggle(header.text)}
                        className="cursor-pointer"
                      />
                      <span className={`text-sm ${getCheckboxTextClassName(isVisible, isDark)}`}>
                        {header.text}
                      </span>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};