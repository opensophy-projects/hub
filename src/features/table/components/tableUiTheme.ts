import { makeTokens, themed } from '@/shared/tokens/theme';

export interface TableUiTokens {
  modalBg: string;
  barBg: string;
  border: string;
  btnBg: string;
  btnBdr: string;
  btnHov: string;
  btnClr: string;
  btnActBg: string;
  btnActBdr: string;
  btnActClr: string;
  inpBg: string;
  inpBdr: string;
  inpFoc: string;
  inpClr: string;
  plhClr: string;
  menuBg: string;
  menuBdr: string;
  menuHov: string;
  menuClr: string;
  menuSub: string;
  dangerClr: string;
  greenBg: string;
  greenSub: string;
  copiedBg: string;
  copiedBdr: string;
}

export function getTableUiTokens(isDark: boolean): TableUiTokens {
  const t = makeTokens(isDark);
  return {
    modalBg: t.modalBg,
    barBg: t.surface,
    border: t.border,
    btnBg: themed(isDark, 'rgba(255,255,255,0.08)', 'rgba(0,0,0,0.07)'),
    btnBdr: themed(isDark, 'rgba(255,255,255,0.12)', 'rgba(0,0,0,0.12)'),
    btnHov: themed(isDark, 'rgba(255,255,255,0.14)', 'rgba(0,0,0,0.12)'),
    btnClr: themed(isDark, 'rgba(255,255,255,0.72)', 'rgba(0,0,0,0.68)'),
    btnActBg: themed(isDark, 'rgba(255,255,255,0.15)', 'rgba(0,0,0,0.12)'),
    btnActBdr: themed(isDark, 'rgba(255,255,255,0.22)', 'rgba(0,0,0,0.22)'),
    btnActClr: themed(isDark, '#ffffff', '#000000'),
    inpBg: t.inpBg,
    inpBdr: t.inpBdr,
    inpFoc: t.inpBdrFocus,
    inpClr: t.inpClr,
    plhClr: t.plhClr,
    menuBg: themed(isDark, '#222222', '#eceae6'),
    menuBdr: themed(isDark, 'rgba(255,255,255,0.12)', 'rgba(0,0,0,0.1)'),
    menuHov: themed(isDark, 'rgba(255,255,255,0.08)', 'rgba(0,0,0,0.06)'),
    menuClr: themed(isDark, 'rgba(255,255,255,0.85)', 'rgba(0,0,0,0.82)'),
    menuSub: themed(isDark, 'rgba(255,255,255,0.38)', 'rgba(0,0,0,0.38)'),
    dangerClr: themed(isDark, '#f87171', '#dc2626'),
    greenBg: themed(isDark, 'rgba(34,197,94,0.12)', 'rgba(34,197,94,0.1)'),
    greenSub: 'rgba(34,197,94,0.7)',
    copiedBg: themed(isDark, 'rgba(34,197,94,0.16)', 'rgba(34,197,94,0.14)'),
    copiedBdr: themed(isDark, 'rgba(34,197,94,0.4)', 'rgba(34,197,94,0.5)'),
  };
}
