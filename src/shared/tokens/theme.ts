export type ThemeMode = 'dark' | 'light';

export type ThemeLayerKey = 'layer1' | 'layer2' | 'layer3' | 'layer4';

export type ThemeColorKey =
  | ThemeLayerKey
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

export const THEME_LAYER_META: Record<ThemeLayerKey, { label: string; usage: string }> = {
  layer1: { label: 'Фон · слой 1', usage: 'Основной задний фон страницы' },
  layer2: { label: 'Фон · слой 2', usage: 'Навигация, карточки, панели и компоненты' },
  layer3: { label: 'Фон · слой 3', usage: 'Иконки, кнопки, hover/elevated-состояния' },
  layer4: { label: 'Фон · слой 4', usage: 'Кнопки навигации: категории, каналы, поиск, секции, поиск ИИ' },
};

export const THEME_COLOR_META = THEME_LAYER_META as Record<ThemeColorKey, { label: string; usage: string }>;

export const THEME_LAYERS = {
  dark: {
    layer1: '#0a0a0a',
    layer2: '#111111',
    layer3: '#1a1a1a',
    layer4: '#ffffff',
  },
  light: {
    layer1: '#E8E7E3',
    layer2: '#d8d7d3',
    layer3: '#dddcd8',
    layer4: '#000000',
  },
} as const satisfies Record<ThemeMode, Record<ThemeLayerKey, string>>;

const SEMANTIC_COLORS = {
  dark: {
    border: 'rgba(255,255,255,0.08)', borderStrong: 'rgba(255,255,255,0.16)', borderElevated: 'rgba(255,255,255,0.18)',
    fg: '#e8e8e8', fgMuted: 'rgba(255,255,255,0.42)', fgSub: 'rgba(255,255,255,0.22)',
    accentSoft: 'rgba(255,255,255,0.08)', accentBorder: 'rgba(255,255,255,0.2)',
    success: '#22c55e', danger: '#ef4444', warning: '#f59e0b',
    inpBdr: 'rgba(255,255,255,0.12)', inpBdrFocus: 'rgba(255,255,255,0.26)', inpClr: 'rgba(255,255,255,0.88)', plhClr: 'rgba(255,255,255,0.28)',
    thumb: 'rgba(255,255,255,0.14)', thumbHov: 'rgba(255,255,255,0.26)', track: 'rgba(255,255,255,0.04)',
    lineNum: '#555',
  },
  light: {
    border: 'rgba(0,0,0,0.09)', borderStrong: 'rgba(0,0,0,0.2)', borderElevated: 'rgba(0,0,0,0.2)',
    fg: '#111111', fgMuted: 'rgba(0,0,0,0.45)', fgSub: 'rgba(0,0,0,0.28)',
    accentSoft: 'rgba(0,0,0,0.07)', accentBorder: 'rgba(0,0,0,0.25)',
    success: '#16a34a', danger: '#dc2626', warning: '#d97706',
    inpBdr: 'rgba(0,0,0,0.12)', inpBdrFocus: 'rgba(0,0,0,0.28)', inpClr: '#000000', plhClr: 'rgba(0,0,0,0.35)',
    thumb: 'rgba(0,0,0,0.16)', thumbHov: 'rgba(0,0,0,0.28)', track: 'rgba(0,0,0,0.04)',
    lineNum: '#999',
  },
} as const;

function buildDefaultTheme(mode: ThemeMode): Record<ThemeColorKey, string> {
  const layer = THEME_LAYERS[mode];
  const semantic = SEMANTIC_COLORS[mode];
  return {
    ...layer,
    bg: layer.layer1,
    bgPage: layer.layer1,
    surface: layer.layer2,
    surfaceHov: layer.layer3,
    accent: layer.layer4,
    inpBg: layer.layer3,
    codeBg: layer.layer2,
    editorBg: layer.layer2,
    dropdownBg: layer.layer2,
    modalBg: layer.layer1,
    ...semantic,
  };
}

export const DEFAULT_THEME_COLORS: Record<ThemeMode, Record<ThemeColorKey, string>> = {
  dark: buildDefaultTheme('dark'),
  light: buildDefaultTheme('light'),
};

export type ThemeColorOverrides = {
  dark: Partial<Record<ThemeLayerKey, string>>;
  light: Partial<Record<ThemeLayerKey, string>>;
};

const THEME_LAYER_KEYS = Object.keys(THEME_LAYERS.dark) as ThemeLayerKey[];
const THEME_COLOR_KEYS = Object.keys(DEFAULT_THEME_COLORS.dark) as ThemeColorKey[];
const SHADOWS = {
  dark: {
    shadow: '0 8px 40px rgba(0,0,0,0.7)',
    shadowElevated: '0 8px 24px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.04)',
    shadowSoft: '0 2px 10px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.03)',
  },
  light: {
    shadow: '0 8px 32px rgba(0,0,0,0.18)',
    shadowElevated: '0 10px 24px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.72)',
    shadowSoft: '0 3px 10px rgba(0,0,0,0.11), inset 0 1px 0 rgba(255,255,255,0.65)',
  },
} as const;

function getVarName(mode: ThemeMode, key: ThemeLayerKey): string {
  return `--hub-theme-${mode}-${key}`;
}

function getLayerValue(mode: ThemeMode, key: ThemeLayerKey): string {
  return `var(${getVarName(mode, key)}, ${THEME_LAYERS[mode][key]})`;
}

function buildTheme(mode: ThemeMode) {
  const layer = Object.fromEntries(THEME_LAYER_KEYS.map((key) => [key, getLayerValue(mode, key)])) as Record<ThemeLayerKey, string>;
  const defaults = DEFAULT_THEME_COLORS[mode];
  const colors = Object.fromEntries(THEME_COLOR_KEYS.map((key) => [key, defaults[key]])) as Record<ThemeColorKey, string>;
  colors.layer1 = layer.layer1;
  colors.layer2 = layer.layer2;
  colors.layer3 = layer.layer3;
  colors.layer4 = layer.layer4;
  colors.bg = layer.layer1;
  colors.bgPage = layer.layer1;
  colors.surface = layer.layer2;
  colors.surfaceHov = layer.layer3;
  colors.accent = layer.layer4;
  colors.inpBg = layer.layer3;
  colors.codeBg = layer.layer2;
  colors.editorBg = layer.layer2;
  colors.dropdownBg = layer.layer2;
  colors.modalBg = layer.layer1;
  return {
    ...colors,
    ...SHADOWS[mode],
    isDark: mode === 'dark',
  } as const;
}

export const DARK = buildTheme('dark');
export const LIGHT = buildTheme('light');

export type ThemeTokens = typeof DARK;

export function readThemeColorOverrides(): ThemeColorOverrides {
  if (globalThis.window === undefined) return { dark: {}, light: {} };
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
  if (globalThis.document === undefined) return;
  for (const mode of ['dark', 'light'] as const) {
    for (const key of THEME_LAYER_KEYS) {
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

export function themed<T>(isDark: boolean, dark: T, light: T): T {
  return isDark ? dark : light;
}
