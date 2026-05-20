import { applyThemeColorOverrides, makeTokens } from '@/shared/tokens/theme';

const KEY_THEME = 'theme';

export const applyTheme = (isDark: boolean) => {
  if (globalThis.document === undefined) return;
  const t = makeTokens(isDark);
  if (isDark) {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
    document.documentElement.style.backgroundColor = t.bgPage;
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
    document.documentElement.style.backgroundColor = t.bgPage;
  }
};

export function applyThemeColorVars() {
  applyThemeColorOverrides();
}

export function persistTheme(isDark: boolean) {
  try {
    localStorage.setItem(KEY_THEME, isDark ? 'dark' : 'light');
  } catch {
    // noop
  }
}
