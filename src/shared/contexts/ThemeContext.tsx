/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getInitialTheme = (): boolean => {
  if (globalThis.window === undefined) return true;
  return globalThis.localStorage.getItem('theme') !== 'light';
};

// Custom events for cross-island communication
const EVENTS = {
  SIDEBAR: 'hub:sidebar',
  SEARCH: 'hub:search',
  THEME: 'hub:theme',
} as const;

const dispatch = (event: string, detail: unknown) => {
  globalThis.window?.dispatchEvent(new CustomEvent(event, { detail }));
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(getInitialTheme);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Listen to cross-island events
  useEffect(() => {
    const onSidebar = (e: Event) => setIsSidebarOpen((e as CustomEvent<boolean>).detail);
    const onSearch = (e: Event) => setIsSearchOpen((e as CustomEvent<boolean>).detail);
    const onTheme = (e: Event) => setIsDark((e as CustomEvent<boolean>).detail);

    globalThis.window?.addEventListener(EVENTS.SIDEBAR, onSidebar);
    globalThis.window?.addEventListener(EVENTS.SEARCH, onSearch);
    globalThis.window?.addEventListener(EVENTS.THEME, onTheme);

    return () => {
      globalThis.window?.removeEventListener(EVENTS.SIDEBAR, onSidebar);
      globalThis.window?.removeEventListener(EVENTS.SEARCH, onSearch);
      globalThis.window?.removeEventListener(EVENTS.THEME, onTheme);
    };
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      globalThis.localStorage.setItem('theme', next ? 'dark' : 'light');
      dispatch(EVENTS.THEME, next);
      return next;
    });
  };

  const setSidebarOpen = (open: boolean) => {
    setIsSidebarOpen(open);
    dispatch(EVENTS.SIDEBAR, open);
  };

  const setSearchOpen = (open: boolean) => {
    setIsSearchOpen(open);
    dispatch(EVENTS.SEARCH, open);
  };

  const value = useMemo<ThemeContextType>(
    () => ({
      isDark,
      toggleTheme,
      isSidebarOpen,
      setSidebarOpen,
      isSearchOpen,
      setSearchOpen,
    }),
    [isDark, isSidebarOpen, isSearchOpen]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
