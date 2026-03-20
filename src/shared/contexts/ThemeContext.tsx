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

const KEY_THEME  = 'theme';
const KEY_SEARCH = 'hub:search';

const getInitialTheme = (): boolean => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(KEY_THEME) !== 'light';
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
    // SSR / private browsing
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(getInitialTheme);
  // isSidebarOpen здесь только для legacy совместимости с MobileNavbar
  // Реальное управление sidebar — через useIsDesktop в каждом компоненте
  const [isSidebarOpen, setIsSidebarOpenState] = useState(false);
  const [isSearchOpen, setIsSearchOpenState] = useState(false);

  useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY_THEME && e.newValue !== null) {
        const next = e.newValue !== 'light';
        setIsDark(next);
        applyTheme(next);
      }
      if (e.key === KEY_SEARCH && e.newValue !== null) {
        setIsSearchOpenState(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggleTheme = useCallback((_event?: React.MouseEvent) => {
    const next = !isDark;
    broadcastStorage(KEY_THEME, next ? 'dark' : 'light');
    setIsDark(next);
    applyTheme(next);
  }, [isDark]);

  const setSidebarOpen = useCallback((open: boolean) => {
    setIsSidebarOpenState(open);
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