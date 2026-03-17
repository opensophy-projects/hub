import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Filter, X, Maximize2, Copy, Check, ChevronDown, Search } from 'lucide-react';

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

// ─── Copy helpers ─────────────────────────────────────────────────────────────

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
  const esc  = (s: string) => s.replaceAll('|', String.raw`\|`);
  const head = `| ${headers.map(esc).join(' | ')} |`;
  const div  = `| ${headers.map(() => '---').join(' | ')} |`;
  return [head, div, ...rows.map(r => `| ${r.map(esc).join(' | ')} |`)].join('\n');
}

function toExcelTsv(headers: string[], rows: string[][]): string {
  if (!headers.length) return '';
  return [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
}

type CopyFormat = 'md' | 'excel';

// ─── CopyButton ───────────────────────────────────────────────────────────────

const CopyButton: React.FC<{ isDark: boolean; tableHtml: string }> = ({ isDark, tableHtml }) => {
  const [open,    setOpen]    = useState(false);
  const [copied,  setCopied]  = useState<CopyFormat | null>(null);
  const [pos,     setPos]     = useState({ top: 0, left: 0 });
  const btnRef  = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const toggle = () => {
    if (open) { setOpen(false); return; }
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: Math.min(r.left, window.innerWidth - 192) });
    setOpen(true);
  };

  const doCopy = async (fmt: CopyFormat) => {
    const { headers, rows } = parseTableForCopy(tableHtml);
    const text = fmt === 'md' ? toMarkdownTable(headers, rows) : toExcelTsv(headers, rows);
    await navigator.clipboard.writeText(text);
    setCopied(fmt); setOpen(false);
    setTimeout(() => setCopied(null), 2000);
  };

  const isCopied = copied !== null;

  const accent = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(15,15,20,0.9)';
  const dimmed = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(15,15,20,0.45)';
  const btnBg  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,15,20,0.05)';
  const btnHov = isDark ? 'rgba(255,255,255,0.11)' : 'rgba(15,15,20,0.09)';
  const border = isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(15,15,20,0.1)';

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        title="Копировать"
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '0 11px', height: 34, borderRadius: 8,
          border: `1px solid ${border}`,
          background: isCopied ? (isDark ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.1)') : btnBg,
          color: isCopied ? '#22c55e' : accent,
          cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
          fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { if (!isCopied) (e.currentTarget as HTMLButtonElement).style.background = btnHov; }}
        onMouseLeave={e => { if (!isCopied) (e.currentTarget as HTMLButtonElement).style.background = btnBg; }}
      >
        {isCopied ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} />}
        <span>{isCopied ? 'Скопировано' : 'Копировать'}</span>
        <ChevronDown size={11} style={{ opacity: 0.5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', marginLeft: 1 }} />
      </button>

      {open && createPortal(
        <div ref={menuRef} style={{
          position: 'fixed', top: pos.top, left: pos.left,
          width: 186, zIndex: 9999,
          background: isDark ? '#181818' : '#fafaf8',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,15,20,0.1)'}`,
          borderRadius: 10,
          boxShadow: isDark ? '0 12px 36px rgba(0,0,0,0.6)' : '0 12px 36px rgba(0,0,0,0.12)',
          overflow: 'hidden',
          animation: 'tbMenuIn 0.13s cubic-bezier(0.2,0,0,1)',
        }}>
          <style>{`@keyframes tbMenuIn{from{opacity:0;transform:translateY(-6px) scale(0.96)}to{opacity:1;transform:none}}`}</style>
          {[
            { fmt: 'md'    as CopyFormat, label: 'Markdown',     sub: 'Для документов' },
            { fmt: 'excel' as CopyFormat, label: 'Excel / TSV',  sub: 'Tab-separated'  },
          ].map(({ fmt, label, sub }) => (
            <button key={fmt} onClick={() => doCopy(fmt)}
              style={{
                width: '100%', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 1,
                border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left',
                color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(15,15,20,0.8)',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,15,20,0.05)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(15,15,20,0.4)' }}>{sub}</span>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
};

// ─── IconBtn ──────────────────────────────────────────────────────────────────

const IconBtn: React.FC<{
  onClick: () => void; title: string; label: string;
  icon: React.ReactNode; isDark: boolean; active?: boolean; danger?: boolean;
}> = ({ onClick, title, label, icon, isDark, active, danger }) => {
  const border  = isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(15,15,20,0.1)';
  const base    = isDark ? 'rgba(255,255,255,0.06)'  : 'rgba(15,15,20,0.05)';
  const hov     = isDark ? 'rgba(255,255,255,0.11)'  : 'rgba(15,15,20,0.09)';
  const actBg   = isDark ? 'rgba(255,255,255,0.13)'  : 'rgba(15,15,20,0.1)';
  const actClr  = isDark ? '#ffffff'                 : '#0f0f14';
  const normClr = isDark ? 'rgba(255,255,255,0.65)'  : 'rgba(15,15,20,0.6)';
  const dangerC = '#f87171';

  const bg    = active ? actBg  : base;
  const color = danger ? dangerC : active ? actClr : normClr;

  return (
    <button onClick={onClick} title={title} style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '0 11px', height: 34, borderRadius: 8,
      border: `1px solid ${active ? (isDark ? 'rgba(255,255,255,0.18)' : 'rgba(15,15,20,0.16)') : border}`,
      background: bg, color,
      cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
      fontSize: 13, fontWeight: active ? 500 : 400, whiteSpace: 'nowrap',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = hov; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = bg; }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

// ─── TableControlsBar ─────────────────────────────────────────────────────────

export const TableControlsBar: React.FC<TableControlsBarProps> = ({
  isDark, searchQuery, onSearchChange,
  showFilters, onToggleFilters, activeFilterCount, onResetFilters,
  onFullscreen, tableHtml,
}) => {
  const border     = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,15,20,0.07)';
  const inputBg    = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,15,20,0.04)';
  const inputBdr   = isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(15,15,20,0.1)';
  const inputClr   = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(15,15,20,0.85)';
  const placeholdr = isDark ? 'rgba(255,255,255,0.3)'  : 'rgba(15,15,20,0.3)';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '10px 12px',
      borderBottom: `1px solid ${border}`,
      flexWrap: 'nowrap',
      minWidth: 0,
    }}>
      {/* Search */}
      <div style={{ position: 'relative', flex: '1 1 0', minWidth: 0 }}>
        <Search size={13} style={{
          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
          color: placeholdr, pointerEvents: 'none',
        }} />
        <input
          type="text"
          placeholder="Поиск..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          style={{
            width: '100%', padding: '0 10px 0 30px', height: 34,
            borderRadius: 8, border: `1px solid ${inputBdr}`,
            background: inputBg, color: inputClr,
            fontSize: 13, outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => { (e.target as HTMLInputElement).style.borderColor = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(15,15,20,0.25)'; }}
          onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = inputBdr; }}
        />
        {searchQuery && (
          <button onClick={() => onSearchChange('')} style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', padding: 2,
            color: placeholdr, display: 'flex', alignItems: 'center',
          }}>
            <X size={12} />
          </button>
        )}
      </div>

      {/* Buttons — never wrap */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <CopyButton isDark={isDark} tableHtml={tableHtml} />

        <IconBtn
          onClick={onToggleFilters}
          title="Фильтры и колонки"
          label={activeFilterCount > 0 ? `Фильтры · ${activeFilterCount}` : 'Фильтры'}
          icon={<Filter size={13} />}
          isDark={isDark}
          active={showFilters || activeFilterCount > 0}
        />

        {activeFilterCount > 0 && (
          <IconBtn
            onClick={onResetFilters}
            title="Сбросить фильтры"
            label="Сбросить"
            icon={<X size={13} />}
            isDark={isDark}
            danger
          />
        )}

        <IconBtn
          onClick={onFullscreen}
          title="Развернуть таблицу"
          label="На весь экран"
          icon={<Maximize2 size={13} />}
          isDark={isDark}
        />
      </div>
    </div>
  );
};