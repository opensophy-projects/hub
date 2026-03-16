import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Copy, Check, ChevronDown, X, Filter, RotateCcw } from 'lucide-react';
import { ModalTableContent } from './ModalTableContent';
import { parseTableFromHTML, filterRows, getUniqueValuesForColumn } from '../utils/tableModalUtils';

interface TableModalProps {
  isOpen: boolean;
  tableHtml: string;
  isDark: boolean;
  onClose: () => void;
}

// ─── Copy helpers (same as in TableControlsBar) ───────────────────────────────

function parseTableForCopy(html: string): { headers: string[]; rows: string[][] } {
  const doc   = new DOMParser().parseFromString(html, 'text/html');
  const table = doc.querySelector('table');
  if (!table) return { headers: [], rows: [] };
  const headers = Array.from(table.querySelectorAll('thead th')).map(th => (th.textContent ?? '').trim());
  const rows    = Array.from(table.querySelectorAll('tbody tr')).map(tr =>
    Array.from(tr.querySelectorAll('td')).map(td => (td.textContent ?? '').trim())
  );
  return { headers, rows };
}

function toMarkdownTable(headers: string[], rows: string[][]): string {
  if (!headers.length) return '';
  const e   = (s: string) => s.replace(/\|/g, '\\|');
  const sep  = headers.map(() => '---').join(' | ');
  const head = headers.map(e).join(' | ');
  const body = rows.map(r => `| ${r.map(e).join(' | ')} |`).join('\n');
  return `| ${head} |\n| ${sep} |\n${body}`;
}

function toExcelTsv(headers: string[], rows: string[][]): string {
  if (!headers.length) return '';
  return [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
}

// ─── ModalToolbar ─────────────────────────────────────────────────────────────

const ModalToolbar: React.FC<{
  isDark: boolean;
  tableHtml: string;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  activeFilterCount: number;
  onResetFilters: () => void;
  onClose: () => void;
}> = ({
  isDark, tableHtml, searchQuery, onSearchChange,
  showFilters, onToggleFilters, activeFilterCount, onResetFilters, onClose,
}) => {
  const [copyOpen,   setCopyOpen]   = useState(false);
  const [copied,     setCopied]     = useState<'md'|'excel'|null>(null);
  const copyMenuRef = useRef<HTMLDivElement>(null);
  const copyBtnRef  = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!copyOpen) return;
    const h = (e: MouseEvent) => {
      if (
        copyMenuRef.current && !copyMenuRef.current.contains(e.target as Node) &&
        copyBtnRef.current  && !copyBtnRef.current.contains(e.target as Node)
      ) setCopyOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [copyOpen]);

  const doCopy = async (format: 'md' | 'excel') => {
    const { headers, rows } = parseTableForCopy(tableHtml);
    const text = format === 'md' ? toMarkdownTable(headers, rows) : toExcelTsv(headers, rows);
    await navigator.clipboard.writeText(text);
    setCopied(format);
    setCopyOpen(false);
    setTimeout(() => setCopied(null), 2000);
  };

  const border    = isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.15)';
  const btnBg     = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const btnHov    = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
  const btnColor  = isDark ? 'rgba(255,255,255,0.8)'  : 'rgba(0,0,0,0.75)';
  const menuBg    = isDark ? '#1f1f1f'                : '#f5f4f0';
  const menuBorder= isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
  const itemHov   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const isCopied  = copied !== null;

  const Btn = ({
    onClick, title, children, active = false,
  }: { onClick: () => void; title: string; children: React.ReactNode; active?: boolean }) => (
    <button
      onClick={onClick}
      title={title}
      style={{
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        gap:           '2px',
        padding:       '5px 10px',
        borderRadius:  '7px',
        border:        `1px solid ${border}`,
        background:    active ? btnHov : btnBg,
        color:         btnColor,
        cursor:        'pointer',
        fontSize:      '12px',
        flexShrink:    0,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = btnHov; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = active ? btnHov : btnBg; }}
    >
      {children}
    </button>
  );

  return (
    <div
      style={{
        display:      'flex',
        flexWrap:     'wrap',
        alignItems:   'center',
        gap:          '8px',
        padding:      '10px 14px',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        flexShrink:   0,
      }}
    >
      {/* Search */}
      <input
        type="text"
        placeholder="Поиск в таблице..."
        value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
        style={{
          flex:         1,
          minWidth:     '180px',
          padding:      '7px 12px',
          borderRadius: '8px',
          border:       `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
          background:   isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          color:        isDark ? '#fff' : '#000',
          fontSize:     '13px',
          outline:      'none',
        }}
      />

      {/* Copy button with dropdown */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          ref={copyBtnRef}
          onClick={() => setCopyOpen(v => !v)}
          style={{
            display:       'flex',
            flexDirection: 'column',
            alignItems:    'center',
            gap:           '2px',
            padding:       '5px 10px',
            borderRadius:  '7px',
            border:        `1px solid ${border}`,
            background:    isCopied ? (isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.12)') : btnBg,
            color:         isCopied ? '#22c55e' : btnColor,
            cursor:        'pointer',
            flexShrink:    0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            {isCopied ? <Check size={14} /> : <Copy size={14} />}
            <ChevronDown size={11} style={{ opacity: 0.6, transform: copyOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
          </div>
          <span style={{ fontSize: '10px', lineHeight: 1, whiteSpace: 'nowrap' }}>
            {isCopied ? 'Скопировано!' : 'Копировать'}
          </span>
        </button>

        {copyOpen && (
          <div
            ref={copyMenuRef}
            style={{
              position: 'absolute', top: 'calc(100% + 5px)', right: 0,
              minWidth: '160px', background: menuBg, border: `1px solid ${menuBorder}`,
              borderRadius: '10px', boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.7)' : '0 8px 24px rgba(0,0,0,0.14)',
              zIndex: 300, overflow: 'hidden', animation: 'cmIn 0.12s ease',
            }}
          >
            <style>{`@keyframes cmIn { from{opacity:0;transform:translateY(-4px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }`}</style>
            {[
              { format: 'md'    as const, label: 'Markdown',        sub: 'Для документов' },
              { format: 'excel' as const, label: 'Excel / таблица', sub: 'TSV (Tab-separated)' },
            ].map(({ format, label, sub }) => (
              <button
                key={format}
                onClick={() => doCopy(format)}
                style={{
                  display: 'flex', flexDirection: 'column', gap: '1px',
                  width: '100%', padding: '9px 13px', border: 'none',
                  background: 'transparent', cursor: 'pointer', textAlign: 'left',
                  color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = itemHov; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                <span style={{ fontSize: '13px', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: '10px', opacity: 0.5 }}>{sub}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filters toggle */}
      <Btn onClick={onToggleFilters} title="Фильтры" active={showFilters || activeFilterCount > 0}>
        <Filter size={14} />
        <span style={{ fontSize: '10px', lineHeight: 1, whiteSpace: 'nowrap' }}>
          {activeFilterCount > 0 ? `Фильтры (${activeFilterCount})` : 'Фильтры'}
        </span>
      </Btn>

      {activeFilterCount > 0 && (
        <Btn onClick={onResetFilters} title="Сбросить фильтры">
          <RotateCcw size={14} />
          <span style={{ fontSize: '10px', lineHeight: 1 }}>Сбросить</span>
        </Btn>
      )}

      {/* Close */}
      <Btn onClick={onClose} title="Закрыть">
        <X size={14} />
        <span style={{ fontSize: '10px', lineHeight: 1 }}>Закрыть</span>
      </Btn>
    </div>
  );
};

// ─── FilterPanel (modal) ──────────────────────────────────────────────────────

const ModalFilterPanel: React.FC<{
  isDark: boolean;
  headers: Array<{ text: string; colIndex: number }>;
  activeFilters: Map<string, Set<string>>;
  uniqueValues: Map<string, string[]>;
  onFilterChange: (col: string, val: string, checked: boolean) => void;
  visibleColumns: Set<string>;
  onColumnToggle: (col: string) => void;
}> = ({ isDark, headers, activeFilters, uniqueValues, onFilterChange, visibleColumns, onColumnToggle }) => {
  const bg      = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const border  = isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.1)';
  const labelC  = isDark ? 'rgba(255,255,255,0.5)'  : 'rgba(0,0,0,0.5)';
  const activeItemBg = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)';
  const itemBorder   = isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.2)';
  const itemC        = isDark ? 'rgba(255,255,255,0.8)'  : 'rgba(0,0,0,0.75)';
  const itemActiveC  = isDark ? '#fff' : '#000';

  return (
    <div
      style={{
        background:   bg,
        borderBottom: `1px solid ${border}`,
        padding:      '12px 14px',
        maxHeight:    '220px',
        overflowY:    'auto',
        flexShrink:   0,
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {/* Column visibility */}
        <div>
          <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: labelC, marginBottom: '6px' }}>
            Колонки
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {headers.map(h => {
              const visible = visibleColumns.has(h.text);
              return (
                <label
                  key={h.colIndex}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '3px 8px', borderRadius: '6px', cursor: 'pointer',
                    background: visible ? activeItemBg : 'transparent',
                    border: `1px solid ${visible ? itemBorder : 'transparent'}`,
                    color: visible ? itemActiveC : itemC,
                    fontSize: '12px',
                  }}
                >
                  <input type="checkbox" checked={visible} onChange={() => onColumnToggle(h.text)} style={{ cursor: 'pointer' }} />
                  {h.text}
                </label>
              );
            })}
          </div>
        </div>

        {/* Value filters per column */}
        {headers.map(h => {
          const values = uniqueValues.get(h.text) ?? [];
          if (values.length === 0) return null;
          const activeSet = activeFilters.get(h.text) ?? new Set<string>();
          return (
            <div key={h.colIndex}>
              <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: labelC, marginBottom: '6px' }}>
                {h.text}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '120px', overflowY: 'auto' }}>
                {values.map(val => {
                  const active = activeSet.has(val);
                  return (
                    <label
                      key={val}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '3px 8px', borderRadius: '6px', cursor: 'pointer',
                        background: active ? activeItemBg : 'transparent',
                        border: `1px solid ${active ? itemBorder : 'transparent'}`,
                        color: active ? itemActiveC : itemC,
                        fontSize: '12px', whiteSpace: 'nowrap',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={e => onFilterChange(h.text, val, e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      {val}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── TableModal ───────────────────────────────────────────────────────────────

const TableModal: React.FC<TableModalProps> = ({ isOpen, tableHtml, isDark, onClose }) => {
  const [searchQuery,   setSearchQuery]   = useState('');
  const [showFilters,   setShowFilters]   = useState(false);
  const [activeFilters, setActiveFilters] = useState<Map<string, Set<string>>>(new Map());
  const dialogRef = useRef<HTMLDialogElement>(null);

  const parsedTable = useMemo(() => parseTableFromHTML(tableHtml), [tableHtml]);

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    () => new Set(parsedTable.headers.map(h => h.text))
  );

  const headersKey = parsedTable.headers.map(h => h.text).join(',');
  useEffect(() => {
    setVisibleColumns(new Set(parsedTable.headers.map(h => h.text)));
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
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const uniqueValues = useMemo(() => {
    const map = new Map<string, string[]>();
    parsedTable.headers.forEach(header => {
      map.set(header.text, getUniqueValuesForColumn(parsedTable.rows, header.text));
    });
    return map;
  }, [parsedTable]);

  const filteredRows = useMemo(
    () => filterRows(parsedTable.rows, searchQuery, activeFilters, visibleColumns),
    [parsedTable.rows, searchQuery, activeFilters, visibleColumns]
  );

  const handleFilterChange = (column: string, value: string, checked: boolean) => {
    setActiveFilters(prev => {
      const next = new Map(prev);
      const set  = new Set(next.get(column) ?? []);
      checked ? set.add(value) : set.delete(value);
      if (set.size === 0) next.delete(column); else next.set(column, set);
      return next;
    });
  };

  const handleResetFilters = () => {
    setActiveFilters(new Map());
    setSearchQuery('');
  };

  const handleColumnToggle = (col: string) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      next.has(col) ? next.delete(col) : next.add(col);
      return next;
    });
  };

  const activeFilterCount = Array.from(activeFilters.values()).filter(s => s.size > 0).length;

  useEffect(() => {
    if (!isOpen) return;
    const onKey      = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const dialog     = dialogRef.current;
    const onBackdrop = (e: MouseEvent) => {
      if (!dialog) return;
      const r = dialog.getBoundingClientRect();
      const inside = r.top <= e.clientY && e.clientY <= r.top + r.height &&
                     r.left <= e.clientX && e.clientX <= r.left + r.width;
      if (!inside) onClose();
    };
    document.addEventListener('keydown', onKey);
    dialog?.addEventListener('click', onBackdrop);
    return () => {
      document.removeEventListener('keydown', onKey);
      dialog?.removeEventListener('click', onBackdrop);
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
      {/* Container fills 95 % of the viewport; flex-col so table takes remaining height */}
      <div
        className={`relative rounded-lg shadow-2xl flex flex-col overflow-hidden ${
          isDark ? 'bg-[#1a1a1a]' : 'bg-[#E8E7E3]'
        }`}
        style={{ width: '95vw', height: '95vh' }}
      >
        <ModalToolbar
          isDark={isDark}
          tableHtml={tableHtml}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(v => !v)}
          activeFilterCount={activeFilterCount}
          onResetFilters={handleResetFilters}
          onClose={onClose}
        />

        {showFilters && (
          <ModalFilterPanel
            isDark={isDark}
            headers={parsedTable.headers}
            activeFilters={activeFilters}
            uniqueValues={uniqueValues}
            onFilterChange={handleFilterChange}
            visibleColumns={visibleColumns}
            onColumnToggle={handleColumnToggle}
          />
        )}

        {/* ModalTableContent uses flex:1 internally to fill remaining space */}
        <ModalTableContent
          isDark={isDark}
          headers={parsedTable.headers}
          filteredRows={filteredRows}
          visibleColumns={visibleColumns}
        />
      </div>
    </dialog>
  );
};

export default TableModal;