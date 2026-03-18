import React from 'react';

interface IconButtonProps {
  /** Иконка — любой ReactNode (Lucide, SVG и т.д.) */
  icon: React.ReactNode;
  /** Подпись под иконкой */
  label: string;
  onClick: () => void;
  isDark: boolean;
  title?: string;
  active?: boolean;
  danger?: boolean;
  /** Ref для позиционирования дропдаунов */
  btnRef?: React.RefObject<HTMLButtonElement>;
}

/**
 * Универсальная кнопка «иконка сверху + лейбл снизу».
 *
 * Используется в:
 * - TableControlsBar (Pill / ToolbarButton)
 * - FilterSection (ToolbarButton)
 * - TableModal (Pill)
 * - MermaidDiagram (ToolBtn)
 * - CodeBlock (ToolbarButton)
 */
const IconButton: React.FC<IconButtonProps> = ({
  icon,
  label,
  onClick,
  isDark,
  title,
  active = false,
  danger = false,
  btnRef,
}) => {
  const [hovered, setHovered] = React.useState(false);

  const bg = (() => {
    if (active) return isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
    if (hovered) return isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)';
    return isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  })();

  const border = active
    ? isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)'
    : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  const color = (() => {
    if (danger) return isDark ? '#f87171' : '#dc2626';
    if (active) return isDark ? '#ffffff' : '#000000';
    return isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)';
  })();

  return (
    <button
      ref={btnRef}
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        padding: '5px 10px',
        minWidth: 44,
        height: 44,
        borderRadius: 8,
        border: `1px solid ${border}`,
        background: bg,
        color,
        cursor: 'pointer',
        transition: 'all 0.14s',
        flexShrink: 0,
      }}
    >
      {icon}
      <span style={{ fontSize: 9, fontWeight: active ? 600 : 400, lineHeight: 1, whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </button>
  );
};

export default IconButton;