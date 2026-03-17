import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Filter, RotateCcw, Copy, Check, ChevronDown, Search } from 'lucide-react';
import { createPortal } from 'react-dom';
import { ModalTableContent } from './ModalTableContent';
import { parseTableFromHTML, filterRows, getUniqueValuesForColumn } from '../utils/tableModalUtils';
import { FiltersPanel } from './FiltersPanel';
import { ColumnsPanel } from './ColumnsPanel';

interface TableModalProps {
  isOpen: boolean;
  tableHtml: string;
  isDark: boolean;
  onClose: () => void;
}

type CopyFormat = 'md' | 'excel';

function tk(isDark: boolean) {
  return isDark ? {
    modalBg:  '#0a0a0a',    // exact app color
    barBg:    '#111111',    // pure neutral
    border:   'rgba(255,255,255,0.08)',
    btnBg:    'rgba(255,255,255,0.08)',
    btnBdr:   'rgba(255,255,255,0.12)',
    btnHov:   'rgba(255,255,255,0.14)',
    btnClr:   'rgba(255,255,255,0.72)',
    btnActBg: 'rgba(255,255,255,0.15)',
    btnActBdr:'rgba(255,255,255,0.22)',
    btnActClr:'#ffffff',
    inpBg:    '#1a1a1a',    // pure neutral, no blue
    inpBdr:   'rgba(255,255,255,0.12)',
    inpFoc:   'rgba(255,255,255,0.26)',
    inpClr:   'rgba(255,255,255,0.88)',
    plhClr:   'rgba(255,255,255,0.28)',
    dangerClr:'#f87171',
    footerClr:'rgba(255,255,255,0.22)',
    dropBg:   '#1a1a1a',
    dropBdr:  'rgba(255,255,255,0.1)',
    dropHov:  'rgba(255,255,255,0.07)',
    dropClr:  'rgba(255,255,255,0.82)',
    dropSub:  'rgba(255,255,255,0.35)',
  } : {
    modalBg:  '#E8E7E3',    // exact app color
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
    dropBdr:  'rgba(0,0,0,0.1)',
    dropHov:  'rgba(0,0,0,0.06)',
    dropClr:  'rgba(0,0,0,0.82)',
    dropSub:  'rgba(0,0,0,0.38)',
  };
}

function parseForCopy(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const tbl = doc.querySelector('table');
  if (!tbl) return { headers: [] as string[], rows: [] as string[][] };
  return {
    headers: Array.from(tbl.querySelectorAll('thead th')).map(th => (th.textContent ?? '').trim()),
    rows: Array.from(tbl.querySelectorAll('tbody tr')).map(tr =>
      Array.from(tr.querySelectorAll('td')).map(td => (td.textContent ?? '').trim())
    ),
  };
}
function toMd(h: string[], rows: string[][]) {
  if (!h.length) return '';
  const e = (s: string) => s.replaceAll('|', String.raw`\|`);
  return [`| ${h.map(e).join(' | ')} |`, `| ${h.map(() => '---').join(' | ')} |`,
    ...rows.map(r => `| ${r.map(e).join(' | ')} |`)].join('\n');
}
function toTsv(h: string[], rows: string[][]) {
  return !h.length ? '' : [h.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
}

// ─── Pill button ─────────────────────────────────────────────────────────────
const Pill: React.FC<{
  onClick: () => void; title: string; label: string;
  icon: React.ReactNode; t: ReturnType<typeof tk>;
  active?: boolean; danger?: boolean; green?: boolean;
}> = ({ onClick, title, label, icon, t, active, danger, green }) => {
  const bg    = green ? (t.modalBg === '#0a0a0a' ? 'rgba(34,197,94,0.16)' : 'rgba(34,197,94,0.14)')
              : active ? t.btnActBg : t.btnBg;
  const bdr   = green ? (t.modalBg === '#0a0a0a' ? 'rgba(34,197,94,0.4)' : 'rgba(34,197,94,0.5)')
              : active ? t.btnActBdr : t.btnBdr;
  const color = green ? '#22c55e' : danger ? t.dangerClr : active ? t.btnActClr : t.btnClr;
  return (
    <button onClick={onClick} title={title} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 3,
      padding: '5px 12px', minWidth: 52, height: 44,
      borderRadius: 8, border: `1px solid ${bdr}`,
      background: bg, color, cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
    }}
      onMouseEnter={e => { if (!green) (e.currentTarget as HTMLButtonElement).style.background = t.btnHov; }}
      onMouseLeave={e => { if (!green) (e.currentTarget as HTMLButtonElement).style.background = bg; }}
    >
      {icon}
      <span style={{ fontSize: 10, fontWeight: active || green ? 600 : 400, lineHeight: 1, whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  );
};

// ─── Copy button ─────────────────────────────────────────────────────────────
const CopyBtn: React.FC<{ isDark: boolean; tableHtml: string; t: ReturnType<typeof tk> }> = ({ isDark, tableHtml, t }) => {
  const [open, setOpen]     = useState(false);
  const [copied, setCopied] = useState<CopyFormat | null>(null);
  const [pos, setPos]       = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLButtonElement>(null);
  const isCopied = !!copied;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!(e.target as Node)?.isEqualNode?.(ref.current) && !ref.current?.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const toggle = () => {
    if (open) { setOpen(false); return; }
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ top: r.bottom + 6, left: Math.min(r.left, window.innerWidth - 202) });
    setOpen(true);
  };

  const doCopy = async (fmt: CopyFormat) => {
    const { headers, rows } = parseForCopy(tableHtml);
    await navigator.clipboard.writeText(fmt === 'md' ? toMd(headers, rows) : toTsv(headers, rows));
    setCopied(fmt); setOpen(false);
    setTimeout(() => setCopied(null), 2000);
  };

  const bg    = isCopied ? (isDark ? 'rgba(34,197,94,0.16)' : 'rgba(34,197,94,0.14)') : t.btnBg;
  const bdr   = isCopied ? (isDark ? 'rgba(34,197,94,0.4)'  : 'rgba(34,197,94,0.5)')  : t.btnBdr;
  const color = isCopied ? '#22c55e' : t.btnClr;

  return (
    <>
      <button ref={ref} onClick={toggle} title="Копировать" style={{
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

      {open && createPortal(
        <>
          <style>{`@keyframes mdIn{from{opacity:0;transform:translateY(-5px) scale(0.97)}to{opacity:1;transform:none}}`}</style>
          <div style={{
            position: 'fixed', top: pos.top, left: pos.left,
            minWidth: 190, zIndex: 99999,
            background: t.dropBg, border: `1px solid ${t.dropBdr}`,
            borderRadius: 10,
            boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.8)' : '0 8px 28px rgba(0,0,0,0.16)',
            overflow: 'hidden', animation: 'mdIn 0.13s cubic-bezier(0.2,0,0,1)',
          }}>
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
          </div>
        </>,
        document.body,
      )}
    </>
  );
};

// ─── TableModal ───────────────────────────────────────────────────────────────
const TableModal: React.FC<TableModalProps> = ({ isOpen, tableHtml, isDark, onClose }) => {
  const [searchQuery,   setSearchQuery]   = useState('');
  const [showFilters,   setShowFilters]   = useState(false);
  const [activeFilters, setActiveFilters] = useState<Map<string, Set<string>>>(new Map());
  const dialogRef = useRef<HTMLDialogElement>(null);
  const t = tk(isDark);

  const parsedTable = useMemo(() => parseTableFromHTML(tableHtml), [tableHtml]);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    () => new Set(parsedTable.headers.map(h => h.text))
  );

  const headersKey = parsedTable.headers.map(h => h.text).join(',');
  useEffect(() => {
    setVisibleColumns(new Set(parsedTable.headers.map(h => h.text)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headersKey]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) { dialog.showModal(); document.body.style.overflow = 'hidden'; }
    else { dialog.close(); document.body.style.overflow = 'unset'; }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const uniqueValues = useMemo(() => {
    const map = new Map<string, string[]>();
    parsedTable.headers.forEach(h => map.set(h.text, getUniqueValuesForColumn(parsedTable.rows, h.text)));
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
      if (checked) set.add(value); else set.delete(value);
      if (set.size === 0) next.delete(column); else next.set(column, set);
      return next;
    });
  };

  const handleReset = () => { setActiveFilters(new Map()); setSearchQuery(''); };
  const activeFilterCount = Array.from(activeFilters.values()).filter(s => s.size > 0).length;

  // Convert for FiltersPanel (Map<number, Set<string>>)
  const filtersForPanel = useMemo(() => {
    const m = new Map<number, Set<string>>();
    parsedTable.headers.forEach((h, i) => {
      const s = activeFilters.get(h.text);
      if (s?.size) m.set(i, s);
    });
    return m;
  }, [activeFilters, parsedTable.headers]);

  const modalHeaders = parsedTable.headers.map(h => h.text);
  const getUniqueForCol = (colIndex: number) => {
    const h = parsedTable.headers[colIndex];
    return h ? (uniqueValues.get(h.text) ?? []) : [];
  };
  const toggleByIndex = (colIndex: number, value: string) => {
    const h = parsedTable.headers[colIndex];
    if (!h) return;
    const cur = activeFilters.get(h.text) ?? new Set<string>();
    handleFilterChange(h.text, value, !cur.has(value));
  };

  const filterLabel = activeFilterCount > 0 ? `Фильтры · ${activeFilterCount}` : 'Фильтры';

  if (!isOpen) return null;

  return (
    <dialog ref={dialogRef} aria-label="Таблица — полный экран" aria-modal="true"
      style={{ position: 'fixed', inset: 0, zIndex: 100, width: '100%', height: '100%', maxWidth: 'none', maxHeight: 'none', padding: 0, margin: 0, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {/* Blur backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0,
        background: isDark ? 'rgba(0,0,0,0.45)' : 'rgba(180,178,174,0.55)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 0,
      }} />

      {/* Modal — flex column, no extra space */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: 'min(95vw, 1400px)',
        maxHeight: '90vh',
        borderRadius: 14,
        border: `1px solid ${t.border}`,
        background: t.modalBg,
        boxShadow: isDark
          ? '0 24px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.05)'
          : '0 24px 80px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        // height fits content — no fixed height causing empty space
        overflow: 'hidden',
      }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderBottom: `1px solid ${t.border}`, background: t.barBg, flexWrap: 'nowrap', minWidth: 0, flexShrink: 0 }}>
          <div style={{ position: 'relative', flex: '1 1 0', minWidth: 0 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: t.plhClr, pointerEvents: 'none' }} />
            <input type="text" placeholder="Поиск..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '0 30px 0 30px', height: 36, borderRadius: 8, border: `1px solid ${t.inpBdr}`, background: t.inpBg, color: t.inpClr, fontSize: 13, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
              onFocus={e => { (e.target as HTMLInputElement).style.borderColor = t.inpFoc; }}
              onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = t.inpBdr; }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: t.plhClr, display: 'flex' }}>
                <X size={12} />
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <CopyBtn isDark={isDark} tableHtml={tableHtml} t={t} />
            <Pill onClick={() => setShowFilters(v => !v)} title="Фильтры" label={filterLabel} icon={<Filter size={14} />} t={t} active={showFilters || activeFilterCount > 0} />
            {activeFilterCount > 0 && <Pill onClick={handleReset} title="Сбросить" label="Сбросить" icon={<RotateCcw size={14} />} t={t} danger />}
            <Pill onClick={onClose} title="Закрыть (Esc)" label="Закрыть" icon={<X size={14} />} t={t} />
          </div>
        </div>

        {/* Filters (only when open) */}
        {showFilters && (
          <>
            <FiltersPanel isDark={isDark} headers={modalHeaders} filters={filtersForPanel} onToggleFilter={toggleByIndex} getUniqueValuesForColumn={getUniqueForCol} />
            <ColumnsPanel isDark={isDark} headers={modalHeaders}
              visibleColumns={new Set(parsedTable.headers.map((h, i) => visibleColumns.has(h.text) ? i : -1).filter(i => i >= 0))}
              onToggleColumn={i => { const h = parsedTable.headers[i]; if (h) { setVisibleColumns(prev => { const next = new Set(prev); if (next.has(h.text)) next.delete(h.text); else next.add(h.text); return next; }); } }}
            />
          </>
        )}

        {/* Table — flex: 1 so it fills remaining space */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          <ModalTableContent isDark={isDark} headers={parsedTable.headers} filteredRows={filteredRows} visibleColumns={visibleColumns} />
        </div>

        {/* Footer */}
        <div style={{ padding: '6px 12px', flexShrink: 0, borderTop: `1px solid ${t.border}`, fontSize: 11, color: t.footerClr, display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none', background: t.modalBg }}>
          <span>{filteredRows.length === parsedTable.rows.length ? `${parsedTable.rows.length} строк` : `${filteredRows.length} из ${parsedTable.rows.length} строк`}</span>
          {activeFilterCount > 0 && <span>{activeFilterCount} фильтра активно</span>}
        </div>
      </div>
    </dialog>
  );
};

export default TableModal;