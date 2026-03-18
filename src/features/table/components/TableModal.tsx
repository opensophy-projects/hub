import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Filter, RotateCcw, Copy, Check, ChevronDown, Search } from 'lucide-react';
import { createPortal } from 'react-dom';
import { FiltersPanel } from './FiltersPanel';
import { ColumnsPanel } from './ColumnsPanel';
import { TableView } from './TableView';
import { parseTableHtml } from '../utils/tableParser';
import { filterAndSortRows, stripHtmlNormalize } from '../utils/tableFiltering';
import { parseTableForCopy, toMd, toTsv, type CopyFormat } from '../utils/copyUtils';
import type { TableControlsState } from '../types/table';

interface TableModalProps {
  isOpen: boolean;
  tableHtml: string;
  isDark: boolean;
  onClose: () => void;
}

function tk(isDark: boolean) {
  return isDark ? {
    modalBg:  '#0a0a0a',
    barBg:    '#111111',
    border:   'rgba(255,255,255,0.08)',
    btnBg:    'rgba(255,255,255,0.08)',
    btnBdr:   'rgba(255,255,255,0.12)',
    btnHov:   'rgba(255,255,255,0.14)',
    btnClr:   'rgba(255,255,255,0.72)',
    btnActBg: 'rgba(255,255,255,0.15)',
    btnActBdr:'rgba(255,255,255,0.22)',
    btnActClr:'#ffffff',
    inpBg:    '#1a1a1a',
    inpBdr:   'rgba(255,255,255,0.12)',
    inpFoc:   'rgba(255,255,255,0.26)',
    inpClr:   'rgba(255,255,255,0.88)',
    plhClr:   'rgba(255,255,255,0.28)',
    dangerClr:'#f87171',
    footerClr:'rgba(255,255,255,0.22)',
    dropBg:   '#222222',
    dropBdr:  'rgba(255,255,255,0.12)',
    dropHov:  'rgba(255,255,255,0.08)',
    dropClr:  'rgba(255,255,255,0.85)',
    dropSub:  'rgba(255,255,255,0.38)',
  } : {
    modalBg:  '#E8E7E3',
    barBg:    '#d8d7d3',
    border:   'rgba(0,0,0,0.09)',
    btnBg:    'rgba(0,0,0,0.07)',
    btnBdr:   'rgba(0,0,0,0.12)',
    btnHov:   'rgba(0,0,0,0.12)',
    btnClr:   'rgba(0,0,0,0.68)',
    btnActBg: 'rgba(0,0,0,0.12)',
    btnActBdr:'rgba(0,0,0,0.22)',
    btnActClr:'#000000',
    inpBg:    '#E8E7E3',
    inpBdr:   'rgba(0,0,0,0.12)',
    inpFoc:   'rgba(0,0,0,0.28)',
    inpClr:   '#000000',
    plhClr:   'rgba(0,0,0,0.35)',
    dangerClr:'#dc2626',
    footerClr:'rgba(0,0,0,0.32)',
    dropBg:   '#eceae6',
    dropBdr:  'rgba(0,0,0,0.12)',
    dropHov:  'rgba(0,0,0,0.07)',
    dropClr:  'rgba(0,0,0,0.85)',
    dropSub:  'rgba(0,0,0,0.4)',
  };
}

// ─── Dropdown menu rendered in body — bypasses any stacking context ───────────
const BodyDropdown: React.FC<{
  anchorRef: React.RefObject<HTMLButtonElement>;
  isDark: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ anchorRef, isDark, onClose, children }) => {
  const t = tk(isDark);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const r = anchorRef.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ top: r.bottom + 6, left: Math.min(r.left, window.innerWidth - 202) });
  }, [anchorRef]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node) && !anchorRef.current?.contains(e.target as Node))
        onClose();
    };
    document.addEventListener('mousedown', h, true);
    return () => document.removeEventListener('mousedown', h, true);
  }, [anchorRef, onClose]);

  return createPortal(
    <>
      <style>{`@keyframes mdIn{from{opacity:0;transform:translateY(-5px) scale(0.97)}to{opacity:1;transform:none}}`}</style>
      <div ref={menuRef} style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        minWidth: 192,
        zIndex: 2147483647,
        background: t.dropBg,
        border: `1px solid ${t.dropBdr}`,
        borderRadius: 10,
        boxShadow: isDark
          ? '0 12px 40px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.05)'
          : '0 12px 32px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        animation: 'mdIn 0.13s cubic-bezier(0.2,0,0,1)',
        isolation: 'isolate',
      }}>
        {children}
      </div>
    </>,
    document.body,
  );
};

// ─── Pill button ─────────────────────────────────────────────────────────────
const Pill: React.FC<{
  onClick: () => void; title: string; label: string;
  icon: React.ReactNode; t: ReturnType<typeof tk>;
  active?: boolean; danger?: boolean;
}> = ({ onClick, title, label, icon, t, active, danger }) => {
  const bg    = active ? t.btnActBg  : t.btnBg;
  const bdr   = active ? t.btnActBdr : t.btnBdr;
  const color = danger ? t.dangerClr : active ? t.btnActClr : t.btnClr;
  return (
    <button onClick={onClick} title={title} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 3,
      padding: '5px 12px', minWidth: 52, height: 44,
      borderRadius: 8, border: `1px solid ${bdr}`,
      background: bg, color, cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = t.btnHov; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = bg; }}
    >
      {icon}
      <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, lineHeight: 1, whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  );
};

// ─── Copy button ─────────────────────────────────────────────────────────────
const CopyBtn: React.FC<{ isDark: boolean; tableHtml: string; t: ReturnType<typeof tk> }> = ({ isDark, tableHtml, t }) => {
  const [open, setOpen]     = useState(false);
  const [copied, setCopied] = useState<CopyFormat | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const isCopied = !!copied;

  const doCopy = async (fmt: CopyFormat) => {
    const { headers, rows } = parseTableForCopy(tableHtml);
    await navigator.clipboard.writeText(fmt === 'md' ? toMd(headers, rows) : toTsv(headers, rows));
    setCopied(fmt); setOpen(false);
    setTimeout(() => setCopied(null), 2000);
  };

  const bg    = isCopied ? (isDark ? 'rgba(34,197,94,0.16)' : 'rgba(34,197,94,0.14)') : t.btnBg;
  const bdr   = isCopied ? (isDark ? 'rgba(34,197,94,0.4)'  : 'rgba(34,197,94,0.5)')  : t.btnBdr;
  const color = isCopied ? '#22c55e' : t.btnClr;

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen(v => !v)}
        title="Копировать"
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 3,
          padding: '5px 12px', minWidth: 68, height: 44,
          borderRadius: 8, border: `1px solid ${bdr}`,
          background: bg, color, cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
        }}
        onMouseEnter={e => { if (!isCopied) (e.currentTarget as HTMLButtonElement).style.background = t.btnHov; }}
        onMouseLeave={e => { if (!isCopied) (e.currentTarget as HTMLButtonElement).style.background = bg; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isCopied ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} />}
          <ChevronDown size={10} style={{ opacity: 0.45, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.13s' }} />
        </div>
        <span style={{ fontSize: 10, lineHeight: 1, fontWeight: isCopied ? 600 : 400 }}>
          {isCopied ? 'Скопировано' : 'Копировать'}
        </span>
      </button>

      {open && (
        <BodyDropdown anchorRef={btnRef} isDark={isDark} onClose={() => setOpen(false)}>
          {(['md', 'excel'] as CopyFormat[]).map(fmt => (
            <button key={fmt} onClick={() => doCopy(fmt)} style={{
              width: '100%', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 2,
              border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left',
              color: t.dropClr, transition: 'background 0.1s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = t.dropHov; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 13, fontWeight: 500 }}>{fmt === 'md' ? 'Markdown' : 'Excel / TSV'}</span>
              <span style={{ fontSize: 11, color: t.dropSub }}>{fmt === 'md' ? 'Для документов' : 'Tab-separated'}</span>
            </button>
          ))}
        </BodyDropdown>
      )}
    </>
  );
};

// ─── TableModal ───────────────────────────────────────────────────────────────
const TableModal: React.FC<TableModalProps> = ({ isOpen, tableHtml, isDark, onClose }) => {
  const t = tk(isDark);

  const { headers, rows, headerAlignments } = useMemo(() => parseTableHtml(tableHtml), [tableHtml]);

  const [state, setState] = useState<TableControlsState>({
    searchQuery: '',
    sortColumn: null,
    sortDirection: 'none',
    filters: new Map(),
    visibleColumns: new Set(Array.from({ length: headers.length }, (_, i) => i)),
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setState({
      searchQuery: '',
      sortColumn: null,
      sortDirection: 'none',
      filters: new Map(),
      visibleColumns: new Set(Array.from({ length: headers.length }, (_, i) => i)),
    });
    setShowFilters(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableHtml]);

  const filteredAndSorted = useMemo(() => filterAndSortRows(rows, state), [rows, state]);

  const getUniqueForCol = (colIndex: number): string[] =>
    Array.from(new Set(
      rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        return stripHtmlNormalize(cells[colIndex]?.innerHTML || '');
      }).filter(Boolean)
    )).sort();

  const toggleFilter = (colIndex: number, value: string) => {
    setState(prev => {
      const next = new Map(prev.filters);
      const set  = new Set(next.get(colIndex) ?? []);
      set.has(value) ? set.delete(value) : set.add(value);
      if (set.size === 0) next.delete(colIndex); else next.set(colIndex, set);
      return { ...prev, filters: next };
    });
  };

  const handleSort = (colIndex: number) => {
    setState(prev => {
      if (prev.sortColumn === colIndex) {
        const dirs = ['asc', 'desc', 'none'] as const;
        const next = dirs[(dirs.indexOf(prev.sortDirection) + 1) % dirs.length];
        return { ...prev, sortDirection: next };
      }
      return { ...prev, sortColumn: colIndex, sortDirection: 'asc' };
    });
  };

  const toggleColumn = (colIndex: number) => {
    setState(prev => {
      const next = new Set(prev.visibleColumns);
      next.has(colIndex) ? next.delete(colIndex) : next.add(colIndex);
      return { ...prev, visibleColumns: next };
    });
  };

  const handleReset = () => {
    setState(prev => ({ ...prev, searchQuery: '', sortColumn: null, sortDirection: 'none', filters: new Map() }));
  };

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  const activeFilterCount = Array.from(state.filters.values()).filter(s => s.size > 0).length;
  const filterLabel = activeFilterCount > 0 ? `Фильтры · ${activeFilterCount}` : 'Фильтры';

  if (!isOpen) return null;

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0,
      zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(160,158,154,0.55)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      />

      {/* Modal panel */}
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
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderBottom: `1px solid ${t.border}`, background: t.barBg, flexWrap: 'nowrap', minWidth: 0, flexShrink: 0 }}>
          <div style={{ position: 'relative', flex: '1 1 0', minWidth: 0 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: t.plhClr, pointerEvents: 'none' }} />
            <input
              type="text" placeholder="Поиск..." value={state.searchQuery}
              onChange={e => setState(p => ({ ...p, searchQuery: e.target.value }))}
              style={{ width: '100%', padding: '0 30px 0 30px', height: 36, borderRadius: 8, border: `1px solid ${t.inpBdr}`, background: t.inpBg, color: t.inpClr, fontSize: 13, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
              onFocus={e => { (e.target as HTMLInputElement).style.borderColor = t.inpFoc; }}
              onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = t.inpBdr; }}
            />
            {state.searchQuery && (
              <button onClick={() => setState(p => ({ ...p, searchQuery: '' }))} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: t.plhClr, display: 'flex' }}>
                <X size={12} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <CopyBtn isDark={isDark} tableHtml={tableHtml} t={t} />
            <Pill onClick={() => setShowFilters(v => !v)} title="Фильтры" label={filterLabel} icon={<Filter size={14} />} t={t} active={showFilters || activeFilterCount > 0} />
            {activeFilterCount > 0 && (
              <Pill onClick={handleReset} title="Сбросить" label="Сбросить" icon={<RotateCcw size={14} />} t={t} danger />
            )}
            <Pill onClick={onClose} title="Закрыть (Esc)" label="Закрыть" icon={<X size={14} />} t={t} />
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <>
            <FiltersPanel isDark={isDark} headers={headers} filters={state.filters}
              onToggleFilter={toggleFilter} getUniqueValuesForColumn={getUniqueForCol} />
            <ColumnsPanel isDark={isDark} headers={headers} visibleColumns={state.visibleColumns} onToggleColumn={toggleColumn} />
          </>
        )}

        {/* Table */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          <TableView
            isDark={isDark}
            headers={headers}
            rows={filteredAndSorted}
            visibleColumns={state.visibleColumns}
            searchQuery={state.searchQuery}
            sortColumn={state.sortColumn}
            sortDirection={state.sortDirection}
            onSort={handleSort}
            headerAlignments={headerAlignments}
            fullscreen
          />
        </div>

        {/* Footer */}
        <div style={{ padding: '6px 12px', flexShrink: 0, borderTop: `1px solid ${t.border}`, fontSize: 11, color: t.footerClr, display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none', background: t.modalBg }}>
          <span>{filteredAndSorted.length === rows.length ? `${rows.length} строк` : `${filteredAndSorted.length} из ${rows.length} строк`}</span>
          {activeFilterCount > 0 && <span>{activeFilterCount} фильтра активно</span>}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default TableModal;