import React, { useState, useEffect, useMemo } from 'react';
import { ModalHeader } from './table/ModalHeader';
import { FilterSection } from './table/FilterSection';
import { ColumnsSection } from './table/ColumnsSection';
import { ModalTableContent } from './table/ModalTableContent';
import { parseTableFromHTML, filterRows, getUniqueValuesForColumn } from '../lib/tableModalUtils';

interface TableModalProps {
  isOpen: boolean;
  tableHtml: string;
  isDark: boolean;
  onClose: () => void;
}

export const TableModal: React.FC<TableModalProps> = ({ isOpen, tableHtml, isDark, onClose }) => {
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

  if (!isOpen) return null;

  return (
    <button
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-transparent border-0 p-0 cursor-default ${isDark ? 'bg-black/80' : 'bg-white/80'}`}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
          onClose();
        }
      }}
      aria-label="Закрыть модальное окно таблицы"
      type="button"
    >
      <div
        className={`relative w-full max-w-[95vw] max-h-[95vh] rounded-lg shadow-2xl flex flex-col overflow-hidden ${isDark ? 'bg-[#1a1a1a]' : 'bg-[#E8E7E3]'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader isDark={isDark} onClose={onClose} />

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
        />

        <div className="flex flex-1 overflow-hidden">
          <ModalTableContent
            isDark={isDark}
            headers={parsedTable.headers}
            filteredRows={filteredRows}
            visibleColumns={visibleColumns}
          />

          <button
            onClick={() => setShowColumns(!showColumns)}
            className={`px-3 py-2 border-l ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'}`}
            aria-label="Переключить видимость колонок"
            type="button"
          >
            ☰
          </button>
        </div>

        {showColumns && (
          <ColumnsSection
            isDark={isDark}
            showColumns={showColumns}
            headers={parsedTable.headers}
            visibleColumns={visibleColumns}
            onColumnToggle={handleColumnToggle}
          />
        )}
      </div>
    </button>
  );
};
