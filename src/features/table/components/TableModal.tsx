import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FilterSection } from './FilterSection';
import { ModalTableContent } from './ModalTableContent';
import { parseTableFromHTML, filterRows, getUniqueValuesForColumn } from '../utils/tableModalUtils';

interface TableModalProps {
  isOpen: boolean;
  tableHtml: string;
  isDark: boolean;
  onClose: () => void;
}

const TableModal: React.FC<TableModalProps> = ({ isOpen, tableHtml, isDark, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Map<string, Set<string>>>(new Map());
  const dialogRef = useRef<HTMLDialogElement>(null);

  const parsedTable = useMemo(() => parseTableFromHTML(tableHtml), [tableHtml]);

  // Fix: initialize visibleColumns via useMemo instead of setState in useEffect
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    () => new Set(parsedTable.headers.map((h) => h.text))
  );

  // Sync visibleColumns when parsedTable changes (e.g. tableHtml prop changes)
  const headersKey = parsedTable.headers.map((h) => h.text).join(',');
  useEffect(() => {
    setVisibleColumns(new Set(parsedTable.headers.map((h) => h.text)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headersKey]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    } else {
      dialog.close();
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const uniqueValues = useMemo(() => {
    const map = new Map<string, string[]>();
    parsedTable.headers.forEach((header) => {
      map.set(header.text, getUniqueValuesForColumn(parsedTable.rows, header.text));
    });
    return map;
  }, [parsedTable]);

  const filteredRows = useMemo(
    () => filterRows(parsedTable.rows, searchQuery, activeFilters, visibleColumns),
    [parsedTable.rows, searchQuery, activeFilters, visibleColumns]
  );

  const handleFilterChange = (column: string, value: string, checked: boolean) => {
    const newFilters = new Map(activeFilters);
    const columnFilters = newFilters.get(column) || new Set();

    if (checked) {
      columnFilters.add(value);
    } else {
      columnFilters.delete(value);
    }

    if (columnFilters.size === 0) {
      newFilters.delete(column);
    } else {
      newFilters.set(column, columnFilters);
    }

    setActiveFilters(newFilters);
  };

  const handleResetFilters = () => {
    setActiveFilters(new Map());
    setSearchQuery('');
  };

  const handleColumnToggle = (columnName: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(columnName)) {
      newVisible.delete(columnName);
    } else {
      newVisible.add(columnName);
    }
    setVisibleColumns(newVisible);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    // Fix: capture ref value at effect time, not in cleanup
    const dialog = dialogRef.current;

    const handleBackdropClick = (e: MouseEvent) => {
      if (!dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isInDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;

      if (!isInDialog) onClose();
    };

    document.addEventListener('keydown', handleEscape);
    dialog?.addEventListener('click', handleBackdropClick);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      dialog?.removeEventListener('click', handleBackdropClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-label="Модальное окно таблицы"
      aria-modal="true"
      className={`fixed inset-0 z-[100] flex items-center justify-center w-full h-full max-w-none max-h-none p-0 border-0 ${
        isDark ? 'bg-black/80' : 'bg-white/80'
      }`}
    >
      <div
        className={`relative w-full max-w-[95vw] max-h-[95vh] rounded-lg shadow-2xl flex flex-col overflow-hidden ${
          isDark ? 'bg-[#1a1a1a]' : 'bg-[#E8E7E3]'
        }`}
      >
        <FilterSection
          isDark={isDark}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          headers={parsedTable.headers}
          activeFilters={activeFilters}
          uniqueValues={uniqueValues}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          isFullscreen={true}
          onClose={onClose}
          onToggleColumns={() => setVisibleColumns(new Set(parsedTable.headers.map((h) => h.text)))}
          visibleColumns={visibleColumns}
          onColumnToggle={handleColumnToggle}
        />

        <div className="flex flex-1 overflow-hidden">
          <ModalTableContent
            isDark={isDark}
            headers={parsedTable.headers}
            filteredRows={filteredRows}
            visibleColumns={visibleColumns}
          />
        </div>
      </div>
    </dialog>
  );
};

export default TableModal;
