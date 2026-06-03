import React from 'react';
import { getTableUiTokens } from '@/features/table/components/tableUiTheme';

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

