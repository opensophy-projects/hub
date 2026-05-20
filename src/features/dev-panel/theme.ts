import React, { useEffect, useState } from 'react';
import { makeTokens } from '@/shared/tokens/theme';

export function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(() =>
    typeof document === 'undefined'
      ? true
      : document.documentElement.classList.contains('dark')
  );
  useEffect(() => {
    const onTheme = (e: Event) =>
      setIsDark((e as CustomEvent<{ isDark: boolean }>).detail.isDark);
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'theme') setIsDark(e.newValue !== 'light');
    };
    globalThis.addEventListener('hub:theme-change', onTheme);
    globalThis.addEventListener('storage', onStorage);
    return () => {
      globalThis.removeEventListener('hub:theme-change', onTheme);
      globalThis.removeEventListener('storage', onStorage);
    };
  }, []);
  return isDark;
}

export function makeT(isDark: boolean) {
  const t = makeTokens(isDark);
  return {
    ...t,
    mono: 'ui-monospace, "Cascadia Code", "Fira Code", monospace',
    inpBorder: t.inpBdr,
    editorFg: isDark ? '#e2e8f0' : '#1e293b',
  };
}

export type TTokens = ReturnType<typeof makeT>;
export const ThemeTokensContext = React.createContext<TTokens>(makeT(true));
