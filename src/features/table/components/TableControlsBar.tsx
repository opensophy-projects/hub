import React from 'react';
import { X, Search } from 'lucide-react';
import { getTableUiTokens } from './tableUiTheme';
import { TableToolbarMenu } from './TableToolbarMenu';

interface TableControlsBarProps {
  readonly isDark: boolean;
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly showFilters: boolean;
  readonly onToggleFilters: () => void;
  readonly activeFilterCount: number;
  readonly onResetFilters: () => void;
  readonly onFullscreen: () => void;
  readonly tableHtml: string;
}

const tk = getTableUiTokens;

// ─── Панель управления таблицей ───────────────────────────────────────────────
//
// Единый ряд: поиск + одна кнопка-меню (копировать/фильтры/сброс/развернуть),
// как в CodeBlock. Режим "показать всю таблицу" здесь не предлагается —
// он имеет смысл только в развёрнутой модалке (TableModal), где таблице
// уже отведено максимум места и есть куда её "уменьшать".
export const TableControlsBar: React.FC<TableControlsBarProps> = ({
  isDark, searchQuery, onSearchChange,
  showFilters, onToggleFilters, activeFilterCount, onResetFilters,
  onFullscreen, tableHtml,
}) => {
  const t = tk(isDark);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 8px',
      background: t.barBg,
      flexWrap: 'nowrap',
      minWidth: 0,
      width: '100%',
      boxSizing: 'border-box' as const,
    }}>
      <div style={{ position: 'relative', flex: '1 1 0', minWidth: 0 }}>
        <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: t.plhClr, pointerEvents: 'none' }} />
        <input type="text" placeholder="Поиск..." value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          style={{
            width: '100%', padding: '0 28px 0 26px', height: 36, borderRadius: 8,
            border: `1px solid ${t.inpBdr}`, background: t.inpBg, color: t.inpClr,
            fontSize: 13, outline: 'none', boxSizing: 'border-box' as const,
            transition: 'border-color 0.15s', minWidth: 0,
          }}
          onFocus={e => { (e.target as HTMLInputElement).style.borderColor = t.inpFoc; }}
          onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = t.inpBdr; }}
        />
        {searchQuery && (
          <button onClick={() => onSearchChange('')} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: t.plhClr, display: 'flex' }}>
            <X size={12} />
          </button>
        )}
      </div>
      <TableToolbarMenu
        isDark={isDark}
        tableHtml={tableHtml}
        showFilters={showFilters}
        onToggleFilters={onToggleFilters}
        activeFilterCount={activeFilterCount}
        onResetFilters={onResetFilters}
        onFullscreen={onFullscreen}
      />
    </div>
  );
};