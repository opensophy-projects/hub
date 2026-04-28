import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { makeTokens } from '@/shared/tokens/theme';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: (event?: React.MouseEvent) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const KEY_THEME  = 'theme';
const KEY_SEARCH = 'hub:search';
const KEY_THEME_COLORS = 'hub:theme-colors';

// Имя кастомного события для синхронизации между островами на одной странице
const THEME_CHANGE_EVENT = 'hub:theme-change';

const getInitialTheme = (): boolean => {
  if (globalThis.window === undefined) return true;
  return localStorage.getItem(KEY_THEME) !== 'light';
};

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
  if (globalThis.document === undefined) return;
  try {
    const raw = localStorage.getItem(KEY_THEME_COLORS);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { darkBg?: string; lightBg?: string };
    if (parsed.darkBg) {
      document.documentElement.style.setProperty('--hub-theme-dark-bg', parsed.darkBg);
    }
    if (parsed.lightBg) {
      document.documentElement.style.setProperty('--hub-theme-light-bg', parsed.lightBg);
    }
  } catch {}
}

// Сохраняет тему и уведомляет все острова и вкладки об изменении
function broadcastTheme(isDark: boolean) {
  try {
    localStorage.setItem(KEY_THEME, isDark ? 'dark' : 'light');
  } catch {}
  globalThis.window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { isDark } }));
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(getInitialTheme);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    applyThemeColorVars();
    applyTheme(isDark);
  }, [isDark]);

  useEffect(() => {
    // Синхронизация темы между островами на одной странице
    const onCustom = (e: Event) => {
      const { isDark: next } = (e as CustomEvent<{ isDark: boolean }>).detail;
      setIsDark(next);
      applyTheme(next);
    };

    // Синхронизация темы и поиска между вкладками
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY_THEME && e.newValue !== null) {
        const next = e.newValue !== 'light';
        setIsDark(next);
        applyTheme(next);
      }
      if (e.key === KEY_SEARCH && e.newValue !== null) {
        setIsSearchOpen(e.newValue === 'true');
      }
    };

    globalThis.window.addEventListener(THEME_CHANGE_EVENT, onCustom);
    globalThis.window.addEventListener('storage', onStorage);
    return () => {
      globalThis.window.removeEventListener(THEME_CHANGE_EVENT, onCustom);
      globalThis.window.removeEventListener('storage', onStorage);
    };
  }, []);

  const toggleTheme = useCallback((_event?: React.MouseEvent) => {
    const next = !isDark;
    setIsDark(next);
    applyTheme(next);
    broadcastTheme(next);
  }, [isDark]);

  const setSidebarOpen = useCallback((open: boolean) => {
    setIsSidebarOpen(open);
  }, []);

  const setSearchOpen = useCallback((open: boolean) => {
    setIsSearchOpen(open);
    try { localStorage.setItem(KEY_SEARCH, String(open)); } catch {}
    globalThis.window.dispatchEvent(
      new StorageEvent('storage', { key: KEY_SEARCH, newValue: String(open), storageArea: localStorage })
    );
  }, []);

  const value = useMemo<ThemeContextType>(
    () => ({ isDark, toggleTheme, isSidebarOpen, setSidebarOpen, isSearchOpen, setSearchOpen }),
    [isDark, toggleTheme, isSidebarOpen, setSidebarOpen, isSearchOpen, setSearchOpen]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
