import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Filter, X, Maximize2, Copy, Check, ChevronDown, Search, MoreHorizontal } from 'lucide-react';
import { parseTableForCopy, toMd, toTsv, type CopyFormat } from '@/features/table/utils/copyUtils';
import { makeTokens, themed } from '@/shared/tokens/theme';

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

function tk(isDark: boolean) {
  const t = makeTokens(isDark);
  const shared = {
    barBg:     t.surface,
    border:    t.border,
    inpBg:     t.inpBg,
    inpBdr:    t.inpBdr,
    inpFoc:    t.inpBdrFocus,
    inpClr:    t.inpClr,
    plhClr:    t.plhClr,
  };
  return {
    ...shared,
    btnBg: themed(isDark, 'rgba(255,255,255,0.08)', 'rgba(0,0,0,0.07)'),
    btnBdr: themed(isDark, 'rgba(255,255,255,0.12)', 'rgba(0,0,0,0.12)'),
    btnHov: themed(isDark, 'rgba(255,255,255,0.14)', 'rgba(0,0,0,0.12)'),
    btnClr: themed(isDark, 'rgba(255,255,255,0.72)', 'rgba(0,0,0,0.68)'),
    btnActBg: themed(isDark, 'rgba(255,255,255,0.15)', 'rgba(0,0,0,0.12)'),
    btnActBdr: themed(isDark, 'rgba(255,255,255,0.22)', 'rgba(0,0,0,0.22)'),
    btnActClr: themed(isDark, '#ffffff', '#000000'),
    menuBg: themed(isDark, '#1a1a1a', '#eceae6'),
    menuBdr: themed(isDark, 'rgba(255,255,255,0.1)', 'rgba(0,0,0,0.1)'),
    menuHov: themed(isDark, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.06)'),
    menuClr: themed(isDark, 'rgba(255,255,255,0.82)', 'rgba(0,0,0,0.82)'),
    menuSub: themed(isDark, 'rgba(255,255,255,0.35)', 'rgba(0,0,0,0.38)'),
    dangerClr: themed(isDark, '#f87171', '#dc2626'),
    greenBg: themed(isDark, 'rgba(34,197,94,0.12)', 'rgba(34,197,94,0.1)'),
    greenSub: 'rgba(34,197,94,0.7)',
    copiedBg: themed(isDark, 'rgba(34,197,94,0.16)', 'rgba(34,197,94,0.14)'),
    copiedBdr: themed(isDark, 'rgba(34,197,94,0.4)', 'rgba(34,197,94,0.5)'),
  };
}

// ─── Портальное меню — закрывается при скролле ────────────────────────────────
const PortalMenu: React.FC<{
  pos: { top: number; left: number }; isDark: boolean;
  onClose: () => void; children: React.ReactNode; minWidth?: number;
}> = ({ pos, isDark, onClose, children, minWidth = 190 }) => {
  const t = tk(isDark);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMouse = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    const onScroll = () => onClose();
    document.addEventListener('mousedown', onMouse);
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener('mousedown', onMouse);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [onClose]);

  return createPortal(
    <>
      <style>{`@keyframes tbIn{from{opacity:0;transform:translateY(-5px) scale(0.97)}to{opacity:1;transform:none}}`}</style>
      <div ref={ref} style={{
        position: 'fixed', top: pos.top, left: pos.left, minWidth, zIndex: 9999,
        background: t.menuBg, border: `1px solid ${t.menuBdr}`,
        borderRadius: 10,
        boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.7)' : '0 8px 28px rgba(0,0,0,0.16)',
        overflow: 'hidden', animation: 'tbIn 0.13s cubic-bezier(0.2,0,0,1)',
      }}>
        {children}
      </div>
    </>,
    document.body,
  );
};

// ─── Кнопка-пилюля: иконка сверху, подпись снизу ─────────────────────────────
const Pill: React.FC<{
  onClick: () => void; title: string; label: string;
  icon: React.ReactNode; isDark: boolean;
  active?: boolean; danger?: boolean;
}> = ({ onClick, title, label, icon, isDark, active, danger }) => {
  const t = tk(isDark);
  const bg  = active ? t.btnActBg  : t.btnBg;
  const bdr = active ? t.btnActBdr : t.btnBdr;
  let color: string;
  if (danger)      color = t.dangerClr;
  else if (active) color = t.btnActClr;
  else             color = t.btnClr;

  return (
    <button onClick={onClick} title={title} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 3,
      padding: '5px 10px', minWidth: 48, height: 44,
      borderRadius: 8, border: `1px solid ${bdr}`,
      background: bg, color, cursor: 'pointer', flexShrink: 0, transition: 'background 0.13s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = t.btnHov; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = bg; }}
    >
      {icon}
      <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, lineHeight: 1, whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  );
};

// ─── Кнопка копирования (десктоп) ─────────────────────────────────────────────
const CopyButton: React.FC<{ isDark: boolean; tableHtml: string }> = ({ isDark, tableHtml }) => {
  const [open, setOpen]     = useState(false);
  const [copied, setCopied] = useState<CopyFormat | null>(null);
  const [pos, setPos]       = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLButtonElement>(null);
  const t = tk(isDark);
  const isCopied = !!copied;

  const toggle = () => {
    if (open) { setOpen(false); return; }
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ top: r.bottom + 6, left: Math.min(r.left, window.innerWidth - 202) });
    setOpen(true);
  };

  const doCopy = async (fmt: CopyFormat) => {
    const { headers, rows } = parseTableForCopy(tableHtml);
    await navigator.clipboard.writeText(fmt === 'md' ? toMd(headers, rows) : toTsv(headers, rows));
    setCopied(fmt); setOpen(false);
    setTimeout(() => setCopied(null), 2000);
  };

  const bgVal = isCopied ? t.copiedBg  : t.btnBg;
  const bdr   = isCopied ? t.copiedBdr : t.btnBdr;
  const color = isCopied ? '#22c55e'   : t.btnClr;

  return (
    <>
      <button ref={ref} onClick={toggle} title="Копировать" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 3,
        padding: '5px 10px', minWidth: 64, height: 44,
        borderRadius: 8, border: `1px solid ${bdr}`,
        background: bgVal, color, cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
      }}
        onMouseEnter={e => { if (!isCopied) (e.currentTarget as HTMLButtonElement).style.background = t.btnHov; }}
        onMouseLeave={e => { if (!isCopied) (e.currentTarget as HTMLButtonElement).style.background = bgVal; }}
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
        <PortalMenu pos={pos} isDark={isDark} onClose={() => setOpen(false)}>
          {(['md', 'excel'] as CopyFormat[]).map(fmt => (
            <button key={fmt} onClick={() => doCopy(fmt)} style={{
              width: '100%', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 2,
              border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left',
              color: tk(isDark).menuClr, transition: 'background 0.1s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = tk(isDark).menuHov; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 13, fontWeight: 500 }}>{fmt === 'md' ? 'Markdown' : 'Excel / TSV'}</span>
              <span style={{ fontSize: 11, color: tk(isDark).menuSub }}>{fmt === 'md' ? 'Для документов' : 'Tab-separated'}</span>
            </button>
          ))}
        </PortalMenu>
      )}
    </>
  );
};

// ─── Мобильное меню ⋯ — закрывается при скролле ──────────────────────────────
const MobileMenu: React.FC<{
  isDark: boolean; tableHtml: string;
  showFilters: boolean; onToggleFilters: () => void;
  activeFilterCount: number; onResetFilters: () => void;
  onFullscreen: () => void;
}> = ({ isDark, tableHtml, showFilters, onToggleFilters, activeFilterCount, onResetFilters, onFullscreen }) => {
  const [open, setOpen]     = useState(false);
  const [copied, setCopied] = useState<CopyFormat | null>(null);
  const [pos, setPos]       = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLButtonElement>(null);
  const t = tk(isDark);

  const toggle = () => {
    if (open) { setOpen(false); return; }
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const mw = 220;
    setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(r.right - mw, window.innerWidth - mw - 8)) });
    setOpen(true);
  };

  const doCopy = async (fmt: CopyFormat) => {
    const { headers, rows } = parseTableForCopy(tableHtml);
    await navigator.clipboard.writeText(fmt === 'md' ? toMd(headers, rows) : toTsv(headers, rows));
    setCopied(fmt);
    setTimeout(() => { setCopied(null); setOpen(false); }, 1500);
  };

  const sep = <div style={{ height: 1, margin: '3px 0', background: t.menuBdr }} />;

  const sLabel = (s: string) => (
    <div style={{ padding: '7px 14px 3px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: t.menuSub }}>{s}</div>
  );

  const mRow = (onClick: () => void, icon: React.ReactNode, label: string, sub?: string, danger?: boolean, green?: boolean) => {
    let rowColor: string;
    if (green)       rowColor = '#22c55e';
    else if (danger) rowColor = t.dangerClr;
    else             rowColor = t.menuClr;

    const rowBg      = green ? t.greenBg : 'transparent';
    const rowBgHover = green ? t.greenBg : t.menuHov;

    return (
      <button onClick={onClick} style={{
        width: '100%', padding: sub ? '10px 14px' : '11px 14px',
        display: 'flex', flexDirection: sub ? 'column' : 'row',
        alignItems: sub ? 'flex-start' : 'center', gap: sub ? 2 : 10,
        border: 'none', background: rowBg,
        cursor: 'pointer', textAlign: 'left',
        color: rowColor,
        fontSize: 13, fontWeight: green ? 600 : 400, transition: 'background 0.1s',
      }}
        onMouseEnter={e => { if (!green) (e.currentTarget as HTMLButtonElement).style.background = rowBgHover; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = rowBg; }}
      >
        {!sub && <span style={{ opacity: green ? 1 : 0.6, flexShrink: 0, display: 'flex' }}>{icon}</span>}
        <span style={{ flex: 1, fontWeight: 500 }}>{label}</span>
        {sub && <span style={{ fontSize: 11, color: green ? t.greenSub : t.menuSub }}>{sub}</span>}
      </button>
    );
  };

  return (
    <>
      <button ref={ref} onClick={toggle} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 36, height: 36, borderRadius: 8,
        border: `1px solid ${open ? t.btnActBdr : t.btnBdr}`,
        background: open ? t.btnActBg : t.btnBg,
        color: open ? t.btnActClr : t.btnClr,
        cursor: 'pointer', flexShrink: 0, transition: 'all 0.13s',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = t.btnHov; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = open ? t.btnActBg : t.btnBg; }}
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <PortalMenu pos={pos} isDark={isDark} onClose={() => setOpen(false)} minWidth={220}>
          {sLabel('Копировать')}
          {mRow(() => doCopy('md'),
            copied === 'md' ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} />,
            copied === 'md' ? 'Скопировано!' : 'Markdown',
            copied === 'md' ? undefined : 'Для документов',
            false, copied === 'md')}
          {mRow(() => doCopy('excel'),
            copied === 'excel' ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} />,
            copied === 'excel' ? 'Скопировано!' : 'Excel / TSV',
            copied === 'excel' ? undefined : 'Tab-separated',
            false, copied === 'excel')}
          {sep}
          {mRow(() => { onToggleFilters(); setOpen(false); }, <Filter size={14} />,
            activeFilterCount > 0 ? `Фильтры · ${activeFilterCount}` : 'Фильтры')}
          {activeFilterCount > 0 && mRow(() => { onResetFilters(); setOpen(false); }, <X size={14} />, 'Сбросить фильтры', undefined, true)}
          {sep}
          {mRow(() => { onFullscreen(); setOpen(false); }, <Maximize2 size={14} />, 'На весь экран')}
          <div style={{ height: 4 }} />
        </PortalMenu>
      )}
    </>
  );
};

// ─── Панель управления таблицей ───────────────────────────────────────────────
export const TableControlsBar: React.FC<TableControlsBarProps> = ({
  isDark, searchQuery, onSearchChange,
  showFilters, onToggleFilters, activeFilterCount, onResetFilters,
  onFullscreen, tableHtml,
}) => {
  const t = tk(isDark);
  const filterLabel = activeFilterCount > 0 ? `Фильтры · ${activeFilterCount}` : 'Фильтры';

  return (
    <>
      <style>{`.tb-desk{display:flex!important}.tb-mob{display:none!important}@media(max-width:480px){.tb-desk{display:none!important}.tb-mob{display:flex!important}}`}</style>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 8px',
        borderBottom: `1px solid ${t.border}`,
        background: t.barBg,
        flexWrap: 'nowrap',
        minWidth: 0,
        width: '100%',
        boxSizing: 'border-box' as const,
      }}>
        <div style={{ position: 'relative', flex: '1 1 0', minWidth: 0 }}>
          <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: t.plhClr, pointerEvents: 'none' }} />
          <input type="text" placeholder="Поиск..." value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            style={{
              width: '100%', padding: '0 28px 0 26px', height: 36, borderRadius: 8,
              border: `1px solid ${t.inpBdr}`, background: t.inpBg, color: t.inpClr,
              fontSize: 13, outline: 'none', boxSizing: 'border-box' as const,
              transition: 'border-color 0.15s', minWidth: 0,
            }}
            onFocus={e => { (e.target as HTMLInputElement).style.borderColor = t.inpFoc; }}
            onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = t.inpBdr; }}
          />
          {searchQuery && (
            <button onClick={() => onSearchChange('')} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: t.plhClr, display: 'flex' }}>
              <X size={12} />
            </button>
          )}
        </div>

        <div className="tb-desk" style={{ alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <CopyButton isDark={isDark} tableHtml={tableHtml} />
          <Pill onClick={onToggleFilters} title="Фильтры" label={filterLabel} icon={<Filter size={14} />} isDark={isDark} active={showFilters || activeFilterCount > 0} />
          {activeFilterCount > 0 && <Pill onClick={onResetFilters} title="Сбросить" label="Сбросить" icon={<X size={14} />} isDark={isDark} danger />}
          <Pill onClick={onFullscreen} title="На весь экран" label="Развернуть" icon={<Maximize2 size={14} />} isDark={isDark} />
        </div>

        <div className="tb-mob" style={{ flexShrink: 0 }}>
          <MobileMenu isDark={isDark} tableHtml={tableHtml} showFilters={showFilters} onToggleFilters={onToggleFilters} activeFilterCount={activeFilterCount} onResetFilters={onResetFilters} onFullscreen={onFullscreen} />
        </div>
      </div>
    </>
  );
};
