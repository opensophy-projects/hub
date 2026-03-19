/**
 * ARCHITECTURE NOTE:
 * Astro with client:only="react" renders each island in an isolated React tree.
 * There is NO shared React context between TopNavbar, DocContent, SearchWrapper etc.
 *
 * Solution: each island wraps itself in ThemeProvider.
 * Cross-island state sync uses localStorage + manually dispatched StorageEvent.
 */
import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: (event?: React.MouseEvent) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const KEY_THEME   = 'theme';
const KEY_SIDEBAR = 'hub:sidebar';
const KEY_SEARCH  = 'hub:search';

const getInitialTheme = (): boolean => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(KEY_THEME) !== 'light';
};

// On desktop (≥768px), sidebar is always visible and persistent —
// read synchronously so it's correct on the very first render, preventing flash.
const getInitialSidebarOpen = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 768;
};

const applyTheme = (isDark: boolean) => {
  if (typeof document === 'undefined') return;
  if (isDark) {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
  }
};

function broadcastStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
    window.dispatchEvent(
      new StorageEvent('storage', { key, newValue: value, storageArea: localStorage })
    );
  } catch {
    // SSR / private browsing — ignore
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(getInitialTheme);
  // Desktop sidebar is always open from the start — no flash
  const [isSidebarOpen, setIsSidebarOpenState] = useState<boolean>(getInitialSidebarOpen);
  const [isSearchOpen,  setIsSearchOpenState]  = useState(false);

  useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  // Keep sidebar state in sync with window resize
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpenState(true);
      }
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Listen for cross-island changes via StorageEvent
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY_THEME && e.newValue !== null) {
        const next = e.newValue !== 'light';
        setIsDark(next);
        applyTheme(next);
      }
      if (e.key === KEY_SIDEBAR && e.newValue !== null) {
        // On desktop, never close via storage event
        if (window.innerWidth >= 768) return;
        setIsSidebarOpenState(e.newValue === 'true');
      }
      if (e.key === KEY_SEARCH && e.newValue !== null) {
        setIsSearchOpenState(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Simple instant toggle — no View Transitions, no circles, no animations
  const toggleTheme = useCallback((_event?: React.MouseEvent) => {
    const next = !isDark;
    broadcastStorage(KEY_THEME, next ? 'dark' : 'light');
    setIsDark(next);
    applyTheme(next);
  }, [isDark]);

  const setSidebarOpen = useCallback((open: boolean) => {
    // On desktop, sidebar is always open
    if (window.innerWidth >= 768 && !open) return;
    setIsSidebarOpenState(open);
    broadcastStorage(KEY_SIDEBAR, String(open));
  }, []);

  const setSearchOpen = useCallback((open: boolean) => {
    setIsSearchOpenState(open);
    broadcastStorage(KEY_SEARCH, String(open));
  }, []);

  const value = useMemo<ThemeContextType>(
    () => ({
      isDark,
      toggleTheme,
      isSidebarOpen,
      setSidebarOpen,
      isSearchOpen,
      setSearchOpen,
    }),
    [isDark, toggleTheme, isSidebarOpen, setSidebarOpen, isSearchOpen, setSearchOpen]
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