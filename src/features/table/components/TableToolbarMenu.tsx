import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Menu, Copy, Check, Filter, X, Maximize2, Minimize2, Scan, ScanLine } from 'lucide-react';
import { parseTableForCopy, toMd, toTsv, type CopyFormat } from '@/features/table/utils/copyUtils';
import { getTableUiTokens } from './tableUiTheme';

// ─── TableToolbarMenu ─────────────────────────────────────────────────────────
//
// Единая точка входа для всех действий над таблицей — копирование (md/excel),
// фильтры (тоггл панели), сброс фильтров, разворот/сворачивание в модалку,
// и (только внутри модалки) режим "показать всю таблицу целиком" — тоггл,
// который сначала переносит текст в ячейках, а затем, если всё равно не
// влезает по ширине, применяет масштаб, чтобы убрать горизонтальный скролл.

export interface TableToolbarMenuProps {
  readonly isDark: boolean;
  readonly tableHtml: string;
  readonly showFilters: boolean;
  readonly onToggleFilters: () => void;
  readonly activeFilterCount: number;
  readonly onResetFilters: () => void;
  /** Развернуть в модалку — не передавать, если уже внутри модалки. */
  readonly onFullscreen?: () => void;
  /** Закрыть модалку — передавать только внутри TableModal. */
  readonly onClose?: () => void;
  /** Режим "показать всю таблицу целиком" — передавать только внутри TableModal. */
  readonly fitToScreen?: boolean;
  readonly onToggleFitToScreen?: () => void;
}

type MenuItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  success?: boolean;
  active?: boolean;
};

export const TableToolbarMenu: React.FC<TableToolbarMenuProps> = ({
  isDark, tableHtml, showFilters, onToggleFilters,
  activeFilterCount, onResetFilters, onFullscreen, onClose,
  fitToScreen, onToggleFitToScreen,
}) => {
  const t = getTableUiTokens(isDark);
  const [open, setOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [copied, setCopied] = useState<CopyFormat | null>(null);
  const ref      = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const clearCloseTimer = () => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  };

  const positionMenu = () => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      const width = 220;
      setMenuPos({
        top:  rect.bottom + 6,
        left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
      });
    }
  };

  const openMenu = () => {
    clearCloseTimer();
    positionMenu();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target instanceof Node ? e.target : null;
      if (ref.current?.contains(target) || popupRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener('scroll', positionMenu, true);
    window.addEventListener('resize', positionMenu);
    return () => {
      window.removeEventListener('scroll', positionMenu, true);
      window.removeEventListener('resize', positionMenu);
    };
  }, [open]);

  useEffect(() => () => clearCloseTimer(), []);

  const toggleOpen = () => {
    if (open) { setOpen(false); return; }
    openMenu();
  };

  const doCopy = async (fmt: CopyFormat) => {
    const { headers, rows } = parseTableForCopy(tableHtml);
    await navigator.clipboard.writeText(fmt === 'md' ? toMd(headers, rows) : toTsv(headers, rows));
    setCopied(fmt);
    setTimeout(() => setCopied(null), 2000);
  };

  const filterLabel = activeFilterCount > 0 ? `Фильтры · ${activeFilterCount}` : 'Фильтры';

  const items: MenuItem[] = [
    {
      id: 'copy-md',
      label: copied === 'md' ? 'Скопировано!' : 'Копировать · Markdown',
      icon: copied === 'md' ? <Check size={13} style={{ color: '#22c55e' }} /> : <Copy size={13} style={{ opacity: 0.6 }} />,
      onClick: () => doCopy('md'),
      success: copied === 'md',
    },
    {
      id: 'copy-excel',
      label: copied === 'excel' ? 'Скопировано!' : 'Копировать · Excel/TSV',
      icon: copied === 'excel' ? <Check size={13} style={{ color: '#22c55e' }} /> : <Copy size={13} style={{ opacity: 0.6 }} />,
      onClick: () => doCopy('excel'),
      success: copied === 'excel',
    },
    {
      id: 'filters',
      label: filterLabel,
      icon: <Filter size={13} />,
      onClick: () => { onToggleFilters(); setOpen(false); },
    },
    ...(activeFilterCount > 0 ? [{
      id: 'reset-filters',
      label: 'Сбросить фильтры',
      icon: <X size={13} />,
      onClick: () => { onResetFilters(); setOpen(false); },
      danger: true,
    }] : []),
    ...(onToggleFitToScreen ? [{
      id: 'fit-to-screen',
      label: fitToScreen ? 'Обычный скролл' : 'Показать всю таблицу',
      icon: fitToScreen ? <ScanLine size={13} /> : <Scan size={13} />,
      onClick: () => { onToggleFitToScreen(); setOpen(false); },
      active: fitToScreen,
    }] : []),
    ...(onFullscreen ? [{
      id: 'fullscreen',
      label: 'Развернуть',
      icon: <Maximize2 size={13} />,
      onClick: () => { onFullscreen(); setOpen(false); },
    }] : []),
    ...(onClose ? [{
      id: 'close',
      label: 'Закрыть',
      icon: <Minimize2 size={13} />,
      onClick: () => { onClose(); setOpen(false); },
    }] : []),
  ];

  const menuActive = open || showFilters || activeFilterCount > 0 || !!fitToScreen;

  return (
    <div
      ref={ref}
      style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        onClick={toggleOpen}
        title="Меню"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: 8,
          border: `1px solid ${menuActive ? t.btnBdr : 'transparent'}`,
          background: menuActive ? t.btnBg : 'transparent',
          color: t.btnClr, cursor: 'pointer', flexShrink: 0,
          transition: 'background 0.13s, border-color 0.13s',
        }}
      >
        <Menu size={16} />
      </button>

      {open && createPortal(
        <div
          ref={popupRef}
          onMouseEnter={clearCloseTimer}
          onMouseLeave={scheduleClose}
          style={{
            position: 'fixed',
            top:          menuPos.top,
            left:         menuPos.left,
            width:        '220px',
            borderRadius: '12px',
            border:       `1px solid ${t.menuBdr}`,
            background:   t.menuBg,
            boxShadow:    t.elevatedShadow,
            zIndex:       100020,
            overflow:     'hidden',
            animation:    'tableMenuIn 0.13s ease',
          }}
        >
          <style>{`
            @keyframes tableMenuIn {
              from { opacity:0; transform:translateY(-4px) scale(0.98); }
              to   { opacity:1; transform:translateY(0)   scale(1); }
            }
          `}</style>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px' }}>
            {items.map(item => {
              const isActive = hoveredId === item.id;
              let color = isActive ? t.menuClr : t.btnClr;
              if (item.success) color = '#22c55e';
              else if (item.danger) color = t.dangerClr;
              else if (item.active) color = t.btnActClr;

              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    width:      '100%',
                    display:    'flex',
                    alignItems: 'center',
                    gap:        '0.5rem',
                    padding:    '0.55rem 0.7rem',
                    fontSize:   '0.875rem',
                    textAlign:  'left',
                    cursor:     'pointer',
                    color,
                    fontWeight: isActive || item.active ? 600 : 400,
                    border: `1px solid ${isActive || item.active ? t.btnBdr : 'transparent'}`,
                    background: item.active && !isActive ? t.btnBg : 'transparent',
                    borderRadius: '8px',
                  }}
                >
                  {item.icon}
                  <span style={{ wordBreak: 'break-word', lineHeight: 1.3 }}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};