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
    const onMouse = (e: MouseEvent) => {
      const target = e.target as unknown as Node;
      if (!ref.current?.contains(target)) onClose();
    };
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

// ─── Кнопка-триггер мобильного меню ⋯ ────────────────────────────────────────
export const MenuTriggerButton = React.forwardRef<HTMLButtonElement, {
  open: boolean;
  onClick: () => void;
  isDark: boolean;
}>(({ open, onClick, isDark }, ref) => {
  const t = getTableUiTokens(isDark);

  return (
    <button
      ref={ref}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 36, height: 36, borderRadius: 8,
        border: `1px solid ${open ? t.btnActBdr : t.btnBdr}`,
        background: open ? t.btnActBg : t.btnBg,
        color: open ? t.btnActClr : t.btnClr,
        cursor: 'pointer', flexShrink: 0, transition: 'all 0.13s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = t.btnHov; }}
      onMouseLeave={e => { e.currentTarget.style.background = open ? t.btnActBg : t.btnBg; }}
    >
      <MoreHorizontal size={16} />
    </button>
  );
});

MenuTriggerButton.displayName = 'MenuTriggerButton';