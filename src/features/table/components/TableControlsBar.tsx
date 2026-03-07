import React from 'react';
import { Filter, X, Maximize2 } from 'lucide-react';

interface TableControlsBarProps {
  isDark: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onToggleFilters: () => void;
  activeFilterCount: number;
  onResetFilters: () => void;
  onFullscreen: () => void;
}

// ---------------------------------------------------------------------------
// ToolbarButton — pill-style: icon on top, label below (same style as CodeBlock)
// ---------------------------------------------------------------------------

interface ToolbarButtonProps {
  onClick: () => void;
  title: string;
  label: string;
  icon: React.ReactNode;
  isDark: boolean;
  active?: boolean;
}

function ToolbarButton({ onClick, title, label, icon, isDark, active }: ToolbarButtonProps) {
  const border   = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)';
  const bg       = active
    ? isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'
    : isDark ? 'rgba(255,255,255,0.07)' : '#E8E7E3';
  const bgHover  = isDark ? 'rgba(255,255,255,0.18)' : '#ddd8cd';
  const color    = active
    ? isDark ? '#ffffff' : '#000000'
    : isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)';

  return (
    <button
      onClick={onClick}
      title={title}
      style={{ background: bg, color, border: `1px solid ${border}` }}
      className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors"
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

// ---------------------------------------------------------------------------

export const TableControlsBar: React.FC<TableControlsBarProps> = ({
  isDark,
  searchQuery,
  onSearchChange,
  onToggleFilters,
  activeFilterCount,
  onResetFilters,
  onFullscreen,
}) => (
  <div
    className={`flex flex-wrap items-center gap-2 p-3 border-b ${
      isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
    }`}
  >
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
      label={activeFilterCount > 0 ? `Фильтры (${activeFilterCount})` : 'Фильтры'}
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