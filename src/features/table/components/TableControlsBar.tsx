import React, { useState, useRef, useEffect } from 'react';
import { Filter, X, Maximize2, Copy, Check, ChevronDown } from 'lucide-react';

// ─── Props ────────────────────────────────────────────────────────────────────

interface TableControlsBarProps {
  readonly isDark: boolean;
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly showFilters: boolean;
  readonly onToggleFilters: () => void;
  readonly activeFilterCount: number;
  readonly onResetFilters: () => void;
  readonly onFullscreen: () => void;
  // raw HTML of the table — used for copy
  readonly tableHtml: string;
}

// ─── ToolbarButton ────────────────────────────────────────────────────────────

interface ToolbarButtonProps {
  readonly onClick: () => void;
  readonly title: string;
  readonly label: string;
  readonly icon: React.ReactNode;
  readonly isDark: boolean;
  readonly active?: boolean;
  readonly btnRef?: React.RefObject<HTMLButtonElement>;
}

function getToolbarButtonBg(isDark: boolean, active: boolean): string {
  if (active) return isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
  return isDark ? 'rgba(255,255,255,0.07)' : '#E8E7E3';
}

function getToolbarButtonColor(isDark: boolean, active: boolean): string {
  if (active) return isDark ? '#ffffff' : '#000000';
  return isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)';
}

function ToolbarButton({ onClick, title, label, icon, isDark, active = false, btnRef }: ToolbarButtonProps) {
  const border  = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)';
  const bg      = getToolbarButtonBg(isDark, active);
  const bgHover = isDark ? 'rgba(255,255,255,0.18)' : '#ddd8cd';
  const color   = getToolbarButtonColor(isDark, active);

  return (
    <button
      ref={btnRef}
      onClick={onClick}
      title={title}
      style={{ background: bg, color, border: `1px solid ${border}` }}
      className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors flex-shrink-0"
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = bgHover; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = bg; }}
    >
      {icon}
      <span className="leading-none whitespace-nowrap" style={{ fontSize: '10px' }}>{label}</span>
    </button>
  );
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

function toMarkdownTable(headers: string[], rows: string[][]): string {
  if (!headers.length) return '';
  const escape = (s: string) => s.replace(/\|/g, '\\|');
  const sep    = headers.map(() => '---').join(' | ');
  const head   = headers.map(escape).join(' | ');
  const body   = rows.map((r) => r.map(escape).join(' | ')).join('\n');
  return `| ${head} |\n| ${sep} |\n${body.split('\n').map(r => `| ${r} |`).join('\n')}`;
}

function toExcelTsv(headers: string[], rows: string[][]): string {
  if (!headers.length) return '';
  const lines = [headers.join('\t'), ...rows.map((r) => r.join('\t'))];
  return lines.join('\n');
}

// ─── CopyButton — dropdown with two options ───────────────────────────────────

const CopyButton: React.FC<{ isDark: boolean; tableHtml: string }> = ({ isDark, tableHtml }) => {
  const [open,   setOpen]   = useState(false);
  const [copied, setCopied] = useState<'md' | 'excel' | null>(null);
  const btnRef  = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current  && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const doCopy = async (format: 'md' | 'excel') => {
    const { headers, rows } = parseTableForCopy(tableHtml);
    const text = format === 'md' ? toMarkdownTable(headers, rows) : toExcelTsv(headers, rows);
    await navigator.clipboard.writeText(text);
    setCopied(format);
    setOpen(false);
    setTimeout(() => setCopied(null), 2000);
  };

  const border    = isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.15)';
  const bg        = isDark ? 'rgba(255,255,255,0.07)' : '#E8E7E3';
  const bgHover   = isDark ? 'rgba(255,255,255,0.18)' : '#ddd8cd';
  const color     = isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)';
  const menuBg    = isDark ? '#1a1a1a'                : '#f5f4f0';
  const menuBorder= isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
  const itemHov   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const itemColor = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)';

  const isCopied = copied !== null;

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {/* Main button */}
      <button
        ref={btnRef}
        title="Копировать таблицу"
        onClick={() => setOpen((v) => !v)}
        style={{
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           '2px',
          padding:       '6px 10px',
          borderRadius:  '8px',
          border:        `1px solid ${border}`,
          background:    isCopied ? (isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.12)') : bg,
          color:         isCopied ? '#22c55e' : color,
          cursor:        'pointer',
          transition:    'all 0.15s',
          fontSize:      '12px',
        }}
        onMouseEnter={e => { if (!isCopied) (e.currentTarget as HTMLButtonElement).style.background = bgHover; }}
        onMouseLeave={e => { if (!isCopied) (e.currentTarget as HTMLButtonElement).style.background = bg; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          {isCopied ? <Check size={14} /> : <Copy size={14} />}
          <ChevronDown
            size={11}
            style={{
              opacity:   0.6,
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition:'transform 0.15s',
            }}
          />
        </div>
        <span style={{ fontSize: '10px', lineHeight: 1, whiteSpace: 'nowrap' }}>
          {isCopied ? 'Скопировано!' : 'Копировать'}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          ref={menuRef}
          style={{
            position:     'absolute',
            top:          'calc(100% + 5px)',
            right:        0,
            minWidth:     '160px',
            background:   menuBg,
            border:       `1px solid ${menuBorder}`,
            borderRadius: '10px',
            boxShadow:    isDark
              ? '0 8px 24px rgba(0,0,0,0.7)'
              : '0 8px 24px rgba(0,0,0,0.14)',
            zIndex:       200,
            overflow:     'hidden',
            animation:    'copyMenuIn 0.12s ease',
          }}
        >
          <style>{`
            @keyframes copyMenuIn {
              from { opacity:0; transform:translateY(-4px) scale(0.97); }
              to   { opacity:1; transform:translateY(0) scale(1); }
            }
          `}</style>

          {[
            { format: 'md'    as const, label: 'Markdown',        sub: 'Для документов' },
            { format: 'excel' as const, label: 'Excel / таблица', sub: 'TSV (Tab-separated)' },
          ].map(({ format, label, sub }) => (
            <button
              key={format}
              onClick={() => doCopy(format)}
              style={{
                display:    'flex',
                flexDirection:'column',
                gap:        '1px',
                width:      '100%',
                padding:    '9px 13px',
                border:     'none',
                background: 'transparent',
                cursor:     'pointer',
                textAlign:  'left',
                transition: 'background 0.1s',
                color:      itemColor,
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
  );
};

// ─── TableControlsBar ─────────────────────────────────────────────────────────

export const TableControlsBar: React.FC<TableControlsBarProps> = ({
  isDark,
  searchQuery,
  onSearchChange,
  showFilters,
  onToggleFilters,
  activeFilterCount,
  onResetFilters,
  onFullscreen,
  tableHtml,
}) => {
  const filterLabel = activeFilterCount > 0 ? `Фильтры (${activeFilterCount})` : 'Фильтры';

  return (
    <div className={`flex flex-wrap items-center gap-2 p-3 border-b ${isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'}`}>
      <input
        type="text"
        placeholder="Поиск в таблице..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className={`flex-1 min-w-[200px] px-3 py-2 rounded-lg text-sm transition-colors focus:outline-none ${
          isDark
            ? 'bg-white/10 border border-white/20 text-white placeholder-white/50 focus:bg-white/15 focus:border-white/40'
            : 'bg-[#E8E7E3] border border-black/20 text-black placeholder-black/50 focus:border-black/40'
        }`}
      />

      <CopyButton isDark={isDark} tableHtml={tableHtml} />

      <ToolbarButton
        onClick={onToggleFilters}
        title="Фильтрация и колонки"
        label={filterLabel}
        icon={<Filter size={14} />}
        isDark={isDark}
        active={showFilters || activeFilterCount > 0}
      />

      {activeFilterCount > 0 && (
        <ToolbarButton
          onClick={onResetFilters}
          title="Сбросить фильтры"
          label="Сбросить"
          icon={<X size={14} />}
          isDark={isDark}
        />
      )}

      <ToolbarButton
        onClick={onFullscreen}
        title="Открыть в полном размере"
        label="Развернуть"
        icon={<Maximize2 size={14} />}
        isDark={isDark}
      />
    </div>
  );
};