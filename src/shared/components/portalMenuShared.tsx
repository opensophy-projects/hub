import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';
import { getTableUiTokens } from '@/features/table/components/tableUiTheme';

// ─── Портальное меню — закрывается при клике вне и при скролле ───────────────
export const PortalMenu: React.FC<{
  pos: { top: number; left: number };
  isDark: boolean;
  onClose: () => void;
  children: React.ReactNode;
  minWidth?: number;
}> = ({ pos, isDark, onClose, children, minWidth = 190 }) => {
  const t = getTableUiTokens(isDark);
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

// ─── Вспомогательные элементы меню ───────────────────────────────────────────
export function useMenuHelpers(isDark: boolean) {
  const t = getTableUiTokens(isDark);

  const sep = <div style={{ height: 1, margin: '3px 0', background: t.menuBdr }} />;

  const sLabel = (label: string) => (
    <div style={{ padding: '7px 14px 3px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: t.menuSub }}>
      {label}
    </div>
  );

  const mRow = (
    onClick: () => void,
    icon: React.ReactNode,
    label: string,
    sub?: string,
    green?: boolean,
    danger?: boolean,
  ) => {
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

  return { sep, sLabel, mRow, t };
}

// ─── Кнопка-триггер мобильного меню ⋯ ────────────────────────────────────────
export const MenuTriggerButton = React.forwardRef<HTMLButtonElement, {
  open: boolean;
  onClick: () => void;
  isDark: boolean;
}>(({ open, onClick, isDark }, ref) => {
  const t = getTableUiTokens(isDark);
  return (
    <button ref={ref} onClick={onClick} style={{
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
  );
});
MenuTriggerButton.displayName = 'MenuTriggerButton';