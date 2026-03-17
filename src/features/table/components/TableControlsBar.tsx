import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Filter, X, Maximize2, Copy, Check, ChevronDown, Search, MoreHorizontal } from 'lucide-react';

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

// ─── Design tokens matching app palette ──────────────────────────────────────

function tk(isDark: boolean) {
  return {
    // App exact colors
    bg:        isDark ? '#0a0a0a' : '#E8E7E3',
    // Toolbar strip bg — slightly lifted from surface
    barBg:     isDark ? '#111113' : '#dddcd8',
    border:    isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,15,20,0.09)',
    // Buttons
    btnBg:     isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,15,20,0.07)',
    btnBdr:    isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(15,15,20,0.12)',
    btnHov:    isDark ? 'rgba(255,255,255,0.13)' : 'rgba(15,15,20,0.12)',
    btnClr:    isDark ? 'rgba(255,255,255,0.75)' : 'rgba(15,15,20,0.7)',
    btnActBg:  isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,15,20,0.11)',
    btnActBdr: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(15,15,20,0.2)',
    btnActClr: isDark ? '#ffffff'                : '#0f0f14',
    // Input
    inpBg:     isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,15,20,0.05)',
    inpBdr:    isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(15,15,20,0.1)',
    inpClr:    isDark ? 'rgba(255,255,255,0.85)' : 'rgba(15,15,20,0.85)',
    plhClr:    isDark ? 'rgba(255,255,255,0.28)' : 'rgba(15,15,20,0.3)',
    // Menu
    menuBg:    isDark ? '#181818' : '#f0efeb',
    menuBdr:   isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(15,15,20,0.1)',
    menuItmHov:isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,15,20,0.06)',
    menuItmClr:isDark ? 'rgba(255,255,255,0.8)'  : 'rgba(15,15,20,0.8)',
    menuSubClr:isDark ? 'rgba(255,255,255,0.35)' : 'rgba(15,15,20,0.4)',
  };
}

// ─── Pill button: icon on top, label below ────────────────────────────────────

interface PillBtnProps {
  onClick: () => void;
  title: string;
  label: string;
  icon: React.ReactNode;
  isDark: boolean;
  active?: boolean;
  danger?: boolean;
}

const PillBtn: React.FC<PillBtnProps> = ({ onClick, title, label, icon, isDark, active, danger }) => {
  const t = tk(isDark);
  const bg    = active ? t.btnActBg  : t.btnBg;
  const bdr   = active ? t.btnActBdr : t.btnBdr;
  const color = danger ? '#f87171' : active ? t.btnActClr : t.btnClr;

  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 3,
        padding: '6px 11px', minWidth: 52, height: 46,
        borderRadius: 9, border: `1px solid ${bdr}`,
        background: bg, color,
        cursor: 'pointer', flexShrink: 0,
        transition: 'all 0.14s', whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = t.btnHov; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = bg; }}
    >
      {icon}
      <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, lineHeight: 1 }}>{label}</span>
    </button>
  );
};

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
  return [`| ${headers.map(esc).join(' | ')} |`, `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map(r => `| ${r.map(esc).join(' | ')} |`)].join('\n');
}

function toExcelTsv(headers: string[], rows: string[][]): string {
  if (!headers.length) return '';
  return [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
}

type CopyFormat = 'md' | 'excel';

// ─── Portal menu (shared for copy dropdown + mobile overflow) ─────────────────

interface PortalMenuProps {
  pos: { top: number; left: number };
  isDark: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const PortalMenu: React.FC<PortalMenuProps> = ({ pos, isDark, onClose, children }) => {
  const t = tk(isDark);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  return createPortal(
    <>
      <style>{`@keyframes tbMenuIn{from{opacity:0;transform:translateY(-6px) scale(0.96)}to{opacity:1;transform:none}}`}</style>
      <div ref={ref} style={{
        position: 'fixed', top: pos.top, left: pos.left,
        minWidth: 190, zIndex: 9999,
        background: t.menuBg,
        border: `1px solid ${t.menuBdr}`,
        borderRadius: 10,
        boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.65)' : '0 8px 32px rgba(0,0,0,0.14)',
        overflow: 'hidden',
        animation: 'tbMenuIn 0.13s cubic-bezier(0.2,0,0,1)',
      }}>
        {children}
      </div>
    </>,
    document.body,
  );
};

// ─── CopyButton ───────────────────────────────────────────────────────────────

const CopyButton: React.FC<{ isDark: boolean; tableHtml: string }> = ({ isDark, tableHtml }) => {
  const [open,   setOpen]   = useState(false);
  const [copied, setCopied] = useState<CopyFormat | null>(null);
  const [pos,    setPos]    = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const t = tk(isDark);
  const isCopied = copied !== null;

  const toggle = () => {
    if (open) { setOpen(false); return; }
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: Math.min(r.left, window.innerWidth - 200) });
    setOpen(true);
  };

  const doCopy = async (fmt: CopyFormat) => {
    const { headers, rows } = parseTableForCopy(tableHtml);
    const text = fmt === 'md' ? toMarkdownTable(headers, rows) : toExcelTsv(headers, rows);
    await navigator.clipboard.writeText(text);
    setCopied(fmt); setOpen(false);
    setTimeout(() => setCopied(null), 2000);
  };

  const bg    = isCopied ? (isDark ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.1)') : t.btnBg;
  const color = isCopied ? '#22c55e' : t.btnClr;

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        title="Копировать"
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 3,
          padding: '6px 11px', minWidth: 64, height: 46,
          borderRadius: 9, border: `1px solid ${t.btnBdr}`,
          background: bg, color,
          cursor: 'pointer', flexShrink: 0, transition: 'all 0.14s',
        }}
        onMouseEnter={e => { if (!isCopied) (e.currentTarget as HTMLButtonElement).style.background = t.btnHov; }}
        onMouseLeave={e => { if (!isCopied) (e.currentTarget as HTMLButtonElement).style.background = bg; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isCopied ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} />}
          <ChevronDown size={10} style={{ opacity: 0.5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
        </div>
        <span style={{ fontSize: 10, lineHeight: 1 }}>{isCopied ? 'Скопировано' : 'Копировать'}</span>
      </button>

      {open && (
        <PortalMenu pos={pos} isDark={isDark} onClose={() => setOpen(false)}>
          {[
            { fmt: 'md'    as CopyFormat, label: 'Markdown',    sub: 'Для документов' },
            { fmt: 'excel' as CopyFormat, label: 'Excel / TSV', sub: 'Tab-separated'  },
          ].map(({ fmt, label, sub }) => (
            <button key={fmt} onClick={() => doCopy(fmt)} style={{
              width: '100%', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 2,
              border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left',
              color: t.menuItmClr, transition: 'background 0.1s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = t.menuItmHov; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 11, color: t.menuSubClr }}>{sub}</span>
            </button>
          ))}
        </PortalMenu>
      )}
    </>
  );
};

// ─── Mobile overflow menu (⋯ button) ─────────────────────────────────────────

interface MobileMenuProps {
  isDark: boolean;
  tableHtml: string;
  showFilters: boolean;
  onToggleFilters: () => void;
  activeFilterCount: number;
  onResetFilters: () => void;
  onFullscreen: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  isDark, tableHtml, showFilters, onToggleFilters,
  activeFilterCount, onResetFilters, onFullscreen,
}) => {
  const [open,   setOpen]   = useState(false);
  const [copied, setCopied] = useState<CopyFormat | null>(null);
  const [pos,    setPos]    = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const t = tk(isDark);
  const isCopied = copied !== null;

  const toggle = () => {
    if (open) { setOpen(false); return; }
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    // Align menu to right edge of button, clamped to viewport
    const menuW = 210;
    const left  = Math.min(r.right - menuW, window.innerWidth - menuW - 8);
    setPos({ top: r.bottom + 6, left: Math.max(8, left) });
    setOpen(true);
  };

  const doCopy = async (fmt: CopyFormat) => {
    const { headers, rows } = parseTableForCopy(tableHtml);
    const text = fmt === 'md' ? toMarkdownTable(headers, rows) : toExcelTsv(headers, rows);
    await navigator.clipboard.writeText(text);
    setCopied(fmt); setOpen(false);
    setTimeout(() => setCopied(null), 2000);
  };

  const sepStyle: React.CSSProperties = {
    height: 1, margin: '4px 0',
    background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,15,20,0.07)',
  };

  const itemStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    display: 'flex', alignItems: 'center', gap: 10,
    border: 'none', background: 'transparent', cursor: 'pointer',
    textAlign: 'left', color: t.menuItmClr,
    fontSize: 13, fontWeight: 400, transition: 'background 0.1s',
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        title="Ещё"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: 8,
          border: `1px solid ${open ? t.btnActBdr : t.btnBdr}`,
          background: open ? t.btnActBg : t.btnBg,
          color: open ? t.btnActClr : t.btnClr,
          cursor: 'pointer', flexShrink: 0, transition: 'all 0.14s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = t.btnHov; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = open ? t.btnActBg : t.btnBg; }}
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <PortalMenu pos={pos} isDark={isDark} onClose={() => setOpen(false)}>
          {/* Copy options */}
          <div style={{ padding: '6px 14px 4px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: t.menuSubClr }}>
            Копировать
          </div>
          {[
            { fmt: 'md'    as CopyFormat, label: isCopied ? 'Скопировано ✓' : 'Markdown',    sub: 'Для документов' },
            { fmt: 'excel' as CopyFormat, label: 'Excel / TSV', sub: 'Tab-separated' },
          ].map(({ fmt, label, sub }) => (
            <button key={fmt} onClick={() => doCopy(fmt)} style={itemStyle}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = t.menuItmHov; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <Copy size={14} style={{ opacity: 0.6, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{label}</span>
              <span style={{ fontSize: 11, color: t.menuSubClr, flexShrink: 0 }}>{sub}</span>
            </button>
          ))}

          <div style={sepStyle} />

          {/* Filter */}
          <button
            onClick={() => { onToggleFilters(); setOpen(false); }}
            style={{ ...itemStyle, color: showFilters ? t.btnActClr : t.menuItmClr, fontWeight: showFilters ? 600 : 400 }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = t.menuItmHov; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <Filter size={14} style={{ opacity: 0.6, flexShrink: 0 }} />
            <span style={{ flex: 1 }}>
              {activeFilterCount > 0 ? `Фильтры · ${activeFilterCount}` : 'Фильтры'}
            </span>
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={() => { onResetFilters(); setOpen(false); }}
              style={{ ...itemStyle, color: '#f87171' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = t.menuItmHov; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <X size={14} style={{ flexShrink: 0 }} />
              Сбросить фильтры
            </button>
          )}

          <div style={sepStyle} />

          {/* Fullscreen */}
          <button
            onClick={() => { onFullscreen(); setOpen(false); }}
            style={itemStyle}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = t.menuItmHov; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <Maximize2 size={14} style={{ opacity: 0.6, flexShrink: 0 }} />
            На весь экран
          </button>
          <div style={{ height: 4 }} />
        </PortalMenu>
      )}
    </>
  );
};

// ─── TableControlsBar ─────────────────────────────────────────────────────────

export const TableControlsBar: React.FC<TableControlsBarProps> = ({
  isDark, searchQuery, onSearchChange,
  showFilters, onToggleFilters, activeFilterCount, onResetFilters,
  onFullscreen, tableHtml,
}) => {
  const t = tk(isDark);
  const filterLabel = activeFilterCount > 0 ? `Фильтры · ${activeFilterCount}` : 'Фильтры';

  return (
    <>
      {/* Inject responsive style once */}
      <style>{`
        .tb-desktop-btns { display: flex; }
        .tb-mobile-btn   { display: none; }
        @media (max-width: 600px) {
          .tb-desktop-btns { display: none !important; }
          .tb-mobile-btn   { display: flex !important; }
        }
      `}</style>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 12px',
        borderBottom: `1px solid ${t.border}`,
        background: t.barBg,
        flexWrap: 'nowrap', minWidth: 0,
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 0', minWidth: 0 }}>
          <Search size={13} style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: t.plhClr, pointerEvents: 'none',
          }} />
          <input
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            style={{
              width: '100%', padding: '0 32px 0 30px', height: 36,
              borderRadius: 8, border: `1px solid ${t.inpBdr}`,
              background: t.inpBg, color: t.inpClr,
              fontSize: 13, outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { (e.target as HTMLInputElement).style.borderColor = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(15,15,20,0.22)'; }}
            onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = t.inpBdr; }}
          />
          {searchQuery && (
            <button onClick={() => onSearchChange('')} style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 2,
              color: t.plhClr, display: 'flex', alignItems: 'center',
            }}>
              <X size={12} />
            </button>
          )}
        </div>

        {/* Desktop buttons — icon top, label bottom */}
        <div className="tb-desktop-btns" style={{ alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <CopyButton isDark={isDark} tableHtml={tableHtml} />

          <PillBtn
            onClick={onToggleFilters}
            title="Фильтры и колонки"
            label={filterLabel}
            icon={<Filter size={14} />}
            isDark={isDark}
            active={showFilters || activeFilterCount > 0}
          />

          {activeFilterCount > 0 && (
            <PillBtn
              onClick={onResetFilters}
              title="Сбросить фильтры"
              label="Сбросить"
              icon={<X size={14} />}
              isDark={isDark}
              danger
            />
          )}

          <PillBtn
            onClick={onFullscreen}
            title="Развернуть таблицу"
            label="Развернуть"
            icon={<Maximize2 size={14} />}
            isDark={isDark}
          />
        </div>

        {/* Mobile — single ⋯ button */}
        <div className="tb-mobile-btn" style={{ flexShrink: 0 }}>
          <MobileMenu
            isDark={isDark}
            tableHtml={tableHtml}
            showFilters={showFilters}
            onToggleFilters={onToggleFilters}
            activeFilterCount={activeFilterCount}
            onResetFilters={onResetFilters}
            onFullscreen={onFullscreen}
          />
        </div>
      </div>
    </>
  );
};