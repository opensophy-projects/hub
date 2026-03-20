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

// Custom event name для cross-island синхронизации внутри одной страницы
const THEME_CHANGE_EVENT = 'hub:theme-change';

const getInitialTheme = (): boolean => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(KEY_THEME) !== 'light';
};

export const applyTheme = (isDark: boolean) => {
  if (typeof document === 'undefined') return;
  if (isDark) {
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';
    document.documentElement.style.backgroundColor = '#0a0a0a';
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
    document.documentElement.style.backgroundColor = '#E8E7E3';
  }
};

function broadcastTheme(isDark: boolean) {
  try {
    localStorage.setItem(KEY_THEME, isDark ? 'dark' : 'light');
  } catch {}
  // CustomEvent работает внутри одной страницы между всеми React islands
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { isDark } }));
  // StorageEvent для других вкладок
  try {
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: KEY_THEME,
        newValue: isDark ? 'dark' : 'light',
        storageArea: localStorage,
      })
    );
  } catch {}
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(getInitialTheme);
  const [isSidebarOpen, setIsSidebarOpenState] = useState(false);
  const [isSearchOpen, setIsSearchOpenState] = useState(false);

  useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  useEffect(() => {
    // Слушаем CustomEvent — работает между islands на одной странице
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<{ isDark: boolean }>).detail;
      setIsDark(detail.isDark);
      applyTheme(detail.isDark);
    };

    // Слушаем StorageEvent — работает между вкладками
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

    window.addEventListener(THEME_CHANGE_EVENT, onCustom);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, onCustom);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const toggleTheme = useCallback((_event?: React.MouseEvent) => {
    const next = !isDark;
    setIsDark(next);
    applyTheme(next);
    broadcastTheme(next);
  }, [isDark]);

  const setSidebarOpen = useCallback((open: boolean) => {
    setIsSidebarOpenState(open);
  }, []);

  const setSearchOpen = useCallback((open: boolean) => {
    setIsSearchOpenState(open);
    try { localStorage.setItem(KEY_SEARCH, String(open)); } catch {}
    window.dispatchEvent(
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