import React, { useEffect, useState, useMemo, useCallback } from 'react';

interface TableModalProps {
  isOpen: boolean;
  tableHtml: string;
  isDark: boolean;
  onClose: () => void;
}

interface ModalTableState {
  searchQuery: string;
  sortColumn: number | null;
  sortDirection: 'asc' | 'desc' | 'none';
  filters: Map<number, Set<string>>;
  visibleColumns: Set<number>;
}

const XIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const TableModal: React.FC<TableModalProps> = ({ isOpen, tableHtml, isDark, onClose }) => {
  const [state, setState] = useState<ModalTableState>({
    searchQuery: '',
    sortColumn: null,
    sortDirection: 'none',
    filters: new Map(),
    visibleColumns: new Set(),
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showColumns, setShowColumns] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const doc = new DOMParser().parseFromString(tableHtml, 'text/html');
  const table = doc.querySelector('table');
  if (!table) return null;

  const headers = Array.from(table.querySelectorAll('thead th')).map(h => h.textContent || '');
  const rows = Array.from(table.querySelectorAll('tbody tr'));

  if (state.visibleColumns.size === 0) {
    setState(s => ({
      ...s,
      visibleColumns: new Set(headers.map((_, i) => i)),
    }));
  }

  const getUniqueValuesForColumn = useCallback(
    (i: number) =>
      Array.from(new Set(rows.map(r => r.querySelectorAll('td')[i]?.textContent?.trim() || '')))
        .filter(Boolean)
        .sort(),
    [rows]
  );

  const filteredRows = useMemo(() => {
    let r = rows.map(row => ({
      cells: Array.from(row.querySelectorAll('td')).map(td => td.textContent?.trim() || ''),
    }));

    state.filters.forEach((vals, i) => {
      r = r.filter(row => vals.has(row.cells[i]));
    });

    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      r = r.filter(row => row.cells.some(c => c.toLowerCase().includes(q)));
    }

    if (state.sortColumn !== null && state.sortDirection !== 'none') {
      r.sort((a, b) => {
        const c = a.cells[state.sortColumn!].localeCompare(b.cells[state.sortColumn!], 'ru');
        return state.sortDirection === 'asc' ? c : -c;
      });
    }

    return r;
  }, [rows, state]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className={`fixed inset-0 ${isDark ? 'bg-black/80' : 'bg-white/80'}`} />
      <div
        className={`relative z-[101] max-h-[90vh] max-w-[95vw] flex flex-col rounded-lg overflow-hidden
        ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#E8E7E3]'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`sticky top-0 z-40 flex items-center justify-between p-4 border-b
          ${isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-black/10 bg-[#E8E7E3]'}`}>
          <h3 className={isDark ? 'text-white font-bold' : 'text-black font-bold'}>Таблица</h3>
          <button onClick={onClose} className="p-2"><XIcon /></button>
        </div>

        <div className="flex-1 relative">
          <div className="overflow-x-auto overflow-y-auto h-full">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-30">
                <tr>
                  {headers.map((h, i) =>
                    state.visibleColumns.has(i) && (
                      <th
                        key={i}
                        className={`px-4 py-3 text-left font-semibold cursor-pointer
                        ${isDark ? 'text-white bg-[#1a1a1a]' : 'text-black bg-[#E8E7E3]'}`}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, ri) => (
                  <tr
                    key={ri}
                    className={`${!isDark && (ri % 2 ? 'bg-[#f1f0ec]' : 'bg-[#E8E7E3]')}`}
                  >
                    {row.cells.map((c, ci) =>
                      state.visibleColumns.has(ci) && (
                        <td
                          key={ci}
                          className={`px-4 py-3 ${isDark ? 'text-white/90' : 'text-black'}`}
                        >
                          {c}
                        </td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableModal;
