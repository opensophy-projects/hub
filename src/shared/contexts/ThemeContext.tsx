import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { applyTheme, applyThemeColorVars, persistTheme } from './themeUtils';
import { ThemeContext, type ThemeContextType } from './themeContextStore';

const KEY_THEME = 'theme';
const KEY_SEARCH = 'hub:search';
const THEME_CHANGE_EVENT = 'hub:theme-change';

const getInitialTheme = (): boolean => {
  if (globalThis.window === undefined) return true;
  return localStorage.getItem(KEY_THEME) !== 'light';
};

function broadcastTheme(isDark: boolean) {
  persistTheme(isDark);
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
    const onCustom = (e: Event) => {
      const { isDark: next } = (e as CustomEvent<{ isDark: boolean }>).detail;
      setIsDark(next);
      applyTheme(next);
    };

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

  const toggleTheme = useCallback(() => {
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
    try { localStorage.setItem(KEY_SEARCH, String(open)); } catch {
      // noop
    }
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
