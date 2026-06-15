import React, { useState, useRef } from 'react';
import { Filter, X, Maximize2, Copy, Check, ChevronDown, Search } from 'lucide-react';
import { parseTableForCopy, toMd, toTsv, type CopyFormat } from '@/features/table/utils/copyUtils';
import { getTableUiTokens } from './tableUiTheme';
import { PortalMenu, MenuTriggerButton } from '@/shared/components/portalMenuShared';
import { useMenuHelpers } from '@/shared/components/portalMenuHelpers';

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

const tk = getTableUiTokens;

// ─── Кнопка-пилюля: иконка сверху, подпись снизу ─────────────────────────────
const Pill: React.FC<{
  onClick: () => void; title: string; label: string;
  icon: React.ReactNode; isDark: boolean;
  active?: boolean; danger?: boolean;
}> = ({ onClick, title, label, icon, isDark, active, danger }) => {
  const t = tk(isDark);
  const bg    = active ? t.btnActBg  : t.btnBg;
  const bdr   = active ? t.btnActBdr : t.btnBdr;
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
      onMouseEnter={e => { e.currentTarget.style.background = t.btnHov; }}
      onMouseLeave={e => { e.currentTarget.style.background = bg; }}
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
        onMouseEnter={e => { if (!isCopied) e.currentTarget.style.background = t.btnHov; }}
        onMouseLeave={e => { if (!isCopied) e.currentTarget.style.background = bgVal; }}
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
              onMouseEnter={e => { e.currentTarget.style.background = tk(isDark).menuHov; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
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
  onToggleFilters: () => void;
  activeFilterCount: number; onResetFilters: () => void;
  onFullscreen: () => void;
}> = ({ isDark, tableHtml, onToggleFilters, activeFilterCount, onResetFilters, onFullscreen }) => {
  const [open, setOpen]     = useState(false);
  const [copied, setCopied] = useState<CopyFormat | null>(null);
  const [pos, setPos]       = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLButtonElement>(null);
  const { sep, sLabel, mRow } = useMenuHelpers(isDark);

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

  return (
    <>
      <MenuTriggerButton ref={ref} open={open} onClick={toggle} isDark={isDark} />
      {open && (
        <PortalMenu pos={pos} isDark={isDark} onClose={() => setOpen(false)} minWidth={220}>
          {sLabel('Копировать')}
          {mRow(() => doCopy('md'),
            copied === 'md' ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} />,
            copied === 'md' ? 'Скопировано!' : 'Markdown',
            copied === 'md' ? undefined : 'Для документов',
            copied === 'md')}
          {mRow(() => doCopy('excel'),
            copied === 'excel' ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} />,
            copied === 'excel' ? 'Скопировано!' : 'Excel / TSV',
            copied === 'excel' ? undefined : 'Tab-separated',
            copied === 'excel')}
          {sep}
          {mRow(() => { onToggleFilters(); setOpen(false); }, <Filter size={14} />,
            activeFilterCount > 0 ? `Фильтры · ${activeFilterCount}` : 'Фильтры')}
          {activeFilterCount > 0 && mRow(() => { onResetFilters(); setOpen(false); }, <X size={14} />, 'Сбросить фильтры', undefined, false, true)}
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
          <MobileMenu isDark={isDark} tableHtml={tableHtml} onToggleFilters={onToggleFilters} activeFilterCount={activeFilterCount} onResetFilters={onResetFilters} onFullscreen={onFullscreen} />
        </div>
      </div>
    </>
  );
};