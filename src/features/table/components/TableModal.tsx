import React, { useEffect, useMemo } from 'react';
import { XIcon as X, MagnifyingGlassIcon as Search } from '@phosphor-icons/react';
import { createPortal } from 'react-dom';
import { FiltersPanel } from './FiltersPanel';
import { ColumnsPanel } from './ColumnsPanel';
import { TableView } from './TableView';
import { parseTableHtml } from '../utils/tableParser';
import { useTableControls } from '../hooks/useTableControls';
import { getTableUiTokens } from './tableUiTheme';
import { TableToolbarMenu } from './TableToolbarMenu';

interface TableModalProps {
  isOpen: boolean;
  tableHtml: string;
  isDark: boolean;
  onClose: () => void;
}

const tk = getTableUiTokens;

// ─── Модальное окно таблицы ───────────────────────────────────────────────────
//
// Единый фон карточки (#0a0a0a / #e8e7e3) для тулбара/панели фильтров/тела
// таблицы/футера — без внутренних разделительных линий, как в CodeBlock.
// Все действия (копировать/фильтры/сброс/закрыть) спрятаны в один
// TableToolbarMenu вместо ряда отдельных пилюль.
const TableModal: React.FC<TableModalProps> = ({ isOpen, tableHtml, isDark, onClose }) => {
  const t = tk(isDark);

  const { headers, rows, headerAlignments } = useMemo(
    () => parseTableHtml(tableHtml),
    [tableHtml]
  );

  const {
    state,
    setState,
    showFilters,
    setShowFilters,
    filteredAndSortedRows,
    getUniqueValuesForColumn,
    toggleColumnVisibility,
    toggleFilter,
    handleSort,
    resetFilters,
    activeFilterCount,
  } = useTableControls(rows, headers);

  // Сброс состояния при открытии новой таблицы
  useEffect(() => {
    resetFilters();
    setShowFilters(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableHtml]);

  // Блокировка скролла body при открытом модале
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Закрытие по Escape
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0,
      zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      WebkitOverflowScrolling: 'touch',
    }}>
      {/* Бэкдроп — button для корректной семантики и поддержки клавиатуры */}
      <button
        onClick={onClose}
        aria-label="Закрыть модальное окно"
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      />

      {/* Панель модального окна */}
      <div style={{
        position: 'relative',
        width: 'min(95vw, 1400px)',
        maxHeight: '90vh',
        borderRadius: 14,
        border: `1px solid ${t.border}`,
        background: t.modalBg,
        boxShadow: isDark
          ? '0 24px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.05)'
          : '0 24px 80px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Тулбар */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px',
          background: t.barBg, flexWrap: 'nowrap', minWidth: 0, flexShrink: 0,
        }}>
          <div style={{ position: 'relative', flex: '1 1 0', minWidth: 0 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: t.plhClr, pointerEvents: 'none' }} weight="duotone" />
            <input
              type="text" placeholder="Поиск..." value={state.searchQuery}
              onChange={e => setState(p => ({ ...p, searchQuery: e.target.value }))}
              style={{
                width: '100%', padding: '0 30px 0 30px', height: 36,
                borderRadius: 8, border: `1px solid ${t.inpBdr}`,
                background: t.inpBg, color: t.inpClr, fontSize: 13,
                outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
              }}
              onFocus={e => { (e.target as HTMLInputElement).style.borderColor = t.inpFoc; }}
              onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = t.inpBdr; }}
            />
            {state.searchQuery && (
              <button
                onClick={() => setState(p => ({ ...p, searchQuery: '' }))}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: t.plhClr, display: 'flex' }}
              >
                <X size={12} weight="duotone" />
              </button>
            )}
          </div>

          <TableToolbarMenu
            isDark={isDark}
            tableHtml={tableHtml}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(v => !v)}
            activeFilterCount={activeFilterCount}
            onResetFilters={resetFilters}
            onClose={onClose}
          />
        </div>

        {/* Панель фильтров — независимый скролл */}
        {showFilters && (
          <div style={{ flexShrink: 0, overflowY: 'auto', maxHeight: '40%', touchAction: 'pan-y' }}>
            <FiltersPanel
              isDark={isDark}
              headers={headers}
              filters={state.filters}
              onToggleFilter={toggleFilter}
              getUniqueValuesForColumn={getUniqueValuesForColumn}
            />
            <ColumnsPanel
              isDark={isDark}
              headers={headers}
              visibleColumns={state.visibleColumns}
              onToggleColumn={toggleColumnVisibility}
            />
          </div>
        )}

        {/* Таблица */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0,
          minWidth: 0,
          touchAction: 'pan-x pan-y',
        }}>
          <TableView
            isDark={isDark}
            headers={headers}
            rows={filteredAndSortedRows}
            visibleColumns={state.visibleColumns}
            searchQuery={state.searchQuery}
            sortColumn={state.sortColumn}
            sortDirection={state.sortDirection}
            onSort={handleSort}
            headerAlignments={headerAlignments}
            fullscreen
          />
        </div>

        {/* Футер со счётчиком строк */}
        <div style={{
          padding: '6px 12px', flexShrink: 0,
          fontSize: 11, color: t.footerClr,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          userSelect: 'none', background: t.modalBg,
        }}>
          <span>
            {filteredAndSortedRows.length === rows.length
              ? `${rows.length} строк`
              : `${filteredAndSortedRows.length} из ${rows.length} строк`}
          </span>
          {activeFilterCount > 0 && <span>{activeFilterCount} фильтра активно</span>}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default TableModal;