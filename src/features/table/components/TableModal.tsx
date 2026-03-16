import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Copy, Check, ChevronDown, X, Filter, RotateCcw } from 'lucide-react';
import { ModalTableContent } from './ModalTableContent';
import { parseTableFromHTML, filterRows, getUniqueValuesForColumn } from '../utils/tableModalUtils';

interface TableModalProps {
  isOpen:    boolean;
  tableHtml: string;
  isDark:    boolean;
  onClose:   () => void;
}

type CopyFormat = 'md' | 'excel';

// ─── Theme tokens ─────────────────────────────────────────────────────────────

interface ModalTheme {
  border:     string;
  base:       string;
  hov:        string;
  activeBg:   string;
  color:      string;
  menuBg:     string;
  menuBorder: string;
  itemHov:    string;
  itemColor:  string;
  inputBg:    string;
  inputBorder:string;
  inputColor: string;
}

function getModalTheme(isDark: boolean): ModalTheme {
  return isDark
    ? {
        border:      'rgba(255,255,255,0.1)',
        base:        'rgba(255,255,255,0.07)',
        hov:         'rgba(255,255,255,0.15)',
        activeBg:    'rgba(255,255,255,0.15)',
        color:       'rgba(255,255,255,0.8)',
        menuBg:      '#1f1f1f',
        menuBorder:  'rgba(255,255,255,0.12)',
        itemHov:     'rgba(255,255,255,0.08)',
        itemColor:   'rgba(255,255,255,0.85)',
        inputBg:     'rgba(255,255,255,0.1)',
        inputBorder: 'rgba(255,255,255,0.2)',
        inputColor:  '#fff',
      }
    : {
        border:      'rgba(0,0,0,0.15)',
        base:        'rgba(0,0,0,0.06)',
        hov:         'rgba(0,0,0,0.12)',
        activeBg:    'rgba(0,0,0,0.12)',
        color:       'rgba(0,0,0,0.75)',
        menuBg:      '#f5f4f0',
        menuBorder:  'rgba(0,0,0,0.12)',
        itemHov:     'rgba(0,0,0,0.06)',
        itemColor:   'rgba(0,0,0,0.8)',
        inputBg:     'rgba(0,0,0,0.05)',
        inputBorder: 'rgba(0,0,0,0.2)',
        inputColor:  '#000',
      };
}

// ─── Copy helpers ─────────────────────────────────────────────────────────────

function parseTableForCopy(html: string): { headers: string[]; rows: string[][] } {
  const doc   = new DOMParser().parseFromString(html, 'text/html');
  const table = doc.querySelector('table');
  if (!table) return { headers: [], rows: [] };
  const headers = Array.from(table.querySelectorAll('thead th')).map(
    (th) => (th.textContent ?? '').trim()
  );
  const rows = Array.from(table.querySelectorAll('tbody tr')).map((tr) =>
    Array.from(tr.querySelectorAll('td')).map((td) => (td.textContent ?? '').trim())
  );
  return { headers, rows };
}

// FIX S7781: replaceAll instead of replace with global regex
// FIX S7780: String.raw to avoid escaped backslash
// FIX S4624: no nested template literals
function toMarkdownTable(headers: string[], rows: string[][]): string {
  if (!headers.length) return '';
  const escPipe  = (s: string) => s.replaceAll('|', String.raw`\|`); // S7781 + S7780
  const sep      = headers.map(() => '---').join(' | ');
  const head     = `| ${headers.map(escPipe).join(' | ')} |`;
  const divider  = `| ${sep} |`;
  const bodyLines = rows.map((r) => `| ${r.map(escPipe).join(' | ')} |`); // S4624
  return [head, divider, ...bodyLines].join('\n');
}

function toExcelTsv(headers: string[], rows: string[][]): string {
  if (!headers.length) return '';
  return [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
}

// ─── Shared button style ──────────────────────────────────────────────────────
// FIX S3358: extracted nested ternaries into getModalTheme; active/base resolved before use

function getBtnStyle(t: ModalTheme, active = false): React.CSSProperties {
  return {
    display:       'flex',
    flexDirection: 'column',
    alignItems:    'center',
    gap:           '2px',
    padding:       '5px 10px',
    borderRadius:  '7px',
    border:        `1px solid ${t.border}`,
    background:    active ? t.activeBg : t.base,  // no nested ternary — values come from theme
    color:         t.color,
    cursor:        'pointer',
    flexShrink:    0,
  };
}

// ─── Copy button state + helpers (extracted to reduce ModalToolbar complexity) ─

// FIX S3776: copy-specific state and event handlers pulled out of ModalToolbar

function getCopyBg(isCopied: boolean, isDark: boolean, base: string): string {
  // FIX S3358: flatten nested ternary
  if (!isCopied) return base;
  return isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.12)';
}

function getCopyHoverBg(isCopied: boolean, isDark: boolean, hov: string): string {
  // FIX S3358: flatten nested ternary
  if (!isCopied) return hov;
  return isDark ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.18)';
}

function getCopyLeaveBg(isCopied: boolean, isDark: boolean, base: string): string {
  // FIX S3358: flatten nested ternary
  if (!isCopied) return base;
  return isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.12)';
}

function getCopyColor(isCopied: boolean, t: ModalTheme): string {
  // FIX S3358: flatten nested ternary in color prop
  return isCopied ? '#22c55e' : t.color;
}

// FIX S3776: extract filter-button leave bg into a helper
function getFilterLeaveBg(isActive: boolean, t: ModalTheme): string {
  return isActive ? t.activeBg : t.base;
}

const COPY_OPTIONS: Array<{ format: CopyFormat; label: string; sub: string }> = [
  { format: 'md',    label: 'Markdown',        sub: 'Для документов'      },
  { format: 'excel', label: 'Excel / таблица', sub: 'TSV (Tab-separated)' },
];

// ─── CopyDropdown — isolated so ModalToolbar stays under complexity limit ─────
// FIX S3776: copy dropdown fully extracted from ModalToolbar

interface CopyDropdownProps {
  isDark:    boolean;
  tableHtml: string;
  t:         ModalTheme;
}

const CopyDropdown: React.FC<CopyDropdownProps> = ({ isDark, tableHtml, t }) => {
  const [open,   setOpen]   = useState(false);
  const [copied, setCopied] = useState<CopyFormat | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef  = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target) && !btnRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const doCopy = async (format: CopyFormat) => {
    const { headers, rows } = parseTableForCopy(tableHtml);
    const text = format === 'md' ? toMarkdownTable(headers, rows) : toExcelTsv(headers, rows);
    await navigator.clipboard.writeText(text);
    setCopied(format);
    setOpen(false);
    setTimeout(() => setCopied(null), 2000);
  };

  const isCopied = copied !== null;
  const copyBg   = getCopyBg(isCopied, isDark, t.base);
  const copyColor = getCopyColor(isCopied, t);

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        style={{ ...getBtnStyle(t), background: copyBg, color: copyColor }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = getCopyHoverBg(isCopied, isDark, t.hov); }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = getCopyLeaveBg(isCopied, isDark, t.base); }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          {isCopied ? <Check size={14} /> : <Copy size={14} />}
          <ChevronDown
            size={11}
            style={{
              opacity:    0.6,
              transform:  open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s',
            }}
          />
        </div>
        <span style={{ fontSize: '10px', lineHeight: 1, whiteSpace: 'nowrap' }}>
          {isCopied ? 'Скопировано!' : 'Копировать'}
        </span>
      </button>

      {open && (
        <div
          ref={menuRef}
          style={{
            position:     'absolute',
            top:          'calc(100% + 5px)',
            right:        0,
            minWidth:     '160px',
            background:   t.menuBg,
            border:       `1px solid ${t.menuBorder}`,
            borderRadius: '10px',
            boxShadow:    isDark ? '0 8px 24px rgba(0,0,0,0.7)' : '0 8px 24px rgba(0,0,0,0.14)',
            zIndex:       300,
            overflow:     'hidden',
            animation:    'cmIn 0.12s ease',
          }}
        >
          <style>{`@keyframes cmIn{from{opacity:0;transform:translateY(-4px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
          {COPY_OPTIONS.map(({ format, label, sub }) => (
            <button
              key={format}
              onClick={() => doCopy(format)}
              style={{
                display:       'flex',
                flexDirection: 'column',
                gap:           '1px',
                width:         '100%',
                padding:       '9px 13px',
                border:        'none',
                background:    'transparent',
                cursor:        'pointer',
                textAlign:     'left',
                color:         t.itemColor,
                transition:    'background 0.1s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = t.itemHov; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <span style={{ fontSize: '13px', fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: '10px', opacity: 0.5 }}>{sub}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── ModalToolbar ─────────────────────────────────────────────────────────────
// FIX S3776: complexity reduced by extracting CopyDropdown and helper functions

interface ModalToolbarProps {
  isDark:            boolean;
  tableHtml:         string;
  searchQuery:       string;
  onSearchChange:    (v: string) => void;
  showFilters:       boolean;
  onToggleFilters:   () => void;
  activeFilterCount: number;
  onResetFilters:    () => void;
  onClose:           () => void;
}

const ModalToolbar: React.FC<ModalToolbarProps> = ({
  isDark, tableHtml, searchQuery, onSearchChange,
  showFilters, onToggleFilters, activeFilterCount, onResetFilters, onClose,
}) => {
  const t = getModalTheme(isDark);
  const filtersActive = showFilters || activeFilterCount > 0;

  return (
    <div
      style={{
        display:      'flex',
        flexWrap:     'wrap',
        alignItems:   'center',
        gap:          '8px',
        padding:      '10px 14px',
        flexShrink:   0,
        borderBottom: `1px solid ${t.border}`,
      }}
    >
      {/* Search */}
      <input
        type="text"
        placeholder="Поиск в таблице..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{
          flex:         1,
          minWidth:     '180px',
          padding:      '7px 12px',
          borderRadius: '8px',
          border:       `1px solid ${t.inputBorder}`,
          background:   t.inputBg,
          color:        t.inputColor,
          fontSize:     '13px',
          outline:      'none',
        }}
      />

      {/* Copy (extracted component) */}
      <CopyDropdown isDark={isDark} tableHtml={tableHtml} t={t} />

      {/* Filters toggle */}
      <button
        onClick={onToggleFilters}
        style={getBtnStyle(t, filtersActive)}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = t.hov; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = getFilterLeaveBg(filtersActive, t); }}
      >
        <Filter size={14} />
        <span style={{ fontSize: '10px', lineHeight: 1, whiteSpace: 'nowrap' }}>
          {activeFilterCount > 0 ? `Фильтры (${activeFilterCount})` : 'Фильтры'}
        </span>
      </button>

      {/* Reset filters */}
      {activeFilterCount > 0 && (
        <button
          onClick={onResetFilters}
          style={getBtnStyle(t)}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = t.hov; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = t.base; }}
        >
          <RotateCcw size={14} />
          <span style={{ fontSize: '10px', lineHeight: 1 }}>Сбросить</span>
        </button>
      )}

      {/* Close */}
      <button
        onClick={onClose}
        style={getBtnStyle(t)}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = t.hov; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = t.base; }}
      >
        <X size={14} />
        <span style={{ fontSize: '10px', lineHeight: 1 }}>Закрыть</span>
      </button>
    </div>
  );
};

// ─── ModalFilterPanel ─────────────────────────────────────────────────────────

interface ModalFilterPanelProps {
  isDark:          boolean;
  headers:         Array<{ text: string; colIndex: number }>;
  activeFilters:   Map<string, Set<string>>;
  uniqueValues:    Map<string, string[]>;
  onFilterChange:  (col: string, val: string, checked: boolean) => void;
  visibleColumns:  Set<string>;
  onColumnToggle:  (col: string) => void;
}

const ModalFilterPanel: React.FC<ModalFilterPanelProps> = ({
  isDark, headers, activeFilters, uniqueValues, onFilterChange, visibleColumns, onColumnToggle,
}) => {
  const bg           = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const border       = isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.1)';
  const labelColor   = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
  const activeItemBg = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)';
  const activeItemBr = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)';
  const itemColor    = isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.7)';
  const itemActiveC  = isDark ? '#fff'                   : '#000';

  const labelStyle: React.CSSProperties = {
    fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.07em', color: labelColor, marginBottom: '6px',
  };

  const getItemStyle = (active: boolean): React.CSSProperties => ({
    display:      'flex',
    alignItems:   'center',
    gap:          '5px',
    padding:      '3px 8px',
    borderRadius: '6px',
    cursor:       'pointer',
    fontSize:     '12px',
    whiteSpace:   'nowrap',
    background:   active ? activeItemBg : 'transparent',
    border:       `1px solid ${active ? activeItemBr : 'transparent'}`,
    color:        active ? itemActiveC : itemColor,
  });

  return (
    <div style={{
      background:   bg,
      borderBottom: `1px solid ${border}`,
      padding:      '12px 14px',
      maxHeight:    '220px',
      overflowY:    'auto',
      flexShrink:   0,
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>

        {/* Column visibility */}
        <div>
          <p style={labelStyle}>Колонки</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {headers.map((h) => {
              const visible = visibleColumns.has(h.text);
              return (
                <label key={h.colIndex} style={getItemStyle(visible)}>
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={() => onColumnToggle(h.text)}
                    style={{ cursor: 'pointer' }}
                  />
                  {h.text}
                </label>
              );
            })}
          </div>
        </div>

        {/* Per-column value filters */}
        {headers.map((h) => {
          const values    = uniqueValues.get(h.text) ?? [];
          if (values.length === 0) return null;
          const activeSet = activeFilters.get(h.text) ?? new Set<string>();
          return (
            <div key={h.colIndex}>
              <p style={labelStyle}>{h.text}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '130px', overflowY: 'auto' }}>
                {values.map((val) => {
                  const active = activeSet.has(val);
                  return (
                    <label key={val} style={getItemStyle(active)}>
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={(e) => onFilterChange(h.text, val, e.target.checked)}
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
    () => new Set(parsedTable.headers.map((h) => h.text))
  );

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
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const uniqueValues = useMemo(() => {
    const map = new Map<string, string[]>();
    parsedTable.headers.forEach((h) => {
      map.set(h.text, getUniqueValuesForColumn(parsedTable.rows, h.text));
    });
    return map;
  }, [parsedTable]);

  const filteredRows = useMemo(
    () => filterRows(parsedTable.rows, searchQuery, activeFilters, visibleColumns),
    [parsedTable.rows, searchQuery, activeFilters, visibleColumns]
  );

  const handleFilterChange = (column: string, value: string, checked: boolean) => {
    setActiveFilters((prev) => {
      const next = new Map(prev);
      const set  = new Set(next.get(column) ?? []);
      if (checked) { set.add(value); } else { set.delete(value); }
      if (set.size === 0) { next.delete(column); } else { next.set(column, set); }
      return next;
    });
  };

  const handleResetFilters = () => {
    setActiveFilters(new Map());
    setSearchQuery('');
  };

  const handleColumnToggle = (col: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(col)) { next.delete(col); } else { next.add(col); }
      return next;
    });
  };

  const activeFilterCount = Array.from(activeFilters.values()).filter((s) => s.size > 0).length;

  useEffect(() => {
    if (!isOpen) return;
    const onKey     = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const dialog    = dialogRef.current;
    const onBdClick = (e: MouseEvent) => {
      if (!dialog) return;
      const r = dialog.getBoundingClientRect();
      const inside =
        r.top  <= e.clientY && e.clientY <= r.top  + r.height &&
        r.left <= e.clientX && e.clientX <= r.left + r.width;
      if (!inside) onClose();
    };
    document.addEventListener('keydown', onKey);
    dialog?.addEventListener('click', onBdClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      dialog?.removeEventListener('click', onBdClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      aria-label="Модальное окно таблицы"
      aria-modal="true"
      className={`fixed inset-0 z-[100] flex items-center justify-center w-full h-full max-w-none max-h-none p-0 border-0 ${isDark ? 'bg-black/80' : 'bg-white/80'}`}
    >
      <div
        className={`relative rounded-lg shadow-2xl flex flex-col overflow-hidden ${isDark ? 'bg-[#1a1a1a]' : 'bg-[#E8E7E3]'}`}
        style={{
          width:     'fit-content',
          minWidth:  '40vw',
          maxWidth:  '95vw',
          height:    'auto',
          maxHeight: '95vh',
        }}
      >
        <ModalToolbar
          isDark={isDark}
          tableHtml={tableHtml}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters((v) => !v)}
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