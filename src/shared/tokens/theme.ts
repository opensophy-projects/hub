export type ThemeMode = 'dark' | 'light';

export type ThemeColorKey =
  | 'bg'
  | 'bgPage'
  | 'surface'
  | 'surfaceHov'
  | 'border'
  | 'borderStrong'
  | 'borderElevated'
  | 'fg'
  | 'fgMuted'
  | 'fgSub'
  | 'accent'
  | 'accentSoft'
  | 'accentBorder'
  | 'success'
  | 'danger'
  | 'warning'
  | 'inpBg'
  | 'inpBdr'
  | 'inpBdrFocus'
  | 'inpClr'
  | 'plhClr'
  | 'thumb'
  | 'thumbHov'
  | 'track'
  | 'codeBg'
  | 'editorBg'
  | 'lineNum'
  | 'dropdownBg'
  | 'modalBg';

export const THEME_COLOR_STORAGE_KEY = 'hub:theme-color-overrides';

export const THEME_COLOR_META: Record<ThemeColorKey, { label: string; usage: string }> = {
  bg: { label: 'Базовый фон', usage: 'Основной фон панелей и контейнеров' },
  bgPage: { label: 'Фон страницы', usage: 'Фон html/body и крупных страниц' },
  surface: { label: 'Surface', usage: 'Шапки, карточки, внутренние блоки' },
  surfaceHov: { label: 'Surface hover', usage: 'Hover у панелей и кнопок' },
  border: { label: 'Border', usage: 'Обычные границы' },
  borderStrong: { label: 'Border strong', usage: 'Активные/усиленные границы' },
  borderElevated: { label: 'Border elevated', usage: 'Выделенные элементы навигации' },
  fg: { label: 'Текст основной', usage: 'Заголовки и активные тексты' },
  fgMuted: { label: 'Текст muted', usage: 'Вторичный текст' },
  fgSub: { label: 'Текст sub', usage: 'Подписи и подсказки' },
  accent: { label: 'Accent', usage: 'Акцентный цвет текста/иконок' },
  accentSoft: { label: 'Accent soft', usage: 'Мягкие акцентные подложки' },
  accentBorder: { label: 'Accent border', usage: 'Акцентные границы' },
  success: { label: 'Success', usage: 'Успешные состояния' },
  danger: { label: 'Danger', usage: 'Ошибки и удаление' },
  warning: { label: 'Warning', usage: 'Предупреждения' },
  inpBg: { label: 'Input bg', usage: 'Фон инпутов' },
  inpBdr: { label: 'Input border', usage: 'Границы инпутов' },
  inpBdrFocus: { label: 'Input border focus', usage: 'Граница инпута в фокусе' },
  inpClr: { label: 'Input text', usage: 'Цвет текста в полях' },
  plhClr: { label: 'Placeholder', usage: 'Цвет placeholder' },
  thumb: { label: 'Scrollbar thumb', usage: 'Ползунок скроллбара' },
  thumbHov: { label: 'Scrollbar thumb hover', usage: 'Ползунок скроллбара при hover' },
  track: { label: 'Scrollbar track', usage: 'Трек скроллбара' },
  codeBg: { label: 'Code bg', usage: 'Фон блоков кода' },
  editorBg: { label: 'Editor bg', usage: 'Фон редакторных областей' },
  lineNum: { label: 'Line numbers', usage: 'Цвет номеров строк кода' },
  dropdownBg: { label: 'Dropdown bg', usage: 'Фон dropdown-меню' },
  modalBg: { label: 'Modal bg', usage: 'Фон модалок' },
};

export const DEFAULT_THEME_COLORS: Record<ThemeMode, Record<ThemeColorKey, string>> = {
  dark: {
    bg: '#0a0a0a', bgPage: '#0a0a0a', surface: '#111111', surfaceHov: '#1a1a1a',
    border: 'rgba(255,255,255,0.08)', borderStrong: 'rgba(255,255,255,0.16)', borderElevated: 'rgba(255,255,255,0.18)',
    fg: '#e8e8e8', fgMuted: 'rgba(255,255,255,0.42)', fgSub: 'rgba(255,255,255,0.22)',
    accent: '#ffffff', accentSoft: 'rgba(255,255,255,0.08)', accentBorder: 'rgba(255,255,255,0.2)',
    success: '#22c55e', danger: '#ef4444', warning: '#f59e0b',
    inpBg: '#1a1a1a', inpBdr: 'rgba(255,255,255,0.12)', inpBdrFocus: 'rgba(255,255,255,0.26)', inpClr: 'rgba(255,255,255,0.88)', plhClr: 'rgba(255,255,255,0.28)',
    thumb: 'rgba(255,255,255,0.14)', thumbHov: 'rgba(255,255,255,0.26)', track: 'rgba(255,255,255,0.04)',
    codeBg: '#0d0d0d', editorBg: '#0d0d0e', lineNum: '#555', dropdownBg: '#222222', modalBg: '#0a0a0a',
  },
  light: {
    bg: '#E8E7E3', bgPage: '#E8E7E3', surface: '#d8d7d3', surfaceHov: '#dddcd8',
    border: 'rgba(0,0,0,0.09)', borderStrong: 'rgba(0,0,0,0.2)', borderElevated: 'rgba(0,0,0,0.2)',
    fg: '#111111', fgMuted: 'rgba(0,0,0,0.45)', fgSub: 'rgba(0,0,0,0.28)',
    accent: '#000000', accentSoft: 'rgba(0,0,0,0.07)', accentBorder: 'rgba(0,0,0,0.25)',
    success: '#16a34a', danger: '#dc2626', warning: '#d97706',
    inpBg: '#E8E7E3', inpBdr: 'rgba(0,0,0,0.12)', inpBdrFocus: 'rgba(0,0,0,0.28)', inpClr: '#000000', plhClr: 'rgba(0,0,0,0.35)',
    thumb: 'rgba(0,0,0,0.16)', thumbHov: 'rgba(0,0,0,0.28)', track: 'rgba(0,0,0,0.04)',
    codeBg: '#ECEAE5', editorBg: '#eceae5', lineNum: '#999', dropdownBg: '#eceae6', modalBg: '#E8E7E3',
  },
};

export type ThemeColorOverrides = {
  dark: Partial<Record<ThemeColorKey, string>>;
  light: Partial<Record<ThemeColorKey, string>>;
};

function getVarName(mode: ThemeMode, key: ThemeColorKey): string {
  return `--hub-theme-${mode}-${key}`;
}

function getVarValue(mode: ThemeMode, key: ThemeColorKey): string {
  return `var(${getVarName(mode, key)}, ${DEFAULT_THEME_COLORS[mode][key]})`;
}

export const DARK = {
  bg: getVarValue('dark', 'bg'),
  bgPage: getVarValue('dark', 'bgPage'),
  surface: getVarValue('dark', 'surface'),
  surfaceHov: getVarValue('dark', 'surfaceHov'),
  border: getVarValue('dark', 'border'),
  borderStrong: getVarValue('dark', 'borderStrong'),
  borderElevated: getVarValue('dark', 'borderElevated'),
  fg: getVarValue('dark', 'fg'),
  fgMuted: getVarValue('dark', 'fgMuted'),
  fgSub: getVarValue('dark', 'fgSub'),
  accent: getVarValue('dark', 'accent'),
  accentSoft: getVarValue('dark', 'accentSoft'),
  accentBorder: getVarValue('dark', 'accentBorder'),
  success: getVarValue('dark', 'success'),
  danger: getVarValue('dark', 'danger'),
  warning: getVarValue('dark', 'warning'),
  inpBg: getVarValue('dark', 'inpBg'),
  inpBdr: getVarValue('dark', 'inpBdr'),
  inpBdrFocus: getVarValue('dark', 'inpBdrFocus'),
  inpClr: getVarValue('dark', 'inpClr'),
  plhClr: getVarValue('dark', 'plhClr'),
  shadow: '0 8px 40px rgba(0,0,0,0.7)',
  shadowElevated: '0 8px 24px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.04)',
  shadowSoft: '0 2px 10px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.03)',
  thumb: getVarValue('dark', 'thumb'),
  thumbHov: getVarValue('dark', 'thumbHov'),
  track: getVarValue('dark', 'track'),
  codeBg: getVarValue('dark', 'codeBg'),
  editorBg: getVarValue('dark', 'editorBg'),
  lineNum: getVarValue('dark', 'lineNum'),
  dropdownBg: getVarValue('dark', 'dropdownBg'),
  modalBg: getVarValue('dark', 'modalBg'),
  isDark: true,
} as const;

export const LIGHT = {
  bg: getVarValue('light', 'bg'),
  bgPage: getVarValue('light', 'bgPage'),
  surface: getVarValue('light', 'surface'),
  surfaceHov: getVarValue('light', 'surfaceHov'),
  border: getVarValue('light', 'border'),
  borderStrong: getVarValue('light', 'borderStrong'),
  borderElevated: getVarValue('light', 'borderElevated'),
  fg: getVarValue('light', 'fg'),
  fgMuted: getVarValue('light', 'fgMuted'),
  fgSub: getVarValue('light', 'fgSub'),
  accent: getVarValue('light', 'accent'),
  accentSoft: getVarValue('light', 'accentSoft'),
  accentBorder: getVarValue('light', 'accentBorder'),
  success: getVarValue('light', 'success'),
  danger: getVarValue('light', 'danger'),
  warning: getVarValue('light', 'warning'),
  inpBg: getVarValue('light', 'inpBg'),
  inpBdr: getVarValue('light', 'inpBdr'),
  inpBdrFocus: getVarValue('light', 'inpBdrFocus'),
  inpClr: getVarValue('light', 'inpClr'),
  plhClr: getVarValue('light', 'plhClr'),
  shadow: '0 8px 32px rgba(0,0,0,0.18)',
  shadowElevated: '0 10px 24px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.72)',
  shadowSoft: '0 3px 10px rgba(0,0,0,0.11), inset 0 1px 0 rgba(255,255,255,0.65)',
  thumb: getVarValue('light', 'thumb'),
  thumbHov: getVarValue('light', 'thumbHov'),
  track: getVarValue('light', 'track'),
  codeBg: getVarValue('light', 'codeBg'),
  editorBg: getVarValue('light', 'editorBg'),
  lineNum: getVarValue('light', 'lineNum'),
  dropdownBg: getVarValue('light', 'dropdownBg'),
  modalBg: getVarValue('light', 'modalBg'),
  isDark: false,
} as const;

export type ThemeTokens = typeof DARK;

export function readThemeColorOverrides(): ThemeColorOverrides {
  if (typeof window === 'undefined') return { dark: {}, light: {} };
  try {
    const raw = localStorage.getItem(THEME_COLOR_STORAGE_KEY);
    if (!raw) return { dark: {}, light: {} };
    const parsed = JSON.parse(raw) as Partial<ThemeColorOverrides>;
    return { dark: parsed.dark ?? {}, light: parsed.light ?? {} };
  } catch {
    return { dark: {}, light: {} };
  }
}

export function applyThemeColorOverrides(overrides: ThemeColorOverrides = readThemeColorOverrides()) {
  if (typeof document === 'undefined') return;
  for (const mode of ['dark', 'light'] as const) {
    for (const key of Object.keys(DEFAULT_THEME_COLORS[mode]) as ThemeColorKey[]) {
      const val = overrides[mode][key];
      if (val) {
        document.documentElement.style.setProperty(getVarName(mode, key), val);
      } else {
        document.documentElement.style.removeProperty(getVarName(mode, key));
      }
    }
  }
}

export function makeTokens(isDark: boolean): ThemeTokens {
  return isDark ? DARK : LIGHT;
}
