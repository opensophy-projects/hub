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
  readonly tableHtml: string;
}

// ─── Theme tokens ─────────────────────────────────────────────────────────────

interface ThemeTokens {
  border:      string;
  bg:          string;
  bgHover:     string;
  color:       string;
  activeBg:    string;
  activeColor: string;
  menuBg:      string;
  menuBorder:  string;
  itemHover:   string;
  itemColor:   string;
}

function getThemeTokens(isDark: boolean): ThemeTokens {
  return isDark
    ? {
        border:      'rgba(255,255,255,0.1)',
        bg:          'rgba(255,255,255,0.07)',
        bgHover:     'rgba(255,255,255,0.18)',
        color:       'rgba(255,255,255,0.75)',
        activeBg:    'rgba(255,255,255,0.15)',
        activeColor: '#ffffff',
        menuBg:      '#1a1a1a',
        menuBorder:  'rgba(255,255,255,0.12)',
        itemHover:   'rgba(255,255,255,0.08)',
        itemColor:   'rgba(255,255,255,0.85)',
      }
    : {
        border:      'rgba(0,0,0,0.15)',
        bg:          '#E8E7E3',
        bgHover:     '#ddd8cd',
        color:       'rgba(0,0,0,0.75)',
        activeBg:    'rgba(0,0,0,0.12)',
        activeColor: '#000000',
        menuBg:      '#f5f4f0',
        menuBorder:  'rgba(0,0,0,0.12)',
        itemHover:   'rgba(0,0,0,0.06)',
        itemColor:   'rgba(0,0,0,0.8)',
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

function toMarkdownTable(headers: string[], rows: string[][]): string {
  if (!headers.length) return '';

  const escPipe = (s: string) => s.replaceAll('|', String.raw`\|`);
  const sep     = headers.map(() => '---').join(' | ');
  const head    = `| ${headers.map(escPipe).join(' | ')} |`;
  const divider = `| ${sep} |`;
  const bodyLines = rows.map((r) => `| ${r.map(escPipe).join(' | ')} |`);

  return [head, divider, ...bodyLines].join('\n');
}

function toExcelTsv(headers: string[], rows: string[][]): string {
  if (!headers.length) return '';
  return [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
}

// ─── useCopyState ─────────────────────────────────────────────────────────────

type CopyFormat = 'md' | 'excel';

function useCopyState(tableHtml: string) {
  const [copied, setCopied] = useState<CopyFormat | null>(null);

  const doCopy = async (format: CopyFormat) => {
    const { headers, rows } = parseTableForCopy(tableHtml);
    const text = format === 'md' ? toMarkdownTable(headers, rows) : toExcelTsv(headers, rows);
    await navigator.clipboard.writeText(text);
    setCopied(format);
    setTimeout(() => setCopied(null), 2000);
  };

  return { copied, doCopy };
}

// ─── CopyButton ───────────────────────────────────────────────────────────────

const COPY_OPTIONS: Array<{ format: CopyFormat; label: string; sub: string }> = [
  { format: 'md',    label: 'Markdown',        sub: 'Для документов'     },
  { format: 'excel', label: 'Excel / таблица', sub: 'TSV (Tab-separated)' },
];

const CopyButton: React.FC<{ isDark: boolean; tableHtml: string }> = ({ isDark, tableHtml }) => {
  const [open, setOpen] = useState(false);
  const [dropLeft, setDropLeft] = useState(false);
  const btnRef  = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const t = getThemeTokens(isDark);

  // Close dropdown on outside click
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

  // Determine if dropdown should open to the left or right
  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const menuWidth = 180;
      // If not enough space on the right, open to the left
      const spaceOnRight = window.innerWidth - rect.right;
      setDropLeft(spaceOnRight < menuWidth);
    }
    setOpen((v) => !v);
  };

  const { copied, doCopy } = useCopyState(tableHtml);
  const isCopied = copied !== null;

  const copyBg = getCopyButtonBg(isCopied, isDark, t.bg);

  const handleOptionClick = async (format: CopyFormat) => {
    await doCopy(format);
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        ref={btnRef}
        title="Копировать таблицу"
        onClick={handleToggle}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: '2px', padding: '6px 10px', borderRadius: '8px',
          border: `1px solid ${t.border}`,
          background: copyBg,
          color: isCopied ? '#22c55e' : t.color,
          cursor: 'pointer', transition: 'all 0.15s', fontSize: '12px',
        }}
        onMouseEnter={(e) => { if (!isCopied) (e.currentTarget as HTMLButtonElement).style.background = t.bgHover; }}
        onMouseLeave={(e) => { if (!isCopied) (e.currentTarget as HTMLButtonElement).style.background = t.bg; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          {isCopied ? <Check size={14} /> : <Copy size={14} />}
          <ChevronDown
            size={11}
            style={{ opacity: 0.6, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
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
            position: 'absolute', top: 'calc(100% + 5px)',
            // Dynamically position: right-align by default, left-align if near right edge
            ...(dropLeft ? { left: 0 } : { right: 0 }),
            minWidth: '180px', background: t.menuBg,
            border: `1px solid ${t.menuBorder}`,
            borderRadius: '10px',
            boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.7)' : '0 8px 24px rgba(0,0,0,0.14)',
            zIndex: 200, overflow: 'hidden', animation: 'copyMenuIn 0.12s ease',
          }}
        >
          <style>{`
            @keyframes copyMenuIn {
              from { opacity: 0; transform: translateY(-4px) scale(0.97); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
          {COPY_OPTIONS.map(({ format, label, sub }) => (
            <button
              key={format}
              onClick={() => handleOptionClick(format)}
              style={{
                display: 'flex', flexDirection: 'column', gap: '1px',
                width: '100%', padding: '9px 13px',
                border: 'none', background: 'transparent',
                cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.1s', color: t.itemColor,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = t.itemHover; }}
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

function getCopyButtonBg(isCopied: boolean, isDark: boolean, defaultBg: string): string {
  if (!isCopied) return defaultBg;
  return isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.12)';
}

// ─── ToolbarButton ────────────────────────────────────────────────────────────

interface ToolbarButtonProps {
  readonly onClick: () => void;
  readonly title: string;
  readonly label: string;
  readonly icon: React.ReactNode;
  readonly isDark: boolean;
  readonly active?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick, title, label, icon, isDark, active = false,
}) => {
  const t = getThemeTokens(isDark);
  const bg    = active ? t.activeBg    : t.bg;
  const color = active ? t.activeColor : t.color;

  return (
    <button
      onClick={onClick}
      title={title}
      style={{ background: bg, color, border: `1px solid ${t.border}` }}
      className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors flex-shrink-0"
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = t.bgHover; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = bg; }}
    >
      {icon}
      <span className="leading-none whitespace-nowrap" style={{ fontSize: '10px' }}>{label}</span>
    </button>
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
        className={`flex-1 min-w-0 px-3 py-2 rounded-lg text-sm transition-colors focus:outline-none ${
          isDark
            ? 'bg-white/10 border border-white/20 text-white placeholder-white/50 focus:bg-white/15 focus:border-white/40'
            : 'bg-[#E8E7E3] border border-black/20 text-black placeholder-black/50 focus:border-black/40'
        }`}
      />

      {/* Buttons row — wrapped tightly, copy button first so dropdown goes right */}
      <div className="flex items-center gap-2 flex-shrink-0">
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
    </div>
  );
};