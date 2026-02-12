import React, { useState, useEffect, useMemo } from 'react';
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
  const [showColumns, setShowColumns] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Map<string, Set<string>>>(new Map());
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());

  const parsedTable = useMemo(() => parseTableFromHTML(tableHtml), [tableHtml]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (parsedTable.headers.length > 0) {
      setVisibleColumns(new Set(parsedTable.headers.map((h) => h.text)));
    }
  }, [parsedTable]);

  const uniqueValues = useMemo(() => {
    const map = new Map<string, string[]>();
    parsedTable.headers.forEach((header) => {
      map.set(header.text, getUniqueValuesForColumn(parsedTable.rows, header.text));
    });
    return map;
  }, [parsedTable]);

  const filteredRows = useMemo(
    () => filterRows(parsedTable.rows, searchQuery, activeFilters, visibleColumns),
    [parsedTable.rows, searchQuery, activeFilters, visibleColumns],
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
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const backdropClass = isDark ? 'bg-black/80' : 'bg-white/80';

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center ${backdropClass}`}>
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Закрыть модальное окно"
      />
      <div
        className={`relative w-full max-w-[95vw] max-h-[95vh] rounded-lg shadow-2xl flex flex-col overflow-hidden ${isDark ? 'bg-[#1a1a1a]' : 'bg-[#E8E7E3]'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Модальное окно таблицы"
      >
        <FilterSection
          isDark={isDark}
          showFilters={false}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          headers={parsedTable.headers}
          activeFilters={activeFilters}
          uniqueValues={uniqueValues}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          isFullscreen={true}
          onClose={onClose}
          showColumns={showColumns}
          onToggleColumns={() => setShowColumns(!showColumns)}
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
    </div>
  );
};

export default TableModal;