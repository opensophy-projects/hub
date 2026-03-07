import React from 'react';
import { Filter, X, Maximize2 } from 'lucide-react';

// ─── Props ────────────────────────────────────────────────────────────────────

interface TableControlsBarProps {
  readonly isDark: boolean;
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly onToggleFilters: () => void;
  readonly activeFilterCount: number;
  readonly onResetFilters: () => void;
  readonly onFullscreen: () => void;
}

// ─── ToolbarButton — pill-style: icon on top, label below ────────────────────

interface ToolbarButtonProps {
  readonly onClick: () => void;
  readonly title: string;
  readonly label: string;
  readonly icon: React.ReactNode;
  readonly isDark: boolean;
  readonly active?: boolean;
}

// FIX S3358: no nested ternaries — each value computed via independent if/return.
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

// ─── TableControlsBar ─────────────────────────────────────────────────────────

export const TableControlsBar: React.FC<TableControlsBarProps> = ({
  isDark,
  searchQuery,
  onSearchChange,
  onToggleFilters,
  activeFilterCount,
  onResetFilters,
  onFullscreen,
}) => {
  const filterLabel = activeFilterCount > 0 ? `Фильтры (${activeFilterCount})` : 'Фильтры';

  return (
    <div className={`flex flex-wrap items-center gap-2 p-3 border-b ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
      <input
        type="text"
        placeholder="Поиск в таблице..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className={`flex-1 min-w-[200px] px-3 py-2 rounded-lg text-sm transition-colors focus:outline-none ${
          isDark
            ? 'bg-white/10 border border-white/20 text-white placeholder-white/50 focus:bg-white/15 focus:border-white/40'
            : 'bg-[#E8E7E3] border border-black/20 text-black placeholder-black/50 focus:border-black/40'
        }`}
      />

      <ToolbarButton
        onClick={onToggleFilters}
        title="Фильтрация и колонки"
        label={filterLabel}
        icon={<Filter size={14} />}
        isDark={isDark}
        active={activeFilterCount > 0}
      />

      {activeFilterCount > 0 && (
        <ToolbarButton
          onClick={onResetFilters}
          title="Сбросить фильтры"
          label="Сбросить"
          icon={<X size={14} />}
          isDark={isDark}
        />
      )}

      <ToolbarButton
        onClick={onFullscreen}
        title="Открыть в полном размере"
        label="Развернуть"
        icon={<Maximize2 size={14} />}
        isDark={isDark}
      />
    </div>
  );
};